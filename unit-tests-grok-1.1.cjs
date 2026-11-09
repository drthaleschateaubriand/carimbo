/* Testes da versao Grok 1.1 (nuvem): resumo da pagina e conversa com a janela-ponte por postMessage.
   jsdom, sem rede: window.open devolve uma janela falsa (outro jsdom) que registra o que recebe. */
const fs=require('fs'); const path=require('path'); const {JSDOM,VirtualConsole}=require('jsdom'); const assert=require('node:assert/strict');
const SRC_FILE=process.env.CARIMBAR_FILE||'carimbar-grok-1.1.js'; const LABEL=process.env.LABEL||'grok-1.1'; const src=fs.readFileSync(SRC_FILE,'utf8');
const PAGINAS=process.env.PAGINAS_DIR||'/workspace/carimbar-e2e';
const PONTE='https://drthaleschateaubriand.github.io/carimbo/ponte.html', ORIG='https://drthaleschateaubriand.github.io';
const results=[]; const wait=ms=>new Promise(r=>setTimeout(r,ms));
function fixture(html,opts={}){
  const dialogs=[],vc=new VirtualConsole();
  const dom=new JSDOM('<!doctype html><html><head><title>Teste</title></head><body>'+html+'</body></html>',{url:'https://sistema.exemplo.test/form',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
  const w=dom.window,d=w.document; w.alert=t=>dialogs.push(t); w.confirm=()=>true;
  const fake=new JSDOM('<!doctype html><p>ponte</p>',{url:PONTE}).window; const recebidas=[]; fake.postMessage=(msg,origin)=>recebidas.push({msg:JSON.parse(JSON.stringify(msg)),origin});
  const abertas=[]; w.open=(u,n,f)=>{abertas.push({u,n,f}); return opts.bloquear?null:fake};
  if(opts.ponteUrl) w.CARIMBAR_PONTE_URL=opts.ponteUrl;
  w.eval(src);
  const btn=l=>[...d.querySelectorAll('#carimbarBar button')].find(b=>b.textContent===l);
  const daPonte=(data,origin=ORIG,source=fake)=>w.dispatchEvent(new w.MessageEvent('message',{data,origin,source}));
  return {dom,w,d,dialogs,fake,recebidas,abertas,btn,daPonte,bar:()=>d.getElementById('carimbarBar')};
}
async function conectar(f){ f.btn('ENVIAR P/ IA').onclick(); f.daPonte({carimbar:'pronta'}); f.daPonte({carimbar:'conectado'}); await wait(5); return f.recebidas.find(r=>r.msg.carimbar==='extracao'); }
async function test(id,nome,fn){try{const ev=await fn()||{};results.push({id,nome,status:'passou',ev})}catch(e){results.push({id,nome,status:'falhou',erro:e.message})}}
const eq=(a,b)=>assert.deepEqual(a,b);
const CAD='<form><mat-form-field><label for="n1">Nome Completo</label><input id="n1" name="fullName" required value="Já digitado"></mat-form-field>'+
 '<input type="hidden" name="segredo" value="x"><input type="password" name="senha" value="nao-enviar">'+
 '<select name="nationality"><option value="">--</option><option value="BR" selected>Brasileira</option><option value="EX">Estrangeira</option></select>'+
 '<mat-form-field><mat-label>Sexo</mat-label><mat-select name="gender"><span class="mat-select-value-text">Feminino</span></mat-select></mat-form-field>'+
 '<mat-checkbox name="isMinor" class="mat-checkbox-checked"><input type="checkbox" checked>Menor de idade</mat-checkbox>'+
 '<input name="bornDate" type="date" aria-label="Data de nascimento"><textarea name="obs" placeholder="Observações"></textarea>'+
 '<ckeditor name="annotations"><div class="ck-editor__editable" id="ed1">Texto antigo</div></ckeditor></form>';
(async()=>{
await test('11-01','Barra mostra Grok 1.1 e o botão ENVIAR P/ IA',async()=>{const f=fixture('<input name="fullName">');eq([!!f.btn('ENVIAR P/ IA'),f.d.getElementById('carimbarVersao').textContent],[true,'Grok 1.1'])});
await test('11-02','ENVIAR abre a ponte padrão com nome fixo, sem rede no favorito',async()=>{const f=fixture('<input name="fullName">');f.btn('ENVIAR P/ IA').onclick();eq([f.abertas.length,f.abertas[0].u,f.abertas[0].n],[1,PONTE,'carimbarPonte']);eq(/fetch\(|XMLHttpRequest|WebSocket|supabase\.co/.test(src),false)});
await test('11-03','Antes do aperto de mão nada é enviado; "pronta" → "ola" só para a origem da ponte',async()=>{const f=fixture(CAD);f.btn('ENVIAR P/ IA').onclick();eq(f.recebidas.length,0);f.daPonte({carimbar:'pronta'});eq(f.recebidas.map(r=>[r.msg.carimbar,r.origin]),[['ola',ORIG]])});
await test('11-04','Após "conectado" envia o resumo da página (extracao) para a origem da ponte',async()=>{const f=fixture(CAD);const r=await conectar(f);assert.ok(r);eq([r.origin,r.msg.pagina,r.msg.url,r.msg.conteudo.carimbar,r.msg.conteudo.tiposDetectados],[ORIG,'cadastro,exames','https://sistema.exemplo.test/form','Grok 1.1',['cadastro','exames']]);return {conteudo:r.msg.conteudo}});
await test('11-05','Resumo: rótulos, valores, opções, checkbox, mat-select, editor; sem hidden, sem senha, sem HTML',async()=>{const f=fixture(CAD);const c=(await conectar(f)).msg.conteudo;const by=n=>c.campos.find(x=>x.name===n);
 eq(by('fullName'),{name:'fullName',id:'n1',campo:'text',rotulo:'Nome Completo',valor:'Já digitado',obrigatorio:true});
 eq(by('segredo'),undefined); eq(by('senha').valor,undefined); eq(by('nationality').opcoes,['--','Brasileira','Estrangeira']); eq(by('nationality').valor,'Brasileira');
 eq([by('gender').campo,by('gender').valor,by('gender').rotulo],['mat-select','Feminino','Sexo']); eq([by('isMinor').campo,by('isMinor').marcado],['mat-checkbox',true]);
 eq(by('bornDate').rotulo,'Data de nascimento'); eq(by('obs').rotulo,'Observações'); eq(c.editores,[{editor:1,name:'annotations',dentroDe:'ed1',texto:'Texto antigo',semInstancia:true}]);
 eq(Array.isArray(c.chavesCarimbar.cadastro),true); eq(JSON.stringify(c).includes('<'),false); eq(JSON.stringify(c).includes('nao-enviar'),false)});
await test('11-06','Campos da própria barra não entram no resumo',async()=>{const f=fixture('<input name="fullName">');const c=(await conectar(f)).msg.conteudo;eq(c.campos.map(x=>x.name),['fullName'])});
await test('11-07','Carimbo da ponte preenche sozinho e devolve "carimbado" com o resumo',async()=>{const f=fixture('<input name="fullName"><input name="document"><input type="date" name="bornDate">');await conectar(f);f.daPonte({carimbar:'carimbo',id:7,json:{nome:'Mariana Luz Teixeira Fictícia',cpf:'111.444.777-35',nasc:'14/03/1985'}});await wait(50);
 eq([f.d.querySelector('[name=fullName]').value,f.d.querySelector('[name=document]').value,f.d.querySelector('[name=bornDate]').value],['Mariana Luz Teixeira Fictícia','111.444.777-35','1985-03-14']);
 eq(JSON.parse(f.w.sessionStorage.getItem('carimbarJSON')).nome,'Mariana Luz Teixeira Fictícia'); const c=f.recebidas.find(r=>r.msg.carimbar==='carimbado'); eq([c.msg.id,c.origin,/preenchidos: 3/.test(c.msg.resumo)],[7,ORIG,true]); eq(/Recebido da IA/.test(f.d.getElementById('carimbarResumo').textContent),true); eq(f.d.getElementById('carimbarIA').textContent,'IA: carimbo aplicado')});
await test('11-08','Carimbo como texto JSON também funciona',async()=>{const f=fixture('<input name="fatPct"><input name="weight">');await conectar(f);f.daPonte({carimbar:'carimbo',id:8,json:'{"peso":"79.2","gordura":"36.4"}'});await wait(50);eq([f.d.querySelector('[name=weight]').value,f.d.querySelector('[name=fatPct]').value],['79.2','36.4'])});
await test('11-09','Carimbo inválido não preenche e avisa',async()=>{const f=fixture('<input name="fullName">');await conectar(f);f.w.sessionStorage.setItem('carimbarJSON','{"nome":"Anterior"}');for(const j of ['nao e json','[1,2]',null])f.daPonte({carimbar:'carimbo',id:9,json:j});await wait(50);eq(f.d.querySelector('[name=fullName]').value,'');eq(f.recebidas.filter(r=>r.msg.carimbar==='carimbado').map(r=>r.msg.resumo),['JSON invalido','JSON invalido','JSON invalido']);eq(f.w.sessionStorage.getItem('carimbarJSON'),'{"nome":"Anterior"}')});
await test('11-10','Mensagem de outra origem é ignorada',async()=>{const f=fixture('<input name="fullName">');await conectar(f);f.daPonte({carimbar:'carimbo',id:1,json:{nome:'Invasor'}},'https://malicioso.exemplo');f.daPonte({carimbar:'carimbo',id:1,json:{nome:'Invasor'}},'null');await wait(50);eq(f.d.querySelector('[name=fullName]').value,'')});
await test('11-11','Mensagem de outra janela (mesma origem) é ignorada',async()=>{const f=fixture('<input name="fullName">');await conectar(f);const outra=new JSDOM('',{url:PONTE}).window;f.daPonte({carimbar:'carimbo',id:1,json:{nome:'Invasor'}},ORIG,outra);f.daPonte({carimbar:'carimbo',id:1,json:{nome:'Invasor'}},ORIG,f.w);await wait(50);eq(f.d.querySelector('[name=fullName]').value,'')});
await test('11-12','Sem ponte aberta, nenhuma mensagem é aceita',async()=>{const f=fixture('<input name="fullName">');f.daPonte({carimbar:'carimbo',id:1,json:{nome:'X'}});await wait(30);eq([f.d.querySelector('[name=fullName]').value,f.recebidas.length],['',0])});
await test('11-13','Dois carimbos seguidos são aplicados em ordem, sem sobreposição',async()=>{const f=fixture('<input name="fullName"><mat-select name="gender"></mat-select><div class="cdk-overlay-container"><mat-option>Feminino</mat-option><mat-option>Masculino</mat-option></div>');await conectar(f);
 f.daPonte({carimbar:'carimbo',id:1,json:{nome:'Primeira Fictícia',sexo:'Feminino'}});f.daPonte({carimbar:'carimbo',id:2,json:{nome:'Segunda Fictícia'}});await wait(1500);eq(f.d.querySelector('[name=fullName]').value,'Segunda Fictícia');eq(f.recebidas.filter(r=>r.msg.carimbar==='carimbado').map(r=>r.msg.id),[1,2])});
await test('11-14','Pop-up bloqueado: avisa e não quebra',async()=>{const f=fixture('<input name="fullName">',{bloquear:true});f.btn('ENVIAR P/ IA').onclick();eq([f.dialogs.length,/pop-up/.test(f.dialogs[0]),f.d.getElementById('carimbarIA').textContent],[1,true,'IA: janela bloqueada'])});
await test('11-15','Endereço de ponte trocado pela página só é aceito em localhost (testes)',async()=>{const f1=fixture('<input name="fullName">',{ponteUrl:'https://malicioso.exemplo/ponte.html'});f1.btn('ENVIAR P/ IA').onclick();const f2=fixture('<input name="fullName">',{ponteUrl:'http://localhost:8799/ponte.html'});f2.btn('ENVIAR P/ IA').onclick();eq([f1.abertas[0].u,f2.abertas[0].u],[PONTE,'http://localhost:8799/ponte.html'])});
await test('11-16','Fechar a barra (X) desliga o recebimento',async()=>{const f=fixture('<input name="fullName">');await conectar(f);[...f.d.querySelectorAll('#carimbarBar button')].find(b=>b.textContent==='X').onclick();f.daPonte({carimbar:'carimbo',id:1,json:{nome:'Depois do X'}});await wait(30);eq(f.d.querySelector('[name=fullName]').value,'')});
await test('11-17','Erro vindo da ponte aparece na barra',async()=>{const f=fixture('<input name="fullName">');await conectar(f);f.daPonte({carimbar:'erro',mensagem:'sem internet'});eq([/Nuvem: sem internet/.test(f.d.getElementById('carimbarResumo').textContent),f.d.getElementById('carimbarIA').textContent],[true,'IA: erro'])});
await test('11-18','"enviado" muda o estado para aguardando a IA',async()=>{const f=fixture('<input name="fullName">');await conectar(f);f.daPonte({carimbar:'enviado',id:3});eq(f.d.getElementById('carimbarIA').textContent,'IA: aguardando a IA')});
await test('11-19','Segundo ENVIAR com ponte conectada envia direto, sem reabrir',async()=>{const f=fixture('<input name="fullName">');await conectar(f);f.btn('ENVIAR P/ IA');f.d.querySelector('#carimbarEnviarIA').onclick();eq([f.abertas.length,f.recebidas.filter(r=>r.msg.carimbar==='extracao').length],[1,2])});
const reais=[['pagina1.html','cadastro','fullName'],['pagina4.html','antropometria','fatPct'],['pagina5.html','evolucao','description'],['pagina2.html','prescricao','special'],['pagina3.html','exames','clinicalIndication']];
for(const [arq,tipo,campo] of reais){const p=path.join(PAGINAS,arq);if(!fs.existsSync(p)){results.push({id:'11-real-'+tipo,nome:'Página real capturada ('+tipo+')',status:'nao testado',erro:'arquivo de página capturada ausente'});continue}
 await test('11-real-'+tipo,'Resumo de página real capturada ('+tipo+') é compacto e tem os campos',async()=>{const html=fs.readFileSync(p,'utf8');const f=fixture(html);const c=(await conectar(f)).msg.conteudo;const kb=JSON.stringify(c).length/1024;assert.ok(c.tiposDetectados.includes(tipo),'tipo '+c.tiposDetectados);assert.ok(c.campos.concat(c.editores).some(x=>x.name===campo||x.formcontrolname===campo),'campo '+campo);assert.ok(kb<40,'tamanho '+kb.toFixed(1)+' KB');return {htmlKB:+(html.length/1024).toFixed(1),resumoKB:+kb.toFixed(1),campos:c.campos.length,editores:c.editores.length}})}
const passou=results.filter(r=>r.status==='passou').length;
fs.writeFileSync('resultados-'+LABEL+'.json',JSON.stringify({file:SRC_FILE,sha256:require('crypto').createHash('sha256').update(src).digest('hex'),results},null,2));
console.log(JSON.stringify({arquivo:SRC_FILE,passou,total:results.length,falhas:results.filter(r=>r.status!=='passou'),reais:results.filter(r=>r.id.startsWith('11-real')).map(r=>[r.id,r.ev])},null,1));
process.exit(passou===results.length?0:1);
})();

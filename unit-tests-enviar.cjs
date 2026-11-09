/* Testes da pagina enviar.html (Grok 1.2): leitura do JSON do chat, links #j= / #t=, pareamento e envio. */
const fs=require('fs'); const path=require('path'); const {JSDOM,VirtualConsole}=require('jsdom'); const assert=require('node:assert/strict'); const util=require('util');
const DIR=process.env.ENVIAR_DIR||__dirname;
const P=require(path.join(DIR,'enviar-parse.js'));
const results=[]; const eq=(a,b)=>assert.deepEqual(a,b); const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function test(id,nome,fn){try{const ev=await fn()||{};results.push({id,nome,status:'passou',ev})}catch(e){results.push({id,nome,status:'falhou',erro:e.message})}}
const COD='AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abcd';
const html=fs.readFileSync(path.join(DIR,'enviar.html'),'utf8').replace(/<script src="[^"]+"><\/script>/g,'');
const srcParse=fs.readFileSync(path.join(DIR,'enviar-parse.js'),'utf8'), srcPag=fs.readFileSync(path.join(DIR,'enviar.js'),'utf8');
function pagina(hash,opts={}){
  const vc=new VirtualConsole(); const dom=new JSDOM(html,{url:'https://drthaleschateaubriand.github.io/carimbo/enviar.html'+(hash||''),runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
  const w=dom.window; w.TextDecoder=util.TextDecoder; w.TextEncoder=util.TextEncoder; w.confirm=()=>true;
  if(opts.codigo) w.localStorage.setItem('carimbarCodigoPareado',opts.codigo);
  const chamadas=[]; w.fetch=async(u,o)=>{chamadas.push({u,o:{...o,body:JSON.parse(o.body)}}); if(opts.falhar) return {ok:false,status:400,json:async()=>({message:'sessao nao encontrada: pareie de novo pela janela-ponte'})}; return {ok:true,status:200,json:async()=>123}};
  if(opts.clip!==undefined) Object.defineProperty(w.navigator,'clipboard',{value:{readText:async()=>{if(opts.clip instanceof Error)throw opts.clip;return opts.clip}},configurable:true});
  w.eval(srcParse); w.eval(srcPag);
  const $=id=>w.document.getElementById(id);
  const digitar=t=>{$('texto').value=t;$('texto').dispatchEvent(new w.Event('input'))};
  return {dom,w,$,chamadas,digitar};
}
const PAC={nome:'Mariana Luz Teixeira Fictícia',cpf:'111.444.777-35',nasc:'14/03/1985',sexo:'Feminino',menorDeIdade:false,prescricao:'1. Metformina 500 mg\n2. Vitamina D3',especial:false,exames:'Hemograma, TSH',evolucao:'EVOLUÇÃO (FICTÍCIA)\nBom estado geral.',peso:'79.2',altura:'165',cCintura:'88',obs:'Teste'};
const GROK='Perfeito! Aqui está o JSON final para o CARIMBAR:\n\n```json\n'+JSON.stringify(PAC,null,2)+'\n```\n\nCopie o bloco acima e cole na página de envio. Qualquer ajuste, é só falar {se precisar}.';
(async()=>{
await test('E01','JSON puro',()=>eq(P.extrairJSON(JSON.stringify(PAC)).json,PAC));
await test('E02','Bloco ```json com texto antes e depois (como o Grok escreve)',()=>eq(P.extrairJSON(GROK).json,PAC));
await test('E03','Bloco ``` sem linguagem',()=>eq(P.extrairJSON('Segue:\n```\n{"peso":"80"}\n```').json,{peso:'80'}));
await test('E04','JSON no meio de texto, com chaves e aspas escapadas dentro de strings',()=>eq(P.extrairJSON('Ok, enviando {"evolucao":"Paciente diz \\"melhor\\" {sic}","peso":"70"} pronto').json,{evolucao:'Paciente diz "melhor" {sic}',peso:'70'}));
await test('E05','Ignora {texto} antes do JSON e pega o primeiro objeto válido',()=>eq(P.extrairJSON('Use o formato {chave: valor}. Resultado: {"nome":"A"} e {"nome":"B"}').json,{nome:'A'}));
await test('E06','Link #j= base64url (UTF-8 com acentos, sem padding) e ida e volta',()=>{const b=P.textoParaBase64url(JSON.stringify(PAC));assert.ok(!/[+/=]/.test(b));const h=P.lerHash('#j='+b);eq(JSON.parse(h.texto),PAC);eq(P.extrairJSON('https://drthaleschateaubriand.github.io/carimbo/enviar.html#j='+b).json,PAC);return {tamanhoLink:b.length}});
await test('E07','Link #t= (encodeURIComponent)',()=>{const h=P.lerHash('#t='+encodeURIComponent(JSON.stringify(PAC)));eq(P.extrairJSON(h.texto).json,PAC)});
await test('E08','Entradas inválidas dão erro claro',()=>{for(const t of ['','   ','abc','[1,2]','{"nome": "sem fim"','{nome: x}'])assert.ok(P.extrairJSON(t).erro,'esperava erro: '+t);assert.ok(P.lerHash('#j=%%%').erro||P.lerHash('#j=@@@').erro);assert.ok(P.lerHash('#t=%E0%A4%A').erro);assert.ok(P.lerHash('#j=_w').erro,'bytes que não são UTF-8')});
await test('E09','Chaves desconhecidas e valores aninhados são apontados; telas agrupadas',()=>{const a=P.analisar({...PAC,pressao:'12x8',lista:[1],obj:{a:1}});eq(a.desconhecidas,['pressao','lista','obj']);eq(a.invalidas,['lista','obj']);eq(a.telas.map(t=>t.nome),['Cadastro','Prescrição','Exames','Evolução','Antropometria']);eq(a.total,Object.keys(PAC).length)});
await test('E10','Aspas tipográficas coladas de teclado/app',()=>eq(P.extrairJSON('Resultado: {\u201Cnome\u201D: \u201CJoão Fictício\u201D}').json,{nome:'João Fictício'}));
await test('E11','Pareamento no fragmento: válido e inválido',()=>{eq(P.lerHash('#parear='+COD).parear,COD);eq(P.lerHash('#parear=curto').parear,undefined);assert.ok(P.lerHash('#parear=curto').erroParear)});
await test('E12','Todas as 47 chaves do CARIMBAR são reconhecidas',()=>{const ks='nome cpf cns nasc nacionalidade mae pai email cel tel sexo sangue etnia identidadeGenero menorDeIdade anotacoes prescricao especial exames evolucao data altura peso gordura massaGorda massaMuscular massaMagra gorduraVisceral tmb peitoral axilarMedia triceps subescapular abdominal suprailiac coxa biceps panturrilha cPescoco cBraco cCintura cAbdomen cQuadril cCoxa cPanturrilha obs'.split(' ');eq(ks.filter(k=>!P.CONHECIDAS[k]),[]);return {chaves:ks.length}});
await test('D01','Abrir #parear= guarda o código e tira o código da URL',()=>{const p=pagina('#parear='+COD);eq([p.w.localStorage.getItem('carimbarCodigoPareado'),p.w.location.hash,p.w.location.href.includes(COD)],[COD,'',false]);assert.ok(/Aparelho pareado/.test(p.$('pareamento').textContent));assert.ok(/AbCdEfGh/.test(p.$('pareamento').textContent))});
await test('D02','Link de pareamento inválido não grava nada',()=>{const p=pagina('#parear=xyz');eq([p.w.localStorage.getItem('carimbarCodigoPareado'),p.w.location.hash],[null,'']);assert.ok(/inválido/.test(p.$('pareamento').textContent))});
await test('D03','Abrir #j= preenche a caixa, tira o JSON da URL e mostra a prévia por tela',()=>{const p=pagina('#j='+P.textoParaBase64url(JSON.stringify(PAC)),{codigo:COD});eq(p.w.location.hash,'');eq(JSON.parse(p.$('texto').value),PAC);eq([...p.$('previa').querySelectorAll('h3')].map(h=>h.textContent),['Cadastro','Prescrição','Exames','Evolução','Antropometria']);eq(p.$('enviar').disabled,false);assert.ok(/JSON válido: 13 campo/.test(p.$('analise').textContent))});
await test('D04','Sem pareamento o envio fica bloqueado com aviso',()=>{const p=pagina('');p.digitar(GROK);eq(p.$('enviar').disabled,true);assert.ok(/Pareie/.test(p.$('resultado').textContent))});
await test('D05','ENVIAR chama carimbar_responder_app com o código e o JSON e mostra a hora',async()=>{const p=pagina('',{codigo:COD});p.digitar(GROK);await p.$('enviar').onclick();eq(p.chamadas.length,1);const c=p.chamadas[0];eq([c.u,c.o.method,c.o.headers.apikey.startsWith('sb_publishable_'),c.o.body],['https://ybcoiphfbkmnzfppkryq.supabase.co/rest/v1/rpc/carimbar_responder_app','POST',true,{p_codigo:COD,p_conteudo:PAC}]);assert.ok(/Enviado às \d{2}:\d{2}:\d{2} \(envio #123\)/.test(p.$('resultado').textContent),p.$('resultado').textContent)});
await test('D06','Erro do servidor aparece claro',async()=>{const p=pagina('',{codigo:COD,falhar:true});p.digitar(GROK);await p.$('enviar').onclick();assert.ok(/Não foi enviado: sessao nao encontrada/.test(p.$('resultado').textContent));eq(p.$('resultado').className,'caixa erro')});
await test('D07','JSON inválido: erro e botão desligado; chave desconhecida: aviso',()=>{const p=pagina('',{codigo:COD});p.digitar('isso não é json');eq([p.$('enviar').disabled,p.$('analise').className],[true,'caixa erro']);p.digitar('{"peso":"70","pressao":"12x8"}');eq([p.$('enviar').disabled,p.$('analise').className],[false,'caixa aviso']);assert.ok(/desconhecidas.*pressao/.test(p.$('analise').textContent));p.digitar('{"pressao":"12x8"}');eq(p.$('enviar').disabled,true)});
await test('D08','Botão Colar lê a área de transferência; sem permissão orienta colar manual',async()=>{const p=pagina('',{codigo:COD,clip:GROK});await p.$('colar').onclick();eq(JSON.parse(JSON.stringify(P.extrairJSON(p.$('texto').value).json)),PAC);eq(p.$('enviar').disabled,false);const q=pagina('',{codigo:COD,clip:new Error('NotAllowed')});await q.$('colar').onclick();assert.ok(/Toque e segure/.test(q.$('analise').textContent))});
await test('D09','Prévia não interpreta HTML do JSON',()=>{const p=pagina('',{codigo:COD});p.digitar('{"nome":"<img src=x onerror=alert(1)>"}');eq([p.$('previa').querySelectorAll('img').length,p.$('previa').querySelector('dd').textContent],[0,'<img src=x onerror=alert(1)>'])});
await test('D11','Link #j= aberto com a página já aberta (só muda o #) é lido de novo',async()=>{const p=pagina('',{codigo:COD});p.digitar('{"peso":"1"}');p.w.location.hash='#j='+P.textoParaBase64url(JSON.stringify({peso:'79.2'}));await wait(30);eq([JSON.parse(p.$('texto').value),p.w.location.hash],[{peso:'79.2'},'']);eq(p.$('enviar').disabled,false)});
await test('D10','Desparear apaga o código e bloqueia o envio',()=>{const p=pagina('',{codigo:COD});p.digitar(GROK);p.$('desparear').onclick();eq([p.w.localStorage.getItem('carimbarCodigoPareado'),p.$('enviar').disabled],[null,true])});
const passou=results.filter(r=>r.status==='passou').length;
console.log(JSON.stringify({passou,total:results.length,falhas:results.filter(r=>r.status!=='passou')},null,1));
process.exit(passou===results.length?0:1);
})();

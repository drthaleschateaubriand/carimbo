const fs=require('fs');const {minify}=require('terser');
(async()=>{
 const src=fs.readFileSync('carimbar-grok-1.3.js','utf8');
 const r=await minify(src,{compress:{passes:2},mangle:true,format:{comments:false},ecma:2017});
 const min='/* CARIMBAR - versao Grok 1.3 */'+r.code;
 fs.writeFileSync('carimbar-grok-1.3.min.js',min);
 const url='javascript:'+encodeURIComponent(r.code).replace(/'/g,'%27');
 fs.writeFileSync('carimbar-grok-1.3-favorito.txt',url);
 const instr=fs.readFileSync('grok-instrucoes.txt','utf8').trim();
 const esc=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const html=`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Instalar CARIMBAR Grok 1.3</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#fff;color:#1a1a1a;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;line-height:1.5}
.wrap{max-width:620px;margin:0 auto;padding:28px 20px 48px}
h1{font-size:24px;margin:0 0 6px;font-weight:800}
h2{font-size:17px;margin:0 0 6px;font-weight:700}
.versao{display:inline-block;font-size:12px;color:#555;background:#f2f2f2;border-radius:6px;padding:4px 10px;margin:0 0 18px}
.sub{color:#444;margin:0 0 20px}
hr{border:0;border-top:1px solid #e3e3e3;margin:22px 0}
.tabs{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 18px}
.tab{border:1px solid #ccc;background:#fff;color:#333;border-radius:8px;padding:8px 14px;font-size:14px;cursor:pointer}
.tab[aria-selected="true"]{background:#111;color:#fff;border-color:#111;font-weight:700}
.painel[hidden]{display:none}
.passo{display:flex;gap:14px;align-items:flex-start}
.num{flex:0 0 30px;height:30px;border-radius:50%;background:#111;color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:15px;margin-top:2px}
.passo p{margin:4px 0}
kbd{font-family:inherit;font-size:13px;background:#f4f4f4;border:1px solid #d6d6d6;border-bottom-width:2px;border-radius:5px;padding:1px 6px}
.favorito{display:inline-block;margin:10px 0 4px;padding:10px 18px;border:2px solid #0b2a5b;color:#0b2a5b;background:#fff;border-radius:10px;font-weight:700;text-decoration:none;font-size:16px;cursor:grab}
.dica{font-size:13px;color:#666}
.aviso{font-size:13px;color:#8a3b00;min-height:18px}
.copiar{margin-top:8px;border:0;background:#111;color:#fff;border-radius:8px;padding:9px 16px;font-size:14px;font-weight:700;cursor:pointer}
pre.instr{white-space:pre-wrap;word-break:break-word;background:#f7f7f7;border:1px solid #e3e3e3;border-radius:10px;padding:12px;font-size:12.5px;max-height:320px;overflow:auto}
.importante{background:#fafafa;border:1px solid #e3e3e3;border-radius:10px;padding:12px 14px;font-size:14px;color:#333}
</style>
</head>
<body>
<div class="wrap">
<h1>Instalar CARIMBAR Grok</h1>
<div class="versao">Versão Grok 1.3 · confere o paciente da tela · 09/11/2026</div>
<p class="sub">Preenche formulários de qualquer sistema e extrai o conteúdo de qualquer página. Com a nuvem, a página se preenche sozinha: pelo robô (botão <b>ENVIAR P/ IA</b>) ou pelo chat comum do Grok, enviando o JSON pelo celular. Funciona como um favorito: não instala nada.</p>

<div class="tabs" role="tablist">
<button class="tab" role="tab" id="tab-chrome" aria-controls="painel-chrome" aria-selected="true">Chrome / Edge / CentBrowser</button>
<button class="tab" role="tab" id="tab-safari" aria-controls="painel-safari" aria-selected="false">Safari</button>
</div>

<section class="painel" id="painel-chrome" role="tabpanel">
<div class="passo"><div class="num">1</div><div>
<h2>Mostrar a barra de favoritos</h2>
<p><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> no Windows, ou <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> no Mac. Se a barra já estiver visível, pule este passo.</p>
</div></div>
<hr>
<div class="passo"><div class="num">2</div><div>
<h2>Arrastar o botão para a barra</h2>
<p>Clique no botão abaixo, mantenha pressionado e arraste até a barra de favoritos. Não clique só uma vez.</p>
<a class="favorito" id="favorito" href="${esc(url)}">🔖 CARIMBAR Grok 1.3</a>
<div class="aviso" id="aviso-favorito" aria-live="polite"></div>
<p class="dica">Se você já tem o CARIMBAR Grok 1.0, 1.1 ou 1.2, troque pelo 1.3 (apague o antigo da barra). Pode manter o CARIMBAR original junto.</p>
</div></div>
<hr>
<div class="passo"><div class="num">3</div><div>
<h2>Usar</h2>
<p>Abra o formulário no sistema que você usa (cadastro, prescrição, antropometria, exames ou evolução) ou qualquer página de onde queira extrair, clique no favorito, cole o JSON quando pedido e clique <b>CARIMBAR</b>. Para extrair o conteúdo da página, toque em <b>AVANCADO</b> e depois em <b>EXTRAIR</b>.</p>
<p>Na prescrição, ele abre sozinho a aba Texto livre. Se não abrir, abra a aba e clique CARIMBAR de novo. A barra mostra o que foi preenchido e o que faltou.</p>
</div></div>
</section>

<section class="painel" id="painel-safari" role="tabpanel" hidden>
<div class="passo"><div class="num">1</div><div>
<h2>Habilitar favoritos com JavaScript</h2>
<p>Safari &gt; Configurações &gt; Avançado: marque “Mostrar recursos para desenvolvedores da web”.</p>
<p>Depois, na aba Desenvolvimento, grupo Automação: marque “Permitir JavaScript no campo de Busca Inteligente”.</p>
</div></div>
<hr>
<div class="passo"><div class="num">2</div><div>
<h2>Mostrar a barra de favoritos</h2>
<p><kbd>Shift</kbd>+<kbd>Cmd</kbd>+<kbd>B</kbd>.</p>
</div></div>
<hr>
<div class="passo"><div class="num">3</div><div>
<h2>Arrastar o botão (Mac)</h2>
<p>Arraste o botão “🔖 CARIMBAR Grok 1.3” da aba Chrome para a barra de favoritos. Na primeira vez que usar, escolha “Sempre permitir”.</p>
</div></div>
<hr>
<div class="passo"><div class="num">4</div><div>
<h2>iPhone / iPad</h2>
<p>Crie um favorito de qualquer página, edite esse favorito, apague o endereço e cole o código copiado abaixo. Salve com o nome “CARIMBAR Grok 1.3”.</p>
<button class="copiar" id="copiar" type="button">Copiar código do bookmarklet</button>
</div></div>
</section>

<hr>
<h2>Abrir a ponte e parear o celular (uma vez)</h2>
<div class="passo"><div class="num">1</div><div><p>Abra a tela do sistema, clique no favorito e depois em <b>ENVIAR P/ IA</b>. Abre a janelinha “CARIMBAR · ponte com a IA”. Deixe-a aberta. Se o navegador bloquear, permita pop-ups para o site e clique de novo.</p></div></div>
<div class="passo"><div class="num">2</div><div><p>Na janelinha, clique <b>📱 Parear celular / outro aparelho</b> e leia o QR com a câmera do celular. Abre a página <a href="enviar.html">CARIMBAR · enviar</a>, já pareada. Adicione-a à tela de início do celular.</p></div></div>
<hr>
<h2>Usar com o chat do Grok</h2>
<div class="passo"><div class="num">1</div><div><p>Uma vez só: copie o texto abaixo e cole nas instruções personalizadas do Grok (ou no início da conversa, ou num Projeto).</p>
<pre class="instr" id="instr">${esc(instr)}</pre>
<button class="copiar" id="copiarInstr" type="button">Copiar instruções para o Grok</button></div></div>
<div class="passo"><div class="num">2</div><div><p>No computador, deixe a tela do sistema com o CARIMBAR e a ponte conectada (<b>ENVIAR P/ IA</b>).</p></div></div>
<div class="passo"><div class="num">3</div><div><p>Conte o caso ao Grok do jeito que quiser, sempre dizendo o nome do paciente (e o prontuário, se quiser). Ele organiza e pergunta se está OK. Responda “OK” e copie a resposta: vem um bloco JSON por paciente.</p></div></div>
<div class="passo"><div class="num">4</div><div><p>No celular, abra <b>CARIMBAR · enviar</b>, toque <b>📋 Colar</b>, confira a prévia (separada por paciente) e toque <b>ENVIAR PARA O CARIMBAR</b>. A página no computador se preenche em segundos, só se for a tela do mesmo paciente. Se o Grok mostrar um link <code>enviar.html#j=…</code>, basta tocar nele e enviar.</p></div></div>
<h2>Conferência do paciente</h2>
<p>A barra mostra <b>Paciente na tela</b>. O CARIMBAR só preenche se o paciente do JSON for o da tela (maiúsculas e acentos não importam; “José” confere com “José Carlos Silva”). Se for outro, aparece “Este JSON é do paciente X, mas a tela aberta é de Y. Nada foi preenchido.” e o JSON fica na <b>Fila</b>. Com vários pacientes, abra a tela de cada um e clique <b>CARIMBAR</b>: cada tela recebe o seu. Se a tela não mostrar o paciente, escolha <b>Preencher mesmo assim</b> ou <b>Cancelar</b>. Cadastro novo e JSON sem “paciente” não são conferidos (a barra avisa).</p>
<p class="dica">Sem celular: copie o JSON do Grok e, no computador, use <b>INSERIR TEXTO</b> e depois <b>CARIMBAR</b> no favorito, como na 1.0.</p>
<hr>
<h2>Usar com os robôs (IA com acesso à nuvem)</h2>
<p>Clique <b>ENVIAR P/ IA</b> e diga à IA no chat o que preencher. Quando ela responder, a página se preenche sozinha. Confira tudo antes de salvar no sistema.</p>
<p class="dica">Os dados enviados ficam num servidor em São Paulo, protegidos pelo código secreto da sua janelinha, e são apagados automaticamente em 24 horas.</p>
<hr>
<div class="importante"><b>Importante:</b> versão em fase de teste. Confira os campos antes de salvar e não distribua sem revisão. Versões anteriores: <a href="versoes/1.2/">Grok 1.2</a> (sem conferência do paciente), <a href="versoes/1.1/">Grok 1.1</a> (nuvem, sem celular) e <a href="versoes/1.0/">Grok 1.0</a> (sem nuvem).</div>
</div>
<script>
(function(){
  var tabs=[].slice.call(document.querySelectorAll('.tab'));
  tabs.forEach(function(t){
    t.addEventListener('click',function(){
      tabs.forEach(function(o){
        var sel=o===t;
        o.setAttribute('aria-selected',sel?'true':'false');
        document.getElementById(o.getAttribute('aria-controls')).hidden=!sel;
      });
    });
  });
  var fav=document.getElementById('favorito'), aviso=document.getElementById('aviso-favorito');
  fav.addEventListener('click',function(e){
    e.preventDefault();
    aviso.textContent='Arraste para a barra de favoritos, não clique';
  });
  var btn=document.getElementById('copiar');
  function ok(){ btn.textContent='Copiado!'; setTimeout(function(){ btn.textContent='Copiar código do bookmarklet'; },2000); }
  function fallback(code){
    var ta=document.createElement('textarea');
    ta.value=code; ta.setAttribute('readonly','');
    ta.style.position='fixed'; ta.style.top='0'; ta.style.left='-9999px';
    document.body.appendChild(ta); ta.select();
    try{ ta.setSelectionRange(0,code.length); }catch(e){}
    var r=false; try{ r=document.execCommand('copy'); }catch(e){}
    document.body.removeChild(ta);
    if(r) ok(); else btn.textContent='Não foi possível copiar; segure no botão do passo 2 e copie o link';
  }
  var bi=document.getElementById('copiarInstr');
  bi.addEventListener('click',function(){
    var t=document.getElementById('instr').textContent;
    var fim=function(m){ bi.textContent=m; setTimeout(function(){ bi.textContent='Copiar instruções para o Grok'; },2000); };
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function(){ fim('Copiado!'); },function(){ fim('Selecione o texto e copie'); });
    else fim('Selecione o texto e copie');
  });
  btn.addEventListener('click',function(){
    var code=fav.getAttribute('href');
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(code).then(ok,function(){ fallback(code); });
    } else fallback(code);
  });
})();
</script>
</body>
</html>
`;
 fs.writeFileSync('carimbar-grok-1.3-instalar.html',html);
 fs.writeFileSync('index.html',html);
 console.log({min:min.length,url:url.length,html:html.length});
})();

const fs=require('fs');const {minify}=require('terser');
(async()=>{
 const src=fs.readFileSync('carimbar-grok-1.7.js','utf8');
 const r=await minify(src,{compress:{passes:2},mangle:true,format:{comments:false},ecma:2017});
 const min='/* CARIMBAR - versao Grok 1.7 */'+r.code;
 fs.writeFileSync('carimbar-grok-1.7.min.js',min);
 const url='javascript:'+encodeURIComponent(r.code).replace(/'/g,'%27');
 fs.writeFileSync('carimbar-grok-1.7-favorito.txt',url);
 const instr=fs.readFileSync('grok-instrucoes.txt','utf8').trim();
 const esc=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const html=`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Instalar CARIMBAR Grok 1.7</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#fff;color:#1a1a1a;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;line-height:1.7}
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
<div class="versao">Versão Grok 1.7 · quadros (MV) + MODO TECLADO, MODO CADEIA e detecção de plugin/emulador · 10/11/2026</div>
<p class="sub">Preenche formulários de qualquer sistema e extrai o conteúdo de qualquer página. Com a nuvem, a página se preenche sozinha: pelo robô (botão <b>ENVIAR P/ IA</b>) ou pelo chat comum do Grok, enviando o JSON pelo celular. Funciona como um favorito: não instala nada.</p>

<div class="tabs" role="tablist">
<button class="tab" role="tab" id="tab-chrome" aria-controls="painel-chrome" aria-selected="true">Chrome / Edge / CentBrowser</button>
<button class="tab" role="tab" id="tab-safari" aria-controls="painel-safari" aria-selected="false">Safari</button>
<button class="tab" role="tab" id="tab-soulmv" aria-controls="painel-soulmv" aria-selected="false">SoulMV / navegador do MV</button>
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
<a class="favorito" id="favorito" href="${esc(url)}">🔖 CARIMBAR Grok 1.7</a>
<div class="aviso" id="aviso-favorito" aria-live="polite"></div>
<p class="dica">Se você já tem o CARIMBAR Grok 1.0 a 1.3, troque pelo 1.7 (apague o antigo da barra). Pode manter o CARIMBAR original junto.</p>
</div></div>
<hr>
<div class="passo"><div class="num">3</div><div>
<h2>Usar</h2>
<p>Abra o formulário no sistema que você usa (cadastro, prescrição, antropometria, exames ou evolução) ou qualquer página de onde queira extrair, clique no favorito, cole o JSON quando pedido e clique <b>CARIMBAR</b>. Para extrair o conteúdo da página, toque em <b>AVANCADO</b> e depois em <b>EXTRAIR</b>.</p>
<div class="importante"><b>Tela que não deixa preencher (plugin/Flash, como algumas telas do MV):</b> quando a tela é desenhada dentro de um plugin, os campos não existem no documento e nenhum script consegue escrever nelas. Nesse caso use <b>AVANCADO</b> e depois <b>TECLADO</b>: abre uma janela que entrega o conteúdo campo por campo na área de transferência. No prontuário basta clicar no campo, <kbd>Ctrl</kbd>+<kbd>V</kbd> e <kbd>Tab</kbd>, e voltar na janela para <b>COPIAR E AVANCAR</b> (ou seta direita). Melhor ainda: clique em <b>CADEIA</b> na janela lateral. Com a cadeia ligada, a área de transferência avança sozinha a cada colagem, e você preenche a tela inteira sem sair do prontuário: <kbd>Ctrl</kbd>+<kbd>V</kbd>, <kbd>Tab</kbd>, <kbd>Ctrl</kbd>+<kbd>V</kbd>, <kbd>Tab</kbd>, até o fim. Antes de concluir que é plugin, clique em <b>CAMPOS</b>: ele agora diz se a tela está desenhada em plugin nativo, em emulador ou em canvas, e por que não há campo. Nessas telas o <b>EXTRAIR</b> também muda de comportamento: como não existe HTML para ler, ele tenta capturar a imagem da tela numa janela separada, e avisa quando a captura não é possível. Quando o JSON chega pela nuvem numa tela dessas, o CARIMBAR já abre o modo teclado com a CADEIA ligada, sem tentar carimbar.</div>
<p>Na prescrição, ele abre sozinho a aba Texto livre. Se não abrir, abra a aba e clique CARIMBAR de novo. A barra mostra o que foi preenchido e o que faltou.</p>
<p><b>Novo na 1.7:</b> lê e preenche telas montadas em quadros (iframes), como o MV PEP. Em telas sem tipo conhecido, preenche pelo nome ou rótulo do campo, e o texto (<code>evolucao</code>) vai para a caixa de texto em que você clicou por último. Para ver o que o CARIMBAR enxerga na tela, toque em <b>AVANCADO</b> e depois em <b>CAMPOS</b>: os campos ficam com contorno azul.</p>
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
<p>Arraste o botão “🔖 CARIMBAR Grok 1.7” da aba Chrome para a barra de favoritos. Na primeira vez que usar, escolha “Sempre permitir”.</p>
</div></div>
<hr>
<div class="passo"><div class="num">4</div><div>
<h2>iPhone / iPad</h2>
<p>Crie um favorito de qualquer página, edite esse favorito, apague o endereço e cole o código copiado abaixo. Salve com o nome “CARIMBAR Grok 1.7”.</p>
<button class="copiar" id="copiar" type="button">Copiar código do bookmarklet</button>
</div></div>
</section>

<section class="painel" id="painel-soulmv" role="tabpanel" hidden>
<p class="sub">O navegador próprio do SoulMV (menus Options, Edit e View) não tem barra de favoritos, então não dá para arrastar o botão. Tente na ordem abaixo. Não precisa instalar nada.</p>
<div class="passo"><div class="num">A</div><div>
<h2>Colar o código como favorito</h2>
<p>1. Clique no botão abaixo para copiar o código do CARIMBAR.</p>
<button class="copiar" id="copiarSoul" type="button">Copiar código do CARIMBAR</button>
<div class="aviso" id="avisoSoul" aria-live="polite"></div>
<p>2. No SoulMV, abra a tela do paciente e aperte <kbd>Ctrl</kbd>+<kbd>D</kbd> (Options &gt; Bookmark this page). Depois abra <kbd>Ctrl</kbd>+<kbd>B</kbd> (Options &gt; Bookmarks...). Se der para editar o favorito, troque o nome por <b>CARIMBAR</b>, apague o endereço e cole com <kbd>Ctrl</kbd>+<kbd>V</kbd>. Salve e clique nele com a tela do paciente aberta.</p>
<p>3. Se não der para editar o favorito, use a barra de endereço com a tela do paciente aberta: clique nela, apague tudo, digite <code>javascript:</code> e cole o código copiado com o botão abaixo, que vem <b>sem</b> o “javascript:”. Aperte <kbd>Enter</kbd>. Muitos navegadores apagam o “javascript:” quando você cola, por isso ele tem que ser digitado.</p>
<button class="copiar" id="copiarSemPrefixo" type="button">Copiar código sem o “javascript:”</button>
<p class="dica">Se a área de transferência não funcionar, clique dentro da caixa abaixo, aperte <kbd>Ctrl</kbd>+<kbd>A</kbd> e depois <kbd>Ctrl</kbd>+<kbd>C</kbd>.</p>
<textarea id="codigoSoul" readonly style="width:100%;height:70px;font:11px monospace;border:1px solid #ccc;border-radius:8px"></textarea>
<p class="dica">Se o SoulMV abrir o console com <kbd>F12</kbd>, outro jeito é colar o código sem o “javascript:” no console e apertar <kbd>Enter</kbd>.</p>
<p class="dica">Se nada acontecer em nenhum dos jeitos, o SoulMV bloqueia esse tipo de código. Use o caminho B ou o C.</p>
</div></div>
<hr>
<div class="passo"><div class="num">B</div><div>
<h2>Abrir o MV no Chrome ou no Edge</h2>
<p>Na barra de endereço do SoulMV, copie o endereço do MV PEP (algo como <code>http://…cloudmv.com.br/mvpep/…</code>). Abra no Chrome ou no Edge do mesmo computador, entre com o seu usuário e instale o favorito pela aba <b>Chrome / Edge / CentBrowser</b> desta página. A 1.7 lê os quadros do MV PEP.</p>
<p class="dica">Alguns hospitais só liberam o MV pelo navegador deles. Se o Chrome não abrir o sistema, fale com a TI ou use o caminho C.</p>
</div></div>
<hr>
<div class="passo"><div class="num">C</div><div>
<h2>Sem favorito: copiar e colar cada texto</h2>
<p>Funciona em qualquer navegador, inclusive no SoulMV.</p>
<p>1. Abra uma aba nova (<kbd>Ctrl</kbd>+<kbd>T</kbd>) e entre em <a href="enviar.html">drthaleschateaubriand.github.io/carimbo/enviar.html</a>.</p>
<p>2. Cole a resposta do Grok na caixa. A página separa os textos por paciente e por campo, e cada um tem um botão <b>Copiar</b>.</p>
<p>3. Clique em <b>Copiar</b>, volte para a aba do MV, clique no campo certo e aperte <kbd>Ctrl</kbd>+<kbd>V</kbd>.</p>
<p class="dica">Nesse caminho não há conferência automática do paciente. Confira o nome no topo da prévia antes de colar.</p>
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
<div class="importante"><b>Importante:</b> versão em fase de teste. Confira os campos antes de salvar e não distribua sem revisão. Versões anteriores: <a href="versoes/1.3/">Grok 1.3</a> (sem leitura de quadros), <a href="versoes/1.2/">Grok 1.2</a> (sem conferência do paciente), <a href="versoes/1.1/">Grok 1.1</a> (nuvem, sem celular) e <a href="versoes/1.0/">Grok 1.0</a> (sem nuvem).</div>
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

  var cod=document.getElementById('codigoSoul'), avS=document.getElementById('avisoSoul');
  var urlFav=fav.getAttribute('href'), semPrefixo=urlFav.replace(/^javascript:/,'');
  cod.value=urlFav;
  cod.addEventListener('focus',function(){ cod.select(); });
  function copiarTexto(t,b,rot){
    var fim=function(m){ b.textContent=m; avS.textContent=m==='Copiado!'?'':avS.textContent; setTimeout(function(){ b.textContent=rot; },2000); };
    var plano=function(){
      cod.value=t; cod.focus(); cod.select();
      var r=false; try{ r=document.execCommand('copy'); }catch(e){}
      if(r) fim('Copiado!'); else { fim(rot); avS.textContent='Não deu para copiar sozinho: o código está selecionado na caixa abaixo, aperte Ctrl+C.'; }
    };
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function(){ cod.value=t; fim('Copiado!'); },plano);
    else plano();
  }
  var b1=document.getElementById('copiarSoul'), b2=document.getElementById('copiarSemPrefixo');
  b1.addEventListener('click',function(){ copiarTexto(urlFav,b1,'Copiar código do CARIMBAR'); });
  b2.addEventListener('click',function(){ copiarTexto(semPrefixo,b2,'Copiar código sem o “javascript:”'); });
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
 fs.writeFileSync('carimbar-grok-1.7-instalar.html',html);
 fs.writeFileSync('index.html',html);
 console.log({min:min.length,url:url.length,html:html.length});
})();

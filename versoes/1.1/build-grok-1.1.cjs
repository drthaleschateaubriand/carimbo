const fs=require('fs');const {minify}=require('terser');
(async()=>{
 const src=fs.readFileSync('carimbar-grok-1.1.js','utf8');
 const r=await minify(src,{compress:{passes:2},mangle:true,format:{comments:false},ecma:2017});
 const min='/* CARIMBAR - versao Grok 1.1 */'+r.code;
 fs.writeFileSync('carimbar-grok-1.1.min.js',min);
 const url='javascript:'+encodeURIComponent(r.code).replace(/'/g,'%27');
 fs.writeFileSync('carimbar-grok-1.1-favorito.txt',url);
 const esc=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const html=`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Instalar CARIMBAR Grok 1.1</title>
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
.importante{background:#fafafa;border:1px solid #e3e3e3;border-radius:10px;padding:12px 14px;font-size:14px;color:#333}
</style>
</head>
<body>
<div class="wrap">
<h1>Instalar CARIMBAR Grok</h1>
<div class="versao">Versão Grok 1.1 · com nuvem · 09/11/2026</div>
<p class="sub">Preenche formulários de qualquer sistema e extrai o conteúdo de qualquer página. Novo na 1.1: o botão <b>ENVIAR P/ IA</b> manda os campos da página para a IA, você diz no chat o que preencher e a página se preenche sozinha. Funciona como um favorito: não instala nada.</p>

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
<a class="favorito" id="favorito" href="${esc(url)}">🔖 CARIMBAR Grok 1.1</a>
<div class="aviso" id="aviso-favorito" aria-live="polite"></div>
<p class="dica">Se você já tem o CARIMBAR Grok 1.0, troque pelo 1.1 (apague o antigo da barra). Pode manter o CARIMBAR original junto.</p>
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
<p>Arraste o botão “🔖 CARIMBAR Grok 1.1” da aba Chrome para a barra de favoritos. Na primeira vez que usar, escolha “Sempre permitir”.</p>
</div></div>
<hr>
<div class="passo"><div class="num">4</div><div>
<h2>iPhone / iPad</h2>
<p>Crie um favorito de qualquer página, edite esse favorito, apague o endereço e cole o código copiado abaixo. Salve com o nome “CARIMBAR Grok 1.1”.</p>
<button class="copiar" id="copiar" type="button">Copiar código do bookmarklet</button>
</div></div>
</section>

<hr>
<h2>Como usar com a IA</h2>
<div class="passo"><div class="num">1</div><div><p>Abra a tela do sistema (cadastro, prescrição, exames, antropometria, evolução…), clique no favorito e depois em <b>ENVIAR P/ IA</b>.</p><p class="dica">Na primeira vez abre uma janelinha “CARIMBAR · ponte com a IA”. Deixe-a aberta. Se o navegador bloquear, permita pop-ups para o site e clique de novo.</p></div></div>
<div class="passo"><div class="num">2</div><div><p>Diga à IA no chat o que preencher, por texto ou áudio. Exemplo: “paciente 45 anos, hipertenso, diabético, peso 92 kg, altura 1,75; preenche a antropometria”.</p></div></div>
<div class="passo"><div class="num">3</div><div><p>Quando a IA responder, a página se preenche sozinha em poucos segundos e a barra mostra o que foi preenchido. Confira tudo antes de salvar no sistema.</p></div></div>
<p class="dica">Os botões <b>CARIMBAR</b> e <b>INSERIR TEXTO</b> continuam funcionando como antes, colando o JSON à mão. Os dados enviados ficam num servidor em São Paulo, protegidos por um código secreto da sua janela, e são apagados automaticamente em 24 horas.</p>
<hr>
<div class="importante"><b>Importante:</b> versão em fase de teste. Confira os campos antes de salvar e não distribua sem revisão. Versão anterior, sem nuvem: <a href="versoes/1.0/">Grok 1.0</a>.</div>
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
 fs.writeFileSync('carimbar-grok-1.1-instalar.html',html);
 fs.writeFileSync('index.html',html);
 console.log({min:min.length,url:url.length,html:html.length});
})();

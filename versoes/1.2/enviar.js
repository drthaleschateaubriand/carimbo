/* CARIMBAR Grok 1.2 - pagina do celular/outro aparelho: pareia com a janela-ponte e envia o JSON do chat. */
(function(){
  'use strict';
  var SB_URL = 'https://ybcoiphfbkmnzfppkryq.supabase.co';
  var SB_KEY = 'sb_publishable_FMNJjtCEZ_HYVliMWgnfgA_PEBAzeGM'; /* chave publica: so executa as funcoes carimbar_* */
  var K = 'carimbarCodigoPareado';
  var P = window.CarimbarEnviar;
  var $ = function(id){ return document.getElementById(id); };
  var atual = null;

  function caixa(id, txt, cls){ var e = $(id); e.hidden = !txt; e.className = 'caixa' + (cls ? ' ' + cls : ''); e.textContent = txt || ''; }
  function codigo(){ var c = null; try{ c = localStorage.getItem(K); }catch(e){} return c && /^[A-Za-z0-9_-]{32,128}$/.test(c) ? c : null; }
  function mostrarPareamento(extra){
    var c = codigo(), box = $('pareamento');
    box.textContent = '';
    box.className = 'caixa ' + (c ? 'ok' : 'aviso');
    var t = document.createElement('div');
    t.textContent = (extra ? extra + ' ' : '') + (c ? 'Pareado com a sessão ' + c.slice(0, 8) + '.' : 'Ainda não pareado. No computador, na janela-ponte do CARIMBAR, toque em "Parear celular" e leia o QR com a câmera.');
    box.appendChild(t);
    if(c){
      var b = document.createElement('button'); b.type = 'button'; b.className = 'pequeno'; b.textContent = 'Desparear'; b.id = 'desparear'; b.style.marginTop = '8px';
      b.onclick = function(){ if(confirm('Desparear este aparelho?')){ try{ localStorage.removeItem(K); }catch(e){} mostrarPareamento(); atualizar(); } };
      box.appendChild(b);
    }
  }

  /* fragmento da URL: #parear=codigo, #j=base64url, #t=texto; tudo e removido da barra de endereco na hora */
  var h = {};
  function lerFragmento(){
    h = P.lerHash(location.hash);
    if(location.hash) history.replaceState(null, '', location.pathname + location.search);
    var msgPar = '';
    if(h.parear){ try{ localStorage.setItem(K, h.parear); msgPar = '✔ Aparelho pareado.'; }catch(e){ msgPar = 'Não foi possível guardar o pareamento neste navegador.'; } }
    else if(h.erroParear) msgPar = 'Link de pareamento inválido.';
    mostrarPareamento(msgPar);
    if(h.erro) caixa('analise', h.erro, 'erro');
    if(h.texto) $('texto').value = h.texto;
  }
  lerFragmento();
  /* link aberto com a pagina ja aberta (so muda o #): le de novo */
  window.addEventListener('hashchange', function(){ if(location.hash){ lerFragmento(); atualizar(); } });

  function dd(dl, rot, val){ var a = document.createElement('dt'), b = document.createElement('dd'); a.textContent = rot; b.textContent = val; dl.appendChild(a); dl.appendChild(b); }
  function atualizar(){
    var prev = $('previa'); prev.textContent = ''; atual = null;
    caixa('resultado', '');
    var txt = $('texto').value;
    if(!txt.trim()){ if(!h.erro) caixa('analise', ''); $('enviar').disabled = true; return; }
    var r = P.extrairJSON(txt);
    if(r.erro){ caixa('analise', r.erro, 'erro'); $('enviar').disabled = true; return; }
    var a = P.analisar(r.json);
    var avisos = [];
    if(a.desconhecidas.length) avisos.push('Chaves desconhecidas (serão ignoradas pelo CARIMBAR): ' + a.desconhecidas.join(', '));
    if(a.invalidas.length) avisos.push('Valores que não são texto/número/sim-não: ' + a.invalidas.join(', '));
    if(!a.total){ caixa('analise', 'O JSON não tem nenhuma chave do CARIMBAR.' + (avisos.length ? '\n' + avisos.join('\n') : ''), 'erro'); $('enviar').disabled = true; return; }
    caixa('analise', 'JSON válido: ' + a.total + ' campo(s) em ' + a.telas.map(function(t){ return t.nome; }).join(', ') + '.' + (avisos.length ? '\n⚠ ' + avisos.join('\n⚠ ') : ''), avisos.length ? 'aviso' : 'ok');
    a.telas.forEach(function(t){
      var h3 = document.createElement('h3'); h3.textContent = t.nome; prev.appendChild(h3);
      var dl = document.createElement('dl');
      t.itens.forEach(function(i){ dd(dl, i.rotulo, P.valorLegivel(i.valor)); });
      prev.appendChild(dl);
    });
    atual = r.json;
    $('enviar').disabled = !codigo();
    if(!codigo()) caixa('resultado', 'Pareie este aparelho antes de enviar.', 'aviso');
  }
  $('texto').addEventListener('input', atualizar);
  $('limpar').onclick = function(){ $('texto').value = ''; h.erro = null; atualizar(); };
  $('colar').onclick = async function(){
    if(!navigator.clipboard || !navigator.clipboard.readText){ caixa('analise', 'Este navegador não deixa ler a área de transferência. Toque e segure na caixa acima e escolha Colar.', 'aviso'); $('texto').focus(); return; }
    try{ $('texto').value = await navigator.clipboard.readText(); atualizar(); }
    catch(e){ caixa('analise', 'Sem permissão para colar automaticamente. Toque e segure na caixa acima e escolha Colar.', 'aviso'); $('texto').focus(); }
  };
  $('enviar').onclick = async function(){
    var c = codigo();
    if(!atual || !c) return;
    var b = $('enviar'); b.disabled = true; b.textContent = 'Enviando…';
    try{
      var resp = await fetch(SB_URL + '/rest/v1/rpc/carimbar_responder_app', {
        method: 'POST',
        headers: {'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json'},
        body: JSON.stringify({p_codigo: c, p_conteudo: atual})
      });
      var corpo = await resp.json().catch(function(){ return null; });
      if(!resp.ok) throw new Error(corpo && corpo.message ? corpo.message : 'erro ' + resp.status);
      caixa('resultado', '✔ Enviado às ' + new Date().toLocaleTimeString('pt-BR') + ' (envio #' + corpo + '). A página no computador se preenche em segundos; confira lá antes de salvar.', 'ok');
    }catch(e){
      caixa('resultado', '✖ Não foi enviado: ' + e.message + '. Verifique a internet e o pareamento.', 'erro');
    }finally{
      b.textContent = 'ENVIAR PARA O CARIMBAR'; b.disabled = !atual || !codigo();
    }
  };
  atualizar();
  window.__enviarPronto = true;
})();

/* CARIMBAR Grok 1.2 - janela-ponte entre a pagina (favorito) e a nuvem (Supabase).
   - Conversa com a pagina que a abriu somente por postMessage, aceitando mensagens apenas de window.opener
     e respondendo apenas para a origem dessa pagina (recebida no aperto de mao).
   - Gera e guarda um codigo secreto de sessao (localStorage); a nuvem so entrega dados a quem tem o codigo.
   - Recebe o JSON da IA em tempo real (Realtime Broadcast) e, como reserva, consulta a cada 3 s. */
(function(){
  'use strict';
  var SB_URL = 'https://ybcoiphfbkmnzfppkryq.supabase.co';
  var SB_KEY = 'sb_publishable_FMNJjtCEZ_HYVliMWgnfgA_PEBAzeGM'; /* chave publica: so executa as funcoes carimbar_enviar e carimbar_buscar */
  var K_CODIGO = 'carimbarCodigoSessao';
  var INTERVALO = 3000;
  var MAX_IDADE_MS = 10 * 60 * 1000; /* carimbo esperando ha mais de 10 min nao e aplicado sozinho */
  var params = new URLSearchParams(location.search);
  var semRealtime = params.get('semRealtime') === '1'; /* para testar a consulta de reserva */

  var $ = function(id){ return document.getElementById(id); };
  function status(txt, cls){ var s = $('status'); s.textContent = txt; s.className = cls || ''; }
  function dica(txt){ $('dica').textContent = txt; }
  function log(txt){
    var li = document.createElement('li'), t = document.createElement('time');
    t.textContent = new Date().toLocaleTimeString('pt-BR');
    li.appendChild(t); li.appendChild(document.createTextNode(txt));
    var ul = $('log'); ul.insertBefore(li, ul.firstChild);
    while(ul.children.length > 30) ul.removeChild(ul.lastChild);
  }

  function novoCodigo(){
    var b = new Uint8Array(32); crypto.getRandomValues(b);
    var s = ''; for(var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  var codigo = localStorage.getItem(K_CODIGO);
  if(!codigo || !/^[A-Za-z0-9_-]{32,128}$/.test(codigo)){ codigo = novoCodigo(); localStorage.setItem(K_CODIGO, codigo); }
  function chaveUltimo(){ return 'carimbarUltimoId:' + codigo; }
  var ultimoId = +(localStorage.getItem(chaveUltimo()) || 0);
  var primeiraConsulta = true;
  $('sessao').textContent = codigo.slice(0, 8);

  var sb = window.supabase.createClient(SB_URL, SB_KEY, {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}});

  /* ---------- 1.2: registro da sessao e pareamento do celular ---------- */
  async function registrar(){
    try{
      var r = await sb.rpc('carimbar_registrar', {p_codigo: codigo});
      if(r.error) log('Aviso: não foi possível registrar a sessão (' + r.error.message + ').');
    }catch(e){ log('Aviso: sem conexão para registrar a sessão.'); }
  }
  function linkParear(){ return new URL('enviar.html', location.href).href.split('#')[0] + '#parear=' + codigo; }
  function desenharQR(){
    var link = linkParear();
    $('linkParear').value = link;
    var box = $('qr'); box.textContent = '';
    try{
      var q = window.qrcode(0, 'M'); q.addData(link); q.make();
      var img = document.createElement('img'); img.alt = 'QR de pareamento'; img.src = q.createDataURL(6, 2);
      box.appendChild(img);
    }catch(e){ box.textContent = 'QR indisponível; use o link abaixo.'; }
  }
  $('btnParear').addEventListener('click', function(){
    var p = $('painelParear'); p.hidden = !p.hidden;
    if(!p.hidden){ desenharQR(); registrar(); }
  });
  $('copiarParear').addEventListener('click', function(){
    var inp = $('linkParear'), b = $('copiarParear');
    var ok = function(){ b.textContent = 'Copiado!'; setTimeout(function(){ b.textContent = 'Copiar link'; }, 1500); };
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(inp.value).then(ok, function(){ inp.select(); });
    else { inp.select(); try{ if(document.execCommand('copy')) ok(); }catch(e){} }
  });
  registrar();

  /* ---------- pagina (favorito) ---------- */
  var origemPagina = null, pendentes = [], conectado = false;
  function paraPagina(msg){
    if(!window.opener || window.opener.closed || !origemPagina) return false;
    try{ window.opener.postMessage(msg, origemPagina); return true; }catch(e){ return false; }
  }
  function entregarPendentes(){
    while(pendentes.length && origemPagina && window.opener && !window.opener.closed){
      var c = pendentes.shift();
      if(paraPagina({carimbar: 'carimbo', id: c.id, json: c.conteudo})){
        log('Carimbo #' + c.id + ' entregue à página.');
        status('Carimbo recebido. Preenchendo a página…', 'ok');
      } else { pendentes.unshift(c); break; }
    }
  }
  window.addEventListener('message', function(ev){
    if(!window.opener || ev.source !== window.opener) return;
    var m = ev.data;
    if(!m || typeof m !== 'object' || typeof m.carimbar !== 'string') return;
    if(m.carimbar === 'ola'){
      origemPagina = ev.origin;
      conectado = true;
      paraPagina({carimbar: 'conectado'});
      status('Conectado à página', 'ok');
      dica('Enviando os campos da página…');
      log('Conectado a ' + ev.origin);
      entregarPendentes();
      return;
    }
    if(!origemPagina || ev.origin !== origemPagina) return;
    if(m.carimbar === 'extracao') enviarExtracao(m);
    else if(m.carimbar === 'carimbado'){
      status('Carimbo aplicado na página ✔', 'ok');
      dica('Para outro paciente ou outra tela, clique ENVIAR P/ IA na página e fale com a IA de novo.');
      log('Página preenchida' + (m.resumo ? ':\n' + String(m.resumo).slice(0, 600) : '.'));
    }
  });
  /* avisa a pagina que a ponte esta pronta (sem dados); repete ate a pagina responder */
  var tentativas = 0;
  function anunciar(){
    if(conectado || !window.opener || tentativas++ > 40) return;
    try{ window.opener.postMessage({carimbar: 'pronta'}, '*'); }catch(e){}
    setTimeout(anunciar, 500);
  }
  if(window.opener){ status('Conectando à página…'); anunciar(); }
  else { status('Abra esta janela pelo botão ENVIAR P/ IA do CARIMBAR', 'erro'); dica('Esta janela precisa ser aberta pelo favorito CARIMBAR Grok 1.1, dentro da página que você quer preencher.'); }

  async function enviarExtracao(m){
    var c = m.conteudo;
    if(!c || typeof c !== 'object' || Array.isArray(c)){ paraPagina({carimbar: 'erro', mensagem: 'resumo da página inválido'}); return; }
    status('Enviando a página para a IA…');
    var r = await sb.rpc('carimbar_enviar', {p_codigo: codigo, p_conteudo: c, p_url: String(m.url || '').slice(0, 2000), p_pagina: String(m.pagina || '').slice(0, 100)});
    if(r.error){
      status('Erro ao enviar: ' + r.error.message, 'erro');
      log('Erro ao enviar: ' + r.error.message);
      paraPagina({carimbar: 'erro', mensagem: 'nao foi possivel enviar para a nuvem: ' + r.error.message});
      return;
    }
    var n = (c.campos || []).length + (c.editores || []).length;
    status('Página enviada. Aguardando a IA…', 'ok');
    dica('Agora diga à IA no chat o que preencher (texto ou áudio). Quando ela responder, a página se preenche sozinha.');
    log('Página enviada (' + (m.pagina || 'tipo desconhecido') + ', ' + n + ' campos) · envio #' + r.data);
    paraPagina({carimbar: 'enviado', id: r.data});
  }

  /* ---------- recebimento ---------- */
  var consultando = false, deNovo = false;
  async function consultar(){
    if(consultando){ deNovo = true; return; }
    consultando = true;
    try{
      var r = await sb.rpc('carimbar_buscar', {p_codigo: codigo, p_desde_id: ultimoId});
      if(r.error){ $('modo').textContent = 'erro na consulta: ' + r.error.message; return; }
      (r.data || []).forEach(function(row){
        if(row.id <= ultimoId) return;
        ultimoId = row.id;
        localStorage.setItem(chaveUltimo(), String(ultimoId));
        var idade = Date.now() - new Date(row.criado_em).getTime();
        if(primeiraConsulta && idade > MAX_IDADE_MS){ log('Carimbo antigo #' + row.id + ' ignorado (mais de 10 min).'); return; }
        log('Carimbo #' + row.id + ' recebido da IA.');
        pendentes.push(row);
      });
      primeiraConsulta = false;
      if(pendentes.length){
        if(origemPagina && window.opener && !window.opener.closed) entregarPendentes();
        else { status('Carimbo recebido, mas a página não está conectada', 'erro'); dica('Volte à página e clique ENVIAR P/ IA no CARIMBAR para conectar; o carimbo será aplicado em seguida.'); }
      }
    } catch(e){
      $('modo').textContent = 'erro na consulta: ' + e.message;
    } finally {
      consultando = false;
      if(deNovo){ deNovo = false; consultar(); }
    }
  }
  setInterval(consultar, INTERVALO);
  consultar();

  var canal = null;
  async function topico(){
    var h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codigo));
    return 'carimbar-' + Array.prototype.map.call(new Uint8Array(h), function(b){ return ('0' + b.toString(16)).slice(-2); }).join('');
  }
  async function ligarRealtime(){
    if(semRealtime){ $('modo').textContent = 'consulta a cada 3 s (tempo real desligado para teste)'; return; }
    $('modo').textContent = 'consulta a cada 3 s; ligando tempo real…';
    canal = sb.channel(await topico());
    canal.on('broadcast', {event: 'carimbo'}, function(){ consultar(); })
      .subscribe(function(s){
        $('modo').textContent = s === 'SUBSCRIBED' ? 'tempo real ativo (e consulta a cada 3 s)' : 'consulta a cada 3 s (tempo real: ' + s + ')';
      });
  }
  ligarRealtime();

  $('nova').addEventListener('click', function(){
    if(!confirm('Começar uma nova sessão? A IA passará a responder para o novo código.')) return;
    codigo = novoCodigo(); localStorage.setItem(K_CODIGO, codigo);
    ultimoId = 0; primeiraConsulta = true; pendentes = [];
    $('sessao').textContent = codigo.slice(0, 8);
    registrar();
    if(!$('painelParear').hidden) desenharQR();
    if(canal){ sb.removeChannel(canal); canal = null; }
    ligarRealtime();
    log('Nova sessão ' + codigo.slice(0, 8) + '. Clique ENVIAR P/ IA na página.');
  });
})();

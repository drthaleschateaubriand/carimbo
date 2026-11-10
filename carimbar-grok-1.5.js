/* CARIMBAR - versao Grok 1.5 (quadros/iframes, modo generico, MODO TECLADO para telas em plugin; nuvem, celular e checagem do paciente)
   Favorito (bookmarklet) que preenche formularios de qualquer sistema web a partir de um JSON colado
   e extrai o conteudo de qualquer pagina. Derivado de carimbar.js (original preservado sem alteracoes).
   1.1: botao ENVIAR P/ IA manda um resumo dos campos da pagina para a IA pela janela-ponte
   (ponte.html, no GitHub Pages) e preenche sozinho quando o JSON da IA chega.
   O favorito nao carrega nada de fora e nao acessa a rede: so a janela-ponte fala com a nuvem.
   1.4: percorre todos os quadros (iframe, frame, frameset) da mesma origem e o shadow DOM aberto para extrair,
   preencher, achar o paciente da tela e destacar campos; quadros de outro site nao podem ser lidos e sao contados na barra.
   Em paginas sem tipo conhecido (ex.: prontuarios que montam a tela em quadros), preenche pelo nome, id ou rotulo do campo.
   1.5: botao TECLADO para telas desenhadas dentro de plugin (ex.: Flash no MV), onde os campos nao existem no documento:
   abre uma janela propria e entrega o JSON campo por campo na area de transferencia (clicar no campo, Ctrl+V, Tab).
   Armazenamento: sessionStorage 'carimbarJSON' (texto colado) e localStorage '__thales_extractor__' (paginas extraidas). */
(function(){
  /* ---------- 1.4: quadros (iframe/frame/frameset) e shadow DOM aberto ---------- */
  function docDe(f){ try{ var d = f.contentDocument || (f.contentWindow && f.contentWindow.document); if(d && d.documentElement) return d; }catch(e){} return null; }
  function sombras(raiz, out){
    var all = raiz.querySelectorAll('*');
    for(var i = 0; i < all.length; i++){ var sr = all[i].shadowRoot; if(sr){ out.push(sr); sombras(sr, out); } }
    return out;
  }
  /* lista de documentos acessiveis (o principal primeiro), com o caminho do quadro e quantos quadros de outro site ficaram de fora */
  function lerQuadros(){
    var docs = [], ign = 0, vistos = [];
    function visitar(doc, caminho, frameEl){
      if(!doc || vistos.indexOf(doc) > -1) return;
      vistos.push(doc);
      var raizes = [doc];
      try{ sombras(doc, raizes); }catch(e){}
      docs.push({doc: doc, caminho: caminho, frameEl: frameEl, raizes: raizes});
      var fr = [];
      raizes.forEach(function(r){ fr = fr.concat([].slice.call(r.querySelectorAll('iframe,frame'))); });
      fr.forEach(function(f, i){
        if(f.id === 'carimbarBar') return;
        var d2 = docDe(f);
        var nome = f.tagName.toLowerCase() + (f.id ? '#' + f.id : f.getAttribute('name') ? '[name=' + f.getAttribute('name') + ']' : '[' + i + ']');
        if(!d2){ ign++; return; }
        visitar(d2, caminho ? caminho + ' > ' + nome : nome, f);
      });
    }
    visitar(document, '', null);
    return {docs: docs, ignorados: ign};
  }
  var cacheQ = null, cacheQem = 0;
  function quadros(){
    var agora = Date.now();
    if(!cacheQ || agora - cacheQem > 400){ cacheQ = lerQuadros(); cacheQem = agora; escutarQuadros(cacheQ); }
    return cacheQ;
  }
  function raizes(){ var r = []; quadros().docs.forEach(function(q){ r = r.concat(q.raizes); }); return r; }
  /* querySelector/All em todos os quadros e sombras */
  function QA(sel){ var r = []; raizes().forEach(function(x){ try{ r = r.concat([].slice.call(x.querySelectorAll(sel))); }catch(e){} }); return r; }
  function Q(sel){ var rr = raizes(); for(var i = 0; i < rr.length; i++){ try{ var e = rr[i].querySelector(sel); if(e) return e; }catch(err){} } return null; }
  function janelaDe(el){ var d = el && (el.ownerDocument || el); return (d && d.defaultView) || window; }
  function caminhoDe(el){ var d = el.ownerDocument, qs = quadros().docs; for(var i = 0; i < qs.length; i++) if(qs[i].doc === d) return qs[i].caminho; return ''; }
  function tag(el){ return el && el.tagName ? el.tagName.toUpperCase() : ''; }
  /* foco real, descendo por iframes e sombras */
  function ativoProfundo(){
    var a = document.activeElement;
    for(var k = 0; k < 20 && a; k++){
      if(tag(a) === 'IFRAME' || tag(a) === 'FRAME'){ var d = docDe(a); if(!d || !d.activeElement) break; a = d.activeElement; continue; }
      if(a.shadowRoot && a.shadowRoot.activeElement){ a = a.shadowRoot.activeElement; continue; }
      break;
    }
    return a;
  }
  /* a barra vai no documento principal; se ele for um frameset (nao mostra conteudo), vai no maior quadro acessivel */
  var UI = document;
  if(!document.body || tag(document.body) === 'FRAMESET'){
    var maior = null, area = -1;
    lerQuadros().docs.forEach(function(q){
      if(q.doc === document || !q.doc.body || tag(q.doc.body) === 'FRAMESET') return;
      var wq = q.doc.defaultView, a2 = wq ? (wq.innerWidth || 0) * (wq.innerHeight || 0) : 0;
      if(a2 > area){ area = a2; maior = q.doc; }
    });
    if(maior) UI = maior;
  }
  var BAR_ID = 'carimbarBar';
  var BAR_ANTIGA = ['clin','ivBar'].join('');   /* id da barra antiga / versao original */
  var CHAVE = 'carimbarJSON';
  var CHAVE_ANTIGA = ['clin','ivJSON'].join(''); /* chave antiga */
  /* nao abre duas barras (nem junto com a versao original) */
  if(document.getElementById(BAR_ID) || document.getElementById(BAR_ANTIGA) || UI.getElementById(BAR_ID)) return;
  /* migra o texto salvo na chave antiga para a nova, sem perder nada */
  try{
    if(!sessionStorage.getItem(CHAVE) && sessionStorage.getItem(CHAVE_ANTIGA) !== null){
      sessionStorage.setItem(CHAVE, sessionStorage.getItem(CHAVE_ANTIGA));
      sessionStorage.removeItem(CHAVE_ANTIGA);
    }
  }catch(e){}

  var VERSAO = 'Grok 1.5';
  var EXTRACT_NS = '__thales_extractor__';
  function getExtracted(){ try{ var v = JSON.parse(localStorage.getItem(EXTRACT_NS) || '[]'); return Array.isArray(v) ? v : []; }catch(e){ return []; } }
  function setExtracted(d){ localStorage.setItem(EXTRACT_NS, JSON.stringify(d)); }

  var bar = UI.createElement('div');
  bar.id = BAR_ID;
  bar.setAttribute('data-versao', 'grok');
  /* touch-action:none saiu da barra inteira (impedia rolar a barra em tela pequena); fica so na linha de arraste */
  bar.style.cssText = 'position:fixed;bottom:10px;right:10px;z-index:999999;display:flex;flex-direction:column;gap:6px;padding:8px 12px;background:#1a1a2e;border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,0.3);font-family:Arial,sans-serif;cursor:move;max-width:420px;max-height:70vh;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;';

  var topRow = UI.createElement('div');
  topRow.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;gap:8px;touch-action:none;';
  bar.appendChild(topRow);

  var advRow = UI.createElement('div');
  advRow.style.cssText = 'display:none;flex-wrap:wrap;align-items:center;gap:8px;padding-top:6px;border-top:1px solid #33334d;';
  bar.appendChild(advRow);

  var summaryRow = UI.createElement('div');
  summaryRow.id = 'carimbarResumo';
  summaryRow.style.cssText = 'display:none;color:#ddd;font-size:11px;line-height:1.4;padding-top:6px;border-top:1px solid #33334d;white-space:pre-wrap;word-break:break-word;cursor:auto;';
  bar.appendChild(summaryRow);

  /* ---------- 1.3: identificacao do paciente e fila por paciente ---------- */
  var FILA = 'carimbarFila';
  var infoRow = UI.createElement('div');
  infoRow.id = 'carimbarInfo';
  infoRow.style.cssText = 'display:none;color:#cfd3e6;font-size:11px;line-height:1.4;padding-top:4px;cursor:auto;';
  bar.appendChild(infoRow);
  var infoPac = UI.createElement('div'); infoPac.id = 'carimbarPaciente'; infoRow.appendChild(infoPac);
  var infoFila = UI.createElement('div'); infoFila.id = 'carimbarFilaInfo'; infoRow.appendChild(infoFila);
  var infoQuadros = UI.createElement('div'); infoQuadros.id = 'carimbarQuadros'; infoQuadros.style.color = '#9fb3c8'; infoRow.appendChild(infoQuadros);

  var CONECTORES = ['DA','DE','DO','DAS','DOS','E','D'];
  function tokensNome(s){ return norm(s).replace(/[^A-Z0-9 ]+/g, ' ').split(' ').filter(function(t){ return t && CONECTORES.indexOf(t) < 0; }); }
  /* todo pedaco do nome ditado tem de estar no nome da tela; devolve quantos pedacos (0 = nao confere) */
  function nomeConfere(ditado, naTela){
    var a = tokensNome(ditado), b = tokensNome(naTela);
    if(!a.length || !b.length) return 0;
    for(var i = 0; i < a.length; i++) if(b.indexOf(a[i]) < 0) return 0;
    return a.length;
  }
  function soDigitos(s){ return String(s == null ? '' : s).replace(/\D+/g, ''); }
  var NAO_NOME = /^(NOME|NOMES|PACIENTE|PACIENTES|NOME COMPLETO|NOME DO PACIENTE|NAO IDENTIFICADO|SEM NOME|DESCONHECIDO|PATIENT|NAME)$/;
  function limpaNome(s){
    s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    s = s.split(/\s*[|•·;]\s*|\s+[-–]\s+|\s+(?=(?:Idade|Sexo|CPF|CNS|RG|Nasc|Data de nasc|Prontu[aá]rio|Telefone|Conv[eê]nio|Leito|Registro|Atendimento|Prontuario|N[ãa]o identificado)\b)/i)[0];
    s = s.replace(/\s*\(.*$/, '').replace(/\d.*$/, '').replace(/[,:.\s]+$/, '').trim();
    var n = norm(s);
    if(n.length < 3 || !/[A-Z]{2}/.test(n) || NAO_NOME.test(n) || /^NOME\b/.test(n)) return '';
    if(tokensNome(s).length > 8) return '';
    return s.length > 80 ? s.slice(0, 80) : s;
  }
  function textoSemSelos(el){
    var c = el.cloneNode(true);
    [].slice.call(c.querySelectorAll('[class*="badge"],[class*="chip"],[class*="tag"],[class*="status"],mat-icon,.material-icons,button,svg,script,style')).forEach(function(n){ n.remove(); });
    return c.textContent;
  }
  /* procura o paciente da tela de forma generica: dialogo aberto ("Paciente: X"), elementos de nome do paciente,
     campo de nome preenchido, rotulos "Paciente:"/"Nome do paciente:", titulo da pagina; e o numero do prontuario */
  function detectPaciente(){
    var achados = [], prontuario = '';
    function add(nome, fonte, peso){ nome = limpaNome(nome); if(nome) achados.push({nome: nome, fonte: fonte, peso: peso}); }
    var SEL = '[class*="patient-name"],[class*="patientName"],[class*="patient_name"],[class*="nome-paciente"],[class*="paciente-nome"],[class*="nomePaciente"],[class*="nome_paciente"],[id*="patient-name"],[id*="patientName"],[id*="nomePaciente"],[id*="nome-paciente"],[data-patient-name],[data-paciente]';
    QA(SEL).forEach(function(el){
      if(bar.contains(el) || el.matches('input,textarea,select') || isHidden(el)) return;
      add(el.getAttribute('data-patient-name') || el.getAttribute('data-paciente') || textoSemSelos(el), 'nome do paciente', 3);
    });
    var RX = /(?:^|[\s(])(?:Paciente|Nome do paciente|Patient)\s*[:\-–]\s*(.+)$/i;
    var RXP = /Prontu[aá]rio\s*(?:n[º°o.]*\s*)?[:#]?\s*(\d[\d.\-\/]{0,19})/i;
    var els = QA('h1,h2,h3,h4,h5,h6,p,span,div,label,td,th,dt,dd,li,strong,b,small,header,mat-card-title,mat-card-subtitle');
    for(var i = 0; i < els.length; i++){
      var el = els[i];
      if(bar.contains(el)) continue;
      var tx = el.textContent;
      if(!tx || tx.length > 200) continue;
      tx = tx.replace(/\s+/g, ' ').trim();
      var m = tx.match(RX), mp = !prontuario && tx.match(RXP), rot = /^(Paciente|Nome do paciente)\s*:?$/i.test(tx);
      if(!m && !mp && !rot) continue;
      var kids = el.children, dup = false;
      for(var k = 0; k < kids.length; k++) if(kids[k].textContent.replace(/\s+/g, ' ').trim() === tx){ dup = true; break; }
      if(dup || isHidden(el)) continue;
      var dlg = el.closest && el.closest('mat-dialog-container,[role="dialog"],.modal,dialog');
      if(m) add(m[1], dlg ? 'janela aberta' : 'rotulo', dlg ? 4 : 2);
      if(rot && el.nextElementSibling) add(el.nextElementSibling.textContent, 'rotulo', 2);
      if(mp) prontuario = soDigitos(mp[1]);
    }
    var fn = Q('input[name="fullName"],input[formcontrolname="fullName"],input[name="patientName"],input[name="nomePaciente"]');
    if(fn && fn.value && !bar.contains(fn)) add(fn.value, 'campo nome', 3);
    quadros().docs.forEach(function(q){
      var mt = (q.doc.title || '').match(/(?:Paciente|Patient)\s*[:\-–]\s*(.+)/i);
      if(mt) add(mt[1], 'titulo da pagina', 1);
    });
    if(!achados.length) return prontuario ? {nome: '', prontuario: prontuario} : null;
    achados.sort(function(a, b){ return b.peso - a.peso; });
    var top = achados[0];
    var outros = achados.filter(function(a){ return a.peso >= 3 && !nomeConfere(a.nome, top.nome) && !nomeConfere(top.nome, a.nome); });
    var r = {nome: top.nome, fonte: top.fonte, prontuario: prontuario};
    if(outros.length) r.conflito = [top.nome].concat(outros.map(function(a){ return a.nome; }));
    return r;
  }
  function pacienteValido(p){ return p && p.nome && !p.conflito; }

  function lerFila(){ try{ var f = JSON.parse(sessionStorage.getItem(FILA) || '[]'); return Array.isArray(f) ? f.filter(function(x){ return x && x.json && x.paciente; }) : []; }catch(e){ return []; } }
  function gravarFila(f){ if(f.length) sessionStorage.setItem(FILA, JSON.stringify(f)); else sessionStorage.removeItem(FILA); }
  function pacienteDe(d){ return d && d.paciente != null ? String(d.paciente).replace(/\s+/g, ' ').trim() : ''; }
  /* JSON com "paciente" entra na fila (substitui o do mesmo paciente) e o texto sem paciente antigo deixa de valer */
  function enfileirar(d){
    var p = pacienteDe(d);
    var f = lerFila().filter(function(x){ return norm(x.paciente) !== norm(p); });
    var item = {paciente: p, prontuario: d.prontuario != null ? String(d.prontuario) : '', json: d, em: Date.now()};
    f.push(item);
    gravarFila(f);
    sessionStorage.removeItem(CHAVE);
    return item;
  }
  function ehObj(v){ return v !== null && typeof v === 'object' && !Array.isArray(v); }
  /* todos os objetos JSON do texto: JSON puro, lista de objetos, ou varios blocos/objetos no meio de texto */
  function objetosDoTexto(s){
    s = String(s == null ? '' : s).trim();
    try{
      var v = JSON.parse(s);
      if(ehObj(v)) return [v];
      if(Array.isArray(v) && v.length && v.every(ehObj)) return v;
      return [];
    }catch(e){}
    var out = [];
    for(var ini = s.indexOf('{'); ini > -1; ){
      var prof = 0, str = false, esc2 = false, fim = -1;
      for(var i = ini; i < s.length; i++){
        var c = s[i];
        if(str){ if(esc2) esc2 = false; else if(c === '\\') esc2 = true; else if(c === '"') str = false; continue; }
        if(c === '"') str = true;
        else if(c === '{') prof++;
        else if(c === '}'){ prof--; if(prof === 0){ fim = i; break; } }
      }
      var obj = null;
      if(fim > -1){ try{ obj = JSON.parse(s.slice(ini, fim + 1)); }catch(e){ obj = null; } }
      if(ehObj(obj)){ out.push(obj); ini = s.indexOf('{', fim + 1); }
      else ini = s.indexOf('{', ini + 1);
    }
    return out;
  }
  /* texto colado (INSERIR TEXTO / pedido do CARIMBAR): JSONs com paciente vao para a fila; o resto fica como antes */
  function guardarTexto(r){
    var objs = objetosDoTexto(r);
    var comP = objs.filter(function(o){ return pacienteDe(o); }), semP = objs.filter(function(o){ return !pacienteDe(o); });
    if(!comP.length){ sessionStorage.setItem(CHAVE, r); return; }
    comP.forEach(enfileirar);
    if(semP.length) sessionStorage.setItem(CHAVE, JSON.stringify(semP[semP.length - 1]));
  }
  function atualizarInfo(pac){
    if(pac === undefined) pac = detectPaciente();
    var f = lerFila();
    infoPac.textContent = pac && pac.conflito ? 'Paciente na tela: nomes diferentes (' + pac.conflito.join(' / ') + ')'
      : pac && pac.nome ? 'Paciente na tela: ' + pac.nome + (pac.prontuario ? ' (prontuario ' + pac.prontuario + ')' : '')
      : 'Paciente na tela: nao identificado';
    infoFila.textContent = '';
    var qd = quadros(), nq = qd.docs.length - 1;
    infoQuadros.textContent = (nq > 0 || qd.ignorados) ? 'Quadros lidos: ' + nq + (qd.ignorados ? ' | de outro site, ignorados: ' + qd.ignorados : '') : '';
    if(f.length){
      var s = UI.createElement('span'); s.textContent = 'Fila: ' + f.map(function(x){ return x.paciente; }).join(', ') + ' ';
      var b = UI.createElement('button'); b.id = 'carimbarLimparFila'; b.textContent = 'limpar fila';
      b.style.cssText = 'background:transparent;color:#e88;border:1px solid #844;border-radius:4px;padding:1px 6px;cursor:pointer;font-size:10px;';
      b.onclick = function(){ if(confirm('Limpar a fila de pacientes (' + f.length + ')?')){ sessionStorage.removeItem(FILA); atualizarInfo(); updateStatus(); } };
      infoFila.appendChild(s); infoFila.appendChild(b);
    }
    infoRow.style.display = 'block';
  }

  var status = UI.createElement('span');
  status.id = 'carimbarStatus';
  status.style.cssText = 'color:#aaa;font-size:11px;align-self:center;margin-right:4px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
  topRow.appendChild(status);

  /* usa a referencia direta: funciona antes da barra ser anexada ao documento */
  function updateStatus(){
    var nf = lerFila().length;
    var jsonPart = sessionStorage.getItem(CHAVE) ? 'Texto salvo' : (nf ? 'Fila: ' + nf : 'Sem dados');
    var n = getExtracted().length;
    var extractPart = n > 0 ? (n + ' pag. extraidas') : 'Nada extraido';
    status.textContent = jsonPart + ' | ' + extractPart;
    try{ atualizarInfo(); }catch(e){}
  }
  updateStatus();

  function makeBtn(label, color){
    var b = UI.createElement('button');
    b.textContent = label;
    b.style.cssText = 'background:#0f3460;color:'+color+';font-weight:bold;border:2px solid '+color+';border-radius:6px;padding:8px 14px;cursor:pointer;font-size:13px;';
    b.onmouseover = function(){ b.style.background = '#16213e'; };
    b.onmouseout = function(){ b.style.background = '#0f3460'; };
    return b;
  }

  var btnC = makeBtn('CARIMBAR', '#2ecc71');
  topRow.appendChild(btnC);

  var btnL = makeBtn('INSERIR TEXTO', '#f1c40f');
  topRow.appendChild(btnL);

  var btnIA = makeBtn('ENVIAR P/ IA', '#5dade2');
  btnIA.id = 'carimbarEnviarIA';
  btnIA.title = 'Envia os campos desta pagina para a IA e preenche sozinho quando a resposta chegar';
  topRow.appendChild(btnIA);

  var btnAdv = makeBtn('AVANCADO', '#888888');
  btnAdv.style.padding = '8px 10px';
  btnAdv.onclick = function(){
    advRow.style.display = advRow.style.display === 'none' ? 'flex' : 'none';
  };
  topRow.appendChild(btnAdv);

  var verLabel = UI.createElement('span');
  verLabel.id = 'carimbarVersao';
  verLabel.textContent = VERSAO;
  verLabel.title = 'CARIMBAR - versao Grok 1.5 (quadros/iframes, modo generico, modo teclado; nuvem, celular e checagem do paciente)';
  verLabel.style.cssText = 'color:#555;font-size:9px;align-self:center;letter-spacing:0.5px;';
  topRow.appendChild(verLabel);

  var iaLabel = UI.createElement('span');
  iaLabel.id = 'carimbarIA';
  iaLabel.style.cssText = 'color:#5dade2;font-size:10px;align-self:center;';
  topRow.appendChild(iaLabel);

  var btnX = UI.createElement('button');
  btnX.textContent = 'X';
  btnX.style.cssText = 'background:transparent;color:#888;border:none;cursor:pointer;font-size:14px;padding:4px 6px;align-self:center;';
  topRow.appendChild(btnX);

  var advLabel = UI.createElement('span');
  advLabel.textContent = 'Mapeamento:';
  advLabel.style.cssText = 'color:#666;font-size:10px;align-self:center;margin-right:2px;';
  advRow.appendChild(advLabel);

  var btnE = makeBtn('EXTRAIR', '#8bd17c');
  advRow.appendChild(btnE);

  var btnCopy = makeBtn('COPIAR', '#f0c674');
  advRow.appendChild(btnCopy);

  var btnClear = makeBtn('LIMPAR', '#cccccc');
  advRow.appendChild(btnClear);

  /* 1.4: CAMPOS mostra (contorno azul) os campos que o CARIMBAR enxerga, em todos os quadros, e as chaves para o JSON */
  var btnCampos = makeBtn('CAMPOS', '#5dade2');
  btnCampos.id = 'carimbarCampos';
  btnCampos.title = 'Mostra os campos que o CARIMBAR consegue preencher nesta tela (inclusive dentro de quadros)';
  advRow.appendChild(btnCampos);

  /* ---------- arraste: listeners proprios, sem sobrescrever document.onmousemove/onmouseup ---------- */
  var drag = false, ox, oy;
  var listeners = [];
  function on(target, type, fn, opts){ target.addEventListener(type, fn, opts); listeners.push([target, type, fn, opts]); }
  function clamp(v, max){ return Math.max(0, Math.min(v, Math.max(0, max))); }
  function dragStart(x, y, target){
    if(target && target.closest && target.closest('button')){ dragEnd(); return false; }
    drag = true;
    ox = x - bar.offsetLeft;
    oy = y - bar.offsetTop;
    return true;
  }
  function dragMove(x, y){
    if(!drag) return;
    var uw = UI.defaultView || window;
    var vw = uw.innerWidth || UI.documentElement.clientWidth || 0;
    var vh = uw.innerHeight || UI.documentElement.clientHeight || 0;
    bar.style.left = clamp(x - ox, vw - (bar.offsetWidth || 40)) + 'px';
    bar.style.top = clamp(y - oy, vh - (bar.offsetHeight || 40)) + 'px';
    bar.style.right = 'auto';
    bar.style.bottom = 'auto';
  }
  function dragEnd(){ drag = false; }
  /* toque: so arrasta pela linha de cima (fora dos botoes) ou pela borda da barra;
     a linha AVANCADO e o resumo ficam livres para rolar a barra */
  function isTouchHandle(target){
    if(!target) return false;
    if(target === bar) return true;
    return topRow.contains(target);
  }

  on(bar, 'mousedown', function(e){ if(e.button !== undefined && e.button !== 0) return; if(summaryRow.contains(e.target)) return; dragStart(e.clientX, e.clientY, e.target); });
  on(UI, 'mousemove', function(e){ dragMove(e.clientX, e.clientY); });
  on(UI, 'mouseup', dragEnd);

  on(bar, 'touchstart', function(e){
    if(!e.touches || e.touches.length !== 1){ dragEnd(); return; }
    if(!isTouchHandle(e.target)) return;
    var touch = e.touches[0];
    if(dragStart(touch.clientX, touch.clientY, e.target)) e.preventDefault();
  }, {passive: false});
  on(UI, 'touchmove', function(e){
    if(!drag) return;
    if(!e.touches || e.touches.length !== 1){ dragEnd(); return; }
    e.preventDefault();
    var touch = e.touches[0];
    dragMove(touch.clientX, touch.clientY);
  }, {passive: false});
  on(UI, 'touchend', dragEnd, true);
  on(UI, 'touchcancel', dragEnd, true);
  on(window, 'blur', dragEnd);
  on(document, 'visibilitychange', dragEnd);

  /* lembra o ultimo editor CKEditor em que o usuario clicou/tocou */
  var lastEditable = null, ultimoCampo = null, escutados = [];
  function aoFocar(e){
    var t = e.composedPath ? (e.composedPath()[0] || e.target) : e.target;
    if(!t || t.nodeType !== 1 || bar.contains(t)) return;
    var ed = t.closest ? t.closest('.ck-editor__editable') : null;
    if(ed) lastEditable = ed;
    if(ehCampoTexto(t)) ultimoCampo = t;
  }
  function escutarQuadros(qd){
    if(!escutados) return;
    qd.docs.forEach(function(q){ if(escutados.indexOf(q.doc) < 0){ escutados.push(q.doc); try{ on(q.doc, 'focusin', aoFocar, true); }catch(e){} } });
  }
  escutarQuadros(quadros());

  btnX.onclick = function(){
    dragEnd();
    listeners.forEach(function(l){ l[0].removeEventListener(l[1], l[2], l[3]); });
    listeners = [];
    bar.remove();
  };

  function overlayBox(titulo){
    var overlay = UI.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);z-index:1000000;display:flex;align-items:center;justify-content:center;padding:16px;';
    var box = UI.createElement('div');
    box.style.cssText = 'background:#1a1a2e;border-radius:10px;padding:16px;width:100%;max-width:480px;box-shadow:0 8px 30px rgba(0,0,0,0.4);';
    var label = UI.createElement('div');
    label.textContent = titulo;
    label.style.cssText = 'color:#fff;font-family:Arial,sans-serif;font-size:14px;margin-bottom:10px;';
    box.appendChild(label);
    var txt = UI.createElement('textarea');
    txt.style.cssText = 'width:100%;height:160px;box-sizing:border-box;border-radius:6px;border:1px solid #444;padding:8px;font-family:monospace;font-size:13px;resize:vertical;-webkit-user-select:text;user-select:text;';
    txt.setAttribute('autocapitalize', 'off');
    txt.setAttribute('autocorrect', 'off');
    txt.setAttribute('spellcheck', 'false');
    box.appendChild(txt);
    var btnRow = UI.createElement('div');
    btnRow.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;margin-top:12px;';
    box.appendChild(btnRow);
    overlay.appendChild(box);
    return {overlay: overlay, txt: txt, btnRow: btnRow};
  }

  function askText(titulo){
    return new Promise(function(resolve){
      var o = overlayBox(titulo);
      var btnCancel = UI.createElement('button');
      btnCancel.textContent = 'CANCELAR';
      btnCancel.style.cssText = 'background:transparent;color:#ccc;border:1px solid #666;border-radius:6px;padding:9px 14px;cursor:pointer;font-size:13px;';
      var btnOk = UI.createElement('button');
      btnOk.textContent = 'OK';
      btnOk.style.cssText = 'background:#2ecc71;color:#06321a;font-weight:bold;border:none;border-radius:6px;padding:9px 18px;cursor:pointer;font-size:13px;';
      o.btnRow.appendChild(btnCancel);
      o.btnRow.appendChild(btnOk);
      UI.body.appendChild(o.overlay);
      setTimeout(function(){ o.txt.focus(); }, 50);
      function close(val){ o.overlay.remove(); resolve(val); }
      btnCancel.onclick = function(){ close(null); };
      btnOk.onclick = function(){ var v = o.txt.value.trim(); close(v ? v : null); };
    });
  }

  /* caixa para copiar manualmente quando a area de transferencia falha */
  function showManualCopy(text){
    var o = overlayBox('Nao foi possivel copiar automaticamente. Selecione o texto abaixo e copie manualmente:');
    o.txt.value = text;
    o.txt.readOnly = true;
    var btnClose = UI.createElement('button');
    btnClose.textContent = 'FECHAR';
    btnClose.style.cssText = 'background:transparent;color:#ccc;border:1px solid #666;border-radius:6px;padding:9px 14px;cursor:pointer;font-size:13px;';
    btnClose.onclick = function(){ o.overlay.remove(); };
    o.btnRow.appendChild(btnClose);
    UI.body.appendChild(o.overlay);
    setTimeout(function(){ try{ o.txt.focus(); o.txt.select(); }catch(e){} }, 50);
  }

  /* ---------- deteccao de tipo ---------- */
  var TIPO_KEYS = {
    memed_cadastro: ['fullName','nome','cpf','birthDate','nasc','motherName','mae','email','phone','cel'],
    cadastro: ['nome','cpf','cns','nasc','nacionalidade','mae','pai','email','cel','tel','sexo','sangue','etnia','identidadeGenero','menorDeIdade','anotacoes'],
    antropometria: ['data','altura','peso','gordura','massaGorda','massaMuscular','massaMagra','gorduraVisceral','tmb','peitoral','axilarMedia','triceps','subescapular','abdominal','suprailiac','coxa','biceps','panturrilha','cCintura','cQuadril','cPanturrilha','cBraco','cPescoco','cAbdomen','cCoxa'],
    evolucao: ['evolucao'],
    prescricao: ['prescricao','especial'],
    exames: ['exames'],
    generico: []
  };
  function detectTipos(){
    if(location.hostname.indexOf('memed') > -1 && Q('[name="fullName"]')) return ['memed_cadastro'];
    var r = [];
    if(Q('[name="fullName"]')) r.push('cadastro');
    if(Q('[name="fatPct"]')) r.push('antropometria');
    if(Q('#evolution-template') || Q('[name="description"]')) r.push('evolucao');
    if(Q('input[name="special"]')) r.push('prescricao');
    if(Q('.ck-editor__editable') && r.indexOf('exames') < 0) r.push('exames');
    return r;
  }
  function has(v){ return v !== undefined && v !== null && v !== ''; }
  /* mesma ordem da original; mas se o JSON nao tem nenhuma chave do primeiro tipo e tem do seguinte, usa o seguinte */
  function chooseTipo(cands, d){
    for(var i = 0; i < cands.length; i++){
      var keys = TIPO_KEYS[cands[i]] || [];
      for(var k = 0; k < keys.length; k++){ if(has(d[keys[k]])) return cands[i]; }
    }
    /* 1.4: JSON com "campos" (nome/rotulo do campo -> valor) e nenhuma chave do tipo detectado: modo generico */
    if(d && ehObj(d.campos)) return 'generico';
    return cands[0];
  }

  function toBool(v){
    if(typeof v === 'string'){
      var s = v.trim().toLowerCase();
      if(['false','nao','não','n','0','no','off',''].indexOf(s) > -1) return false;
      return true;
    }
    return !!v;
  }
  function norm(s){
    s = String(s == null ? '' : s);
    if(s.normalize) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s.replace(/\s+/g, ' ').trim().toUpperCase();
  }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  /* texto simples com quebras de linha vira paragrafos (setData do CKEditor recebe HTML) */
  function toEditorHtml(v){
    var s = String(v);
    if(/<\/?[a-z][^>]*>/i.test(s)) return s;
    if(s.indexOf('\n') < 0) return esc(s);
    return s.split(/\r?\n/).map(function(l){ return '<p>' + (l.trim() ? esc(l) : '&nbsp;') + '</p>'; }).join('');
  }
  /* v2: datas DD/MM/AAAA ou DD-MM-AAAA -> AAAA-MM-DD (para input type=date); aceita ISO */
  function toIsoDate(v){
    var s = String(v).trim(), m;
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/);
    if(m) return m[1] + '-' + m[2] + '-' + m[3];
    m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if(!m) return null;
    var dd = +m[1], mm = +m[2];
    if(dd < 1 || dd > 31 || mm < 1 || mm > 12) return null;
    return m[3] + '-' + (mm < 10 ? '0' : '') + mm + '-' + (dd < 10 ? '0' : '') + dd;
  }
  /* v2: compara sem acento e com terminacao a/o equivalente (Branca ~ BRANCO) */
  function stemNorm(s){ return norm(s).split(' ').map(function(p){ return p.length > 2 ? p.replace(/[AO]$/, '') : p; }).join(' '); }
  var ETNIA_SIN = {
    'BRANCA':'BRANCO','BRANCO':'BRANCO','PRETA':'PRETO','PRETO':'PRETO','NEGRA':'PRETO','NEGRO':'PRETO',
    'PARDA':'PARDO','PARDO':'PARDO','AMARELA':'AMARELO','AMARELO':'AMARELO',
    'INDIGENA':'INDIO','INDIO':'INDIO','INDIA':'INDIO',
    'NAO INFORMADA':'NAO INFORMADO','NAO INFORMADO':'NAO INFORMADO','SEM INFORMACAO':'NAO INFORMADO'
  };
  function pickOption(opts, v, key){
    var exato = String(v).trim().toUpperCase(), alvo = norm(v), i;
    for(i = 0; i < opts.length; i++) if(opts[i].textContent.trim().toUpperCase() === exato) return opts[i];
    for(i = 0; i < opts.length; i++) if(norm(opts[i].textContent) === alvo) return opts[i];
    if(key === 'etnia' && ETNIA_SIN[alvo]){
      for(i = 0; i < opts.length; i++) if(norm(opts[i].textContent) === ETNIA_SIN[alvo]) return opts[i];
    }
    var st = stemNorm(v), m = opts.filter(function(x){ return stemNorm(x.textContent) === st; });
    return m.length === 1 ? m[0] : null;
  }
  function isHidden(el){
    for(var k = 0, n = el; n && k < 400; k++){
      if(n.nodeType === 11 && n.host){ n = n.host; continue; }
      if(n.nodeType !== 1){
        var fe = null; try{ fe = n.nodeType === 9 && n.defaultView ? n.defaultView.frameElement : null; }catch(e){}
        if(fe){ n = fe; continue; }
        break;
      }
      if(n.hidden) return true;
      var wn = janelaDe(n), cs = wn.getComputedStyle ? wn.getComputedStyle(n) : null;
      if(cs && (cs.display === 'none' || cs.visibility === 'hidden')) return true;
      n = n.parentNode;
    }
    return false;
  }

  /* v2: editores prontos (visiveis e com instancia) e aba "Texto livre" da prescricao */
  function readyEditors(){
    return QA('.ck-editor__editable').filter(function(el){ return !bar.contains(el) && el.ckeditorInstance && !isHidden(el); });
  }
  function anyVisibleEditable(){
    return QA('.ck-editor__editable').some(function(el){ return !bar.contains(el) && !isHidden(el); });
  }
  function findTextoLivreTab(){
    var TAB = '[role="tab"],.mat-mdc-tab,.mat-tab-label';
    var els = QA(TAB + ',button,a').filter(function(el){ return !bar.contains(el) && !isHidden(el); });
    var lab = function(el){ return norm(el.textContent); };
    var i;
    for(i = 0; i < els.length; i++) if(lab(els[i]) === 'TEXTO LIVRE') return els[i];
    for(i = 0; i < els.length; i++) if(els[i].matches(TAB) && lab(els[i]).indexOf('TEXTO LIVRE') > -1) return els[i];
    for(i = 0; i < els.length; i++) if(lab(els[i]).indexOf('TEXTO LIVRE') > -1 && lab(els[i]).length <= 40) return els[i];
    return null;
  }


  /* ---------- 1.4: modo generico (qualquer formulario, inclusive dentro de quadros) ----------
     JSON plano {"chave": valor} ou {"campos": {"nome ou rotulo do campo": valor}}; a chave e procurada no name, id,
     formcontrolname, aria-label, placeholder e no rotulo do campo. Textos (evolucao, texto, ...) sem campo com esse nome vao
     para a caixa de texto clicada por ultimo ou, se houver uma so, para ela. */
  var META_GEN = ['paciente','prontuario','tipo','carimbar','versao','campos'];
  var CHAVES_TEXTO = ['evolucao','texto','prescricao','exames','anotacoes','obs','observacao','observacoes','conduta','descricao','anamnese','historia','transicao','resumo'];
  function chaveNorm(s){ return norm(s).replace(/[^A-Z0-9]+/g, '').toLowerCase(); }
  function ehEditavel(el){ return !!(el && el.nodeType === 1 && (el.isContentEditable || el.getAttribute('contenteditable') === 'true' || (tag(el) === 'BODY' && el.ownerDocument && el.ownerDocument.designMode === 'on'))); }
  function ehCampoTexto(el){
    if(!el || el.nodeType !== 1) return false;
    var tg = tag(el);
    if(tg === 'TEXTAREA') return !el.disabled && !el.readOnly;
    if(tg === 'INPUT'){ var ty = (el.getAttribute('type') || 'text').toLowerCase(); return ['text','search','email','tel','url','number','date'].indexOf(ty) > -1 && !el.disabled && !el.readOnly; }
    return ehEditavel(el);
  }
  function raizEditavel(el){ while(el.parentElement && ehEditavel(el.parentElement)) el = el.parentElement; return el; }
  /* texto rico: contenteditable de mais alto nivel e corpos de quadros em modo de edicao (editores em iframe) */
  function editaveis(){
    var r = [];
    QA('[contenteditable]').forEach(function(el){
      if(bar.contains(el) || !ehEditavel(el) || el.getAttribute('contenteditable') === 'false') return;
      if(el.parentElement && ehEditavel(el.parentElement)) return;
      r.push(el);
    });
    quadros().docs.forEach(function(q){
      var b = q.doc.body;
      if(b && tag(b) === 'BODY' && q.doc !== UI && (q.doc.designMode === 'on' || b.getAttribute('contenteditable') === 'true') && r.indexOf(b) < 0) r.push(b);
    });
    return r;
  }
  function camposGenericos(){
    return QA('input,textarea,select').filter(function(el){
      if(bar.contains(el)) return false;
      var ty = (el.getAttribute('type') || '').toLowerCase();
      return !(tag(el) === 'INPUT' && ['hidden','submit','button','image','reset','file','password'].indexOf(ty) > -1);
    }).concat(editaveis());
  }
  function chaveDe(el){
    var r = el.getAttribute('name') || el.getAttribute('formcontrolname') || (el.id && !/^(mat-|cdk-|ext-|gwt-|x-auto-)/.test(el.id) ? el.id : '') || rotuloDe(el);
    if(!r && tag(el) === 'BODY') r = 'texto';
    return r || '';
  }
  var ATTRS_GEN = ['name','id','formcontrolname','ng-model','data-field','data-name','aria-label','placeholder','title'];
  function acharCampo(k, lista){
    var alvo = chaveNorm(k);
    if(!alvo) return null;
    var vis = lista.filter(function(el){ return !el.disabled && !isHidden(el); });
    for(var a = 0; a < ATTRS_GEN.length; a++){
      for(var i = 0; i < vis.length; i++){ var v = vis[i].getAttribute(ATTRS_GEN[a]); if(v && chaveNorm(v) === alvo) return vis[i]; }
    }
    var rot = vis.map(function(el){ return chaveNorm(rotuloDe(el)); });
    for(var j = 0; j < vis.length; j++) if(rot[j] === alvo) return vis[j];
    /* rotulo que comeca com as mesmas palavras da chave ("PA" -> "PA (mmHg)"), se for um so */
    var pal = function(x){ return norm(x).replace(/[^A-Z0-9]+/g, ' ').trim().split(' ').filter(Boolean); };
    var pk = pal(k);
    if(pk.length){
      var pre = vis.filter(function(el){ var pr = pal(rotuloDe(el)); if(pr.length < pk.length) return false; for(var z = 0; z < pk.length; z++) if(pr[z] !== pk[z]) return false; return true; });
      if(pre.length === 1) return pre[0];
    }
    if(alvo.length >= 3){
      var com = vis.filter(function(el, x){ return rot[x] && (rot[x].indexOf(alvo) === 0 || (alvo.length >= 4 && rot[x].indexOf(alvo) > -1)); });
      if(com.length === 1) return com[0];
    }
    return null;
  }
  function ehCaixaTexto(el){ return (tag(el) === 'TEXTAREA' || ehEditavel(el)) && !el.disabled && !el.readOnly && !isHidden(el); }
  /* para "evolucao"/"texto": caixa clicada por ultimo, cursor atual, ou a unica caixa de texto da tela */
  function alvoTexto(lista){
    var caixas = lista.filter(ehCaixaTexto);
    var cands = [ultimoCampo, ativoProfundo()];
    for(var i = 0; i < cands.length; i++){
      var c = cands[i];
      if(!c || c.nodeType !== 1 || bar.contains(c) || c.isConnected === false || isHidden(c)) continue;
      if(ehEditavel(c)) return {el: raizEditavel(c), fonte: 'caixa clicada'};
      if(tag(c) === 'TEXTAREA' && ehCaixaTexto(c)) return {el: c, fonte: 'caixa clicada'};
    }
    if(caixas.length === 1) return {el: caixas[0], fonte: 'unica caixa de texto'};
    if(!caixas.length){
      var c2 = ultimoCampo;
      if(c2 && c2.isConnected !== false && ehCampoTexto(c2) && !isHidden(c2)) return {el: c2, fonte: 'campo clicado'};
    }
    return {n: caixas.length};
  }
  function setNativo(e, v){
    var W = janelaDe(e), P = tag(e) === 'TEXTAREA' ? W.HTMLTextAreaElement : tag(e) === 'SELECT' ? W.HTMLSelectElement : W.HTMLInputElement;
    var dsc = P && P.prototype ? Object.getOwnPropertyDescriptor(P.prototype, 'value') : null;
    if(dsc && dsc.set) dsc.set.call(e, v); else e.value = v;
  }
  /* eventos com a janela do proprio campo (o quadro), na ordem de quem digita: foco, tecla, input, tecla solta, change, saida */
  function evento(e, tipo){
    var W = janelaDe(e), ev = null, bolha = tipo !== 'focus'; /* blur borbulha como na 1.3 (delegacao em frameworks) */
    try{
      if(/^key/.test(tipo)) ev = new W.KeyboardEvent(tipo, {bubbles: true, cancelable: true, key: 'Unidentified'});
      else if(/^(focus|blur|focusin|focusout)$/.test(tipo)) ev = new W.FocusEvent(tipo, {bubbles: bolha});
      else ev = new W.Event(tipo, {bubbles: true});
    }catch(err){ try{ ev = new W.Event(tipo, {bubbles: bolha}); }catch(err2){ ev = new Event(tipo, {bubbles: bolha}); } }
    e.dispatchEvent(ev);
  }
  function digitar(e){ ['focus','focusin','keydown','input','keyup','change','blur','focusout'].forEach(function(k){ evento(e, k); }); }
  var destaques = [];
  function destacar(el, cor, marca){
    try{
      var alvo = el;
      if(tag(el) === 'BODY'){ var fe = el.ownerDocument.defaultView.frameElement; if(fe) alvo = fe; }
      if(destaques.some(function(x){ return x.el === alvo; })) return;
      var reg = {el: alvo, o: alvo.style.outline, off: alvo.style.outlineOffset, tinha: alvo.hasAttribute('style')};
      destaques.push(reg);
      alvo.style.outline = '3px solid ' + (cor || '#2ecc71'); alvo.style.outlineOffset = '1px';
      alvo.setAttribute('data-carimbar-destaque', marca || 'preenchido');
      setTimeout(function(){
        try{ alvo.style.outline = reg.o; alvo.style.outlineOffset = reg.off; if(!reg.tinha && !alvo.getAttribute('style')) alvo.removeAttribute('style'); alvo.removeAttribute('data-carimbar-destaque'); }catch(e){}
        destaques = destaques.filter(function(x){ return x !== reg; });
      }, 8000);
    }catch(e){}
  }
  function escreverRico(el, texto){
    if(el.ckeditorInstance){ el.ckeditorInstance.setData(toEditorHtml(texto)); return true; }
    var d = el.ownerDocument, W = d.defaultView;
    try{
      var pw = W.frameElement ? W.parent : W;
      if(pw.CKEDITOR && pw.CKEDITOR.instances){
        for(var nm in pw.CKEDITOR.instances){ var ins = pw.CKEDITOR.instances[nm]; try{ var ed = ins.editable && ins.editable(); if(ed && ed.$ === el){ ins.setData(toEditorHtml(texto)); return true; } }catch(e){} }
      }
      if(pw.tinymce && pw.tinymce.editors){
        var eds = pw.tinymce.editors;
        for(var i = 0; i < eds.length; i++){ try{ if(eds[i].getBody && eds[i].getBody() === el){ eds[i].setContent(toEditorHtml(texto)); if(eds[i].fire) eds[i].fire('change'); return true; } }catch(e){} }
      }
    }catch(e){}
    var ok = false;
    try{
      el.focus();
      var s = W.getSelection(), rg = d.createRange(); rg.selectNodeContents(el); s.removeAllRanges(); s.addRange(rg);
      ok = d.execCommand('insertText', false, String(texto)) === true;
    }catch(e){ ok = false; }
    var linhas = String(texto).split(/\r?\n/).filter(function(l){ return l.trim(); });
    var atual = norm(el.innerText !== undefined ? el.innerText : el.textContent);
    if(!ok || (linhas.length && atual.indexOf(norm(linhas[0])) < 0) || (linhas.length > 1 && atual.indexOf(norm(linhas[linhas.length - 1])) < 0)){
      el.innerHTML = toEditorHtml(texto);
      evento(el, 'input');
    }
    ['keyup','change'].forEach(function(k){ evento(el, k); });
    return norm(el.textContent) !== '';
  }
  async function aplicarGen(el, v, k, ctx){
    if(v !== null && typeof v === 'object'){ ctx.recusados.push(k + ' (valor nao e texto)'); return; }
    var tg = tag(el), ty = (el.getAttribute('type') || '').toLowerCase();
    if(el.ckeditorInstance || ehEditavel(el)){
      if(escreverRico(el, String(v))) ctx.ok(el); else ctx.recusados.push(k + ' (...)');
      return;
    }
    if(tg === 'SELECT'){
      var ops = [].slice.call(el.options), o = pickOption(ops, v, k) || ops.filter(function(x){ return String(x.value) === String(v); })[0] || null;
      if(!o){ ctx.semOpcao.push(k + ' (' + v + ')'); return; }
      setNativo(el, o.value); o.selected = true;
      digitar(el);
      if(el.selectedIndex > -1 && el.options[el.selectedIndex] === o) ctx.ok(el); else ctx.recusados.push(k + ' (' + v + ')');
      return;
    }
    if(ty === 'checkbox'){
      var quer = toBool(v);
      if(!!el.checked !== quer) el.click();
      if(!!el.checked !== quer){ el.checked = quer; evento(el, 'change'); }
      if(!!el.checked === quer) ctx.ok(el); else ctx.recusados.push(k + ' (' + v + ')');
      return;
    }
    if(ty === 'radio'){
      var raiz = el.form || (el.getRootNode ? el.getRootNode() : el.ownerDocument);
      var grupo = el.name ? [].slice.call(raiz.querySelectorAll('input[type="radio"]')).filter(function(x){ return x.name === el.name; }) : [el];
      var av = chaveNorm(v), r = grupo.filter(function(x){ return chaveNorm(x.value) === av || chaveNorm(rotuloDe(x)) === av; })[0];
      if(!r && grupo.length === 1 && toBool(v)) r = grupo[0];
      if(!r){ ctx.semOpcao.push(k + ' (' + v + ')'); return; }
      r.click(); if(!r.checked){ r.checked = true; evento(r, 'change'); }
      if(r.checked) ctx.ok(r); else ctx.recusados.push(k + ' (' + v + ')');
      return;
    }
    var val = ty === 'date' ? (toIsoDate(v) || String(v)) : String(v);
    setNativo(el, val);
    digitar(el);
    if(String(el.value) !== '') ctx.ok(el); else ctx.recusados.push(k + ' (' + v + ')');
  }
  function paresGen(d, so){
    var pares = [];
    Object.keys(d).forEach(function(k){ if(META_GEN.indexOf(k) < 0 && (!so || so.indexOf(k) > -1)) pares.push([k, d[k]]); });
    if(!so && ehObj(d.campos)) Object.keys(d.campos).forEach(function(k){ pares.push([k, d.campos[k]]); });
    return pares;
  }
  /* so: limita as chaves (fallback de um tipo conhecido sem editor) */
  async function preencherGenerico(d, ctx, so){
    var lista = camposGenericos(), usados = [];
    var pares = paresGen(d, so);
    for(var i = 0; i < pares.length; i++){
      var k = pares[i][0], v = pares[i][1];
      if(!has(v)) continue;
      var livres = lista.filter(function(x){ return usados.indexOf(x) < 0; });
      var el = acharCampo(k, livres);
      if(!el && CHAVES_TEXTO.indexOf(chaveNorm(k)) > -1){
        var a = alvoTexto(livres);
        if(a.el){ el = a.el; ctx.avisos.push(k + ' -> ' + a.fonte + (caminhoDe(el) ? ' (quadro ' + caminhoDe(el) + ')' : '')); }
        else if(a.n > 1){ ctx.avisos.push('Ha ' + a.n + ' caixas de texto para "' + k + '": clique dentro da caixa certa e clique CARIMBAR de novo'); ctx.miss(k); continue; }
      }
      if(!el){ ctx.miss(k); continue; }
      usados.push(el);
      await aplicarGen(el, v, k, ctx);
    }
  }

  var summaryHideTimer = null;
  function showSummary(lines){
    summaryRow.textContent = '';
    var t = UI.createElement('div');
    t.textContent = lines.join('\n');
    var x = UI.createElement('button');
    x.textContent = 'ok';
    x.style.cssText = 'margin-top:4px;background:transparent;color:#888;border:1px solid #555;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px;';
    x.onclick = function(){ summaryRow.style.display = 'none'; };
    summaryRow.appendChild(t);
    summaryRow.appendChild(x);
    summaryRow.style.display = 'block';
    if(summaryHideTimer) clearTimeout(summaryHideTimer);
  }

  /* pergunta dentro da barra (nao bloqueia a pagina) */
  function showPergunta(lines, botoes){
    showSummary(lines);
    var ok = summaryRow.lastChild;
    var linha = UI.createElement('div');
    linha.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;';
    botoes.forEach(function(b){
      var el = UI.createElement('button');
      el.textContent = b.rotulo; if(b.id) el.id = b.id;
      el.style.cssText = 'background:#0f3460;color:' + (b.cor || '#2ecc71') + ';border:1px solid ' + (b.cor || '#2ecc71') + ';border-radius:5px;padding:5px 10px;cursor:pointer;font-size:12px;font-weight:bold;';
      el.onclick = function(){ summaryRow.style.display = 'none'; return b.fn(); };
      linha.appendChild(el);
    });
    summaryRow.insertBefore(linha, ok);
    if(ok) ok.remove();
  }
  function melhorDaFila(lista, pac){
    var best = null, bs = 0;
    lista.forEach(function(x){
      var s = nomeConfere(x.paciente, pac.nome);
      if(s && x.prontuario && pac.prontuario){ s = soDigitos(x.prontuario) === pac.prontuario ? s + 100 : 0; }
      if(s && (s > bs || (s === bs && x.em >= best.em))){ best = x; bs = s; }
    });
    return best;
  }
  function textoAnterior(){ return summaryRow.style.display !== 'none' && summaryRow.firstChild ? summaryRow.firstChild.textContent : ''; }

  /* opts.somente: so este item da fila (chegou pela nuvem); opts.solto: usar o JSON sem paciente; opts.forcar: item escolhido sem checagem */
  async function carimbar(opts){
    opts = opts && typeof opts === 'object' && typeof opts.preventDefault !== 'function' ? opts : {};
    summaryRow.removeAttribute('data-aviso');
    var cands = detectTipos();
    if(!cands.length){
      var ng = camposGenericos().length;
      if(!ng){ var qd0 = quadros(); alert('Nenhum formulario reconhecido.' + (qd0.ignorados ? ' Esta tela tem ' + qd0.ignorados + ' quadro(s) de outro site, que o navegador nao deixa ler.' : '')); return; }
      cands = ['generico'];
    }
    var saved = sessionStorage.getItem(CHAVE);
    if(!saved && !opts.somente && !opts.forcar && !lerFila().length){
      saved = await askText(cands[0] === 'generico' ? 'Formulario com ' + camposGenericos().length + ' campo(s) detectado. Cole o texto/JSON:' : cands.join('/').toUpperCase() + ' detectado. Cole o texto/JSON:');
      if(!saved) return;
      guardarTexto(saved);
      updateStatus();
      saved = sessionStorage.getItem(CHAVE);
    }
    var d = null;
    if(saved && !opts.somente && !opts.forcar){
      var objs = objetosDoTexto(saved);
      if(!objs.length){ alert('JSON invalido'); sessionStorage.removeItem(CHAVE); updateStatus(); return; }
      if(objs.some(function(o){ return pacienteDe(o); })){ guardarTexto(saved); updateStatus(); saved = sessionStorage.getItem(CHAVE); objs = saved ? objetosDoTexto(saved) : []; }
      d = objs.length ? objs[objs.length - 1] : null;
    }
    var pac = detectPaciente();
    atualizarInfo(pac);
    var fn0 = Q('input[name="fullName"]');
    var novoCadastro = cands.indexOf('cadastro') > -1 && fn0 && !bar.contains(fn0) && !String(fn0.value).trim();
    var notas = [], alvo = null;
    var lista = opts.somente ? [opts.somente] : (opts.solto ? [] : lerFila());
    if(opts.forcar){
      alvo = opts.forcar;
      notas.push('Preenchido sem checagem do paciente (confirmado por voce): ' + alvo.paciente);
    } else if(novoCadastro){
      var opcoes = lista.slice();
      if(!opts.somente && d) opcoes.push({paciente: '', json: d});
      if(!opcoes.length) return;
      if(opcoes.length > 1){
        showPergunta(['Cadastro novo: qual paciente cadastrar?'], opcoes.map(function(o, i){
          return {rotulo: o.paciente ? 'Cadastrar ' + o.paciente : 'Usar JSON sem paciente', id: 'carimbarEscolha' + i, fn: function(){ return o.paciente ? carimbar({forcar: o}) : carimbar({solto: true}); }};
        }).concat([{rotulo: 'Cancelar', id: 'carimbarCancelar', cor: '#cccccc', fn: function(){}}]));
        return;
      }
      alvo = opcoes[0].paciente ? opcoes[0] : null;
      if(!alvo) d = opcoes[0].json;
      notas.push('Cadastro novo: paciente ainda nao existe, sem checagem');
    } else if(lista.length){
      if(pacienteValido(pac)){
        alvo = melhorDaFila(lista, pac);
        if(alvo) notas.push('Paciente conferido: ' + alvo.paciente + ' = ' + pac.nome);
        else if(!opts.somente && d){ notas.push('JSON sem paciente: sem checagem'); }
        else {
          var x = lista.length === 1 ? lista[0] : null;
          var msg = x ? 'Este JSON é do paciente ' + x.paciente + ', mas a tela aberta é de ' + pac.nome + '. Nada foi preenchido.'
            : 'Os JSONs na fila são dos pacientes ' + lista.map(function(i){ return i.paciente; }).join(', ') + ', mas a tela aberta é de ' + pac.nome + '. Nada foi preenchido.';
          if(x && x.prontuario && pac.prontuario && nomeConfere(x.paciente, pac.nome)) msg = 'Este JSON é do paciente ' + x.paciente + ' (prontuário ' + x.prontuario + '), mas a tela aberta é do prontuário ' + pac.prontuario + '. Nada foi preenchido.';
          var ant = opts.somente ? textoAnterior() : '';
          showSummary([msg].concat(opts.somente ? ['O JSON ficou na fila para quando a tela desse paciente estiver aberta.'] : []).concat(ant ? ['— antes —', ant] : []));
          summaryRow.setAttribute('data-aviso', 'paciente-diferente');
          return;
        }
      } else if(!opts.somente && d && !lista.length){
        notas.push('JSON sem paciente: sem checagem');
      } else {
        var porque = pac && pac.conflito ? ' (nomes diferentes: ' + pac.conflito.join(' / ') + ')' : '';
        var bts = lista.length === 1
          ? [{rotulo: 'Preencher mesmo assim', id: 'carimbarPreencherAssim', cor: '#f1c40f', fn: function(){ return carimbar({forcar: lista[0]}); }}]
          : lista.map(function(o, i){ return {rotulo: 'Preencher com ' + o.paciente, id: 'carimbarPreencherAssim' + i, cor: '#f1c40f', fn: function(){ return carimbar({forcar: o}); }}; });
        bts.push({rotulo: 'Cancelar', id: 'carimbarCancelar', cor: '#cccccc', fn: function(){}});
        showPergunta(['Não consegui identificar o paciente nesta tela' + porque + '.', 'JSON' + (lista.length > 1 ? 's' : '') + ' de: ' + lista.map(function(o){ return o.paciente; }).join(', ')], bts);
        summaryRow.setAttribute('data-aviso', 'sem-paciente');
        return;
      }
    } else if(d){
      notas.push('JSON sem paciente: sem checagem');
    } else return;
    summaryRow.removeAttribute('data-aviso');
    if(alvo){
      d = alvo.json;
      if(novoCadastro && !has(d.nome) && has(d.paciente)){ var c2 = {}; for(var kk in d) c2[kk] = d[kk]; c2.nome = d.paciente; d = c2; }
    }
    if(!d || typeof d !== 'object' || Array.isArray(d)){ alert('JSON invalido'); return; }
    var tipo = chooseTipo(cands, d);

    var w = function(ms){ return new Promise(function(x){ setTimeout(x, ms); }); };

    var filled = 0, semCampo = [], semOpcao = [], avisos = [], recusados = [];
    /* v2: so conta como preenchido se o campo realmente ficou com valor */
    function holds(e){
      var ok = tag(e) === 'SELECT' ? e.selectedIndex > -1 && e.value !== '' : String(e.value) !== '';
      if(ok) destacar(e);
      return ok;
    }
    function refused(key, v){ recusados.push(key + ' (' + v + ')'); }
    function valueFor(e, v){
      if(e.type === 'date'){ var iso = toIsoDate(v); if(iso) return iso; }
      return String(v);
    }
    function miss(key){ if(semCampo.indexOf(key) < 0) semCampo.push(key); }
    function fire(e){ digitar(e); }
    function setVal(e, v){ setNativo(e, v); }
    var ctx = {recusados: recusados, semOpcao: semOpcao, avisos: avisos, miss: miss, ok: function(el){ filled++; destacar(el); }};

    var t = function(n, v, key){
      if(!has(v)) return;
      var e = Q('input[name="'+n+'"],textarea[name="'+n+'"],select[name="'+n+'"]');
      if(!e){ miss(key || n); return; }
      setVal(e, valueFor(e, v));
      fire(e);
      if(holds(e)) filled++; else refused(key || n, v);
    };
    var ta = function(n, v, key){
      if(!has(v)) return;
      var e = Q('textarea[name="'+n+'"]');
      if(!e){ miss(key || n); return; }
      setNativo(e, String(v));
      fire(e);
      if(holds(e)) filled++; else refused(key || n, v);
    };
    var sel = async function(n, v, key){
      if(!has(v)) return;
      var g = Q('mat-select[name="'+n+'"]');
      var gd = g ? g.ownerDocument : document;
      if(!g){ miss(key); return; }
      g.click();
      await w(400);
      var o = null, tries = 0;
      while(!o && tries < 12){
        var scope = gd;
        var pid = g.getAttribute('aria-controls') || g.getAttribute('aria-owns');
        if(pid && gd.getElementById(pid)) scope = gd.getElementById(pid);
        var opts = [].slice.call(scope.querySelectorAll(scope === gd ? '.cdk-overlay-container mat-option' : 'mat-option'));
        o = pickOption(opts, v, key);
        if(o || opts.length) break;
        tries++;
        await w(100);
      }
      if(o){ o.click(); filled++; destacar(g); }
      else {
        g.dispatchEvent(new (janelaDe(g).KeyboardEvent)('keydown', {key:'Escape', keyCode:27, bubbles:true}));
        gd.body.click();
        semOpcao.push(key + ' (' + v + ')');
      }
      await w(300);
    };
    var nsel = function(n, v, key){
      if(!has(v)) return;
      var e = Q('select[name="'+n+'"]');
      if(!e){ miss(key || n); return; }
      setNativo(e, String(v));
      evento(e, 'change');
      if(holds(e)) filled++; else refused(key || n, v);
    };
    var dt = function(slot, placeholder, v, key){
      if(!has(v)) return;
      var e = Q('input[data-slot="'+slot+'"]') || Q('input[placeholder="'+placeholder+'"]');
      if(!e){ miss(key); return; }
      setNativo(e, valueFor(e, v));
      fire(e);
      if(holds(e)) filled++; else refused(key, v);
    };
    /* escolhe o editor: contexto do tipo, visivel, nao somente-leitura, ultimo clicado; se ambiguo, pede para o usuario clicar */
    var ck = function(texto, contexto){
      var all = QA('.ck-editor__editable').filter(function(el){ return !bar.contains(el); });
      if(!all.length){ alert('Editor nao encontrado.'); return false; }
      var c = all.filter(function(el){ return el.ckeditorInstance; });
      if(!c.length){ alert('Instancia do editor nao encontrada.'); return false; }
      var vis = c.filter(function(el){ return !isHidden(el) && !(el.ckeditorInstance.isReadOnly) && !el.classList.contains('ck-read-only'); });
      if(vis.length) c = vis;
      if(contexto){
        var inCtx = c.filter(function(el){ return contexto.contains(el); });
        if(inCtx.length) c = inCtx;
      }
      var el = null;
      if(c.length === 1) el = c[0];
      else if(lastEditable && c.indexOf(lastEditable) > -1) el = lastEditable;
      else if(ativoProfundo() && c.indexOf(ativoProfundo()) > -1) el = ativoProfundo();
      if(!el){
        alert('Ha ' + c.length + ' editores de texto nesta pagina. Toque dentro do editor que deve receber o texto e toque CARIMBAR de novo.');
        return false;
      }
      el.ckeditorInstance.setData(toEditorHtml(texto));
      if(typeof el.ckeditorInstance.getData === 'function' && !el.ckeditorInstance.getData()) refused('texto', '...'); else { filled++; destacar(el); }
      return true;
    };
    var ckByName = function(n, texto, key){
      if(!has(texto)) return;
      var wrap = Q('ckeditor[name="'+n+'"]');
      var el = wrap && wrap.querySelector('.ck-editor__editable');
      var editor = el && el.ckeditorInstance;
      if(!editor){ miss(key); return; }
      editor.setData(toEditorHtml(texto));
      if(typeof editor.getData === 'function' && !editor.getData()) refused(key, '...'); else filled++;
    };
    /* estado real: input interno (MDC e legado), classes antiga e nova, aria-checked */
    var checkState = function(host){
      var inp = host.matches && host.matches('input[type="checkbox"]') ? host : host.querySelector('input[type="checkbox"]');
      if(inp) return {checked: !!inp.checked, input: inp};
      if(host.classList.contains('mat-checkbox-checked') || host.classList.contains('mat-mdc-checkbox-checked')) return {checked: true, input: null};
      return {checked: host.getAttribute('aria-checked') === 'true', input: null};
    };
    var setCheck = function(host, desired, key){
      var st = checkState(host);
      if(st.checked === desired){ filled++; return; }
      (st.input || host).click();
      if(checkState(host).checked !== desired && st.input){ host.click(); }
      if(checkState(host).checked !== desired) avisos.push(key + ': nao foi possivel ' + (desired ? 'marcar' : 'desmarcar') + ' a caixa');
      else filled++;
    };
    var matCheck = function(n, v, key){
      if(!has(v)) return;
      var mcb = Q('mat-checkbox[name="'+n+'"]') || Q('input[type="checkbox"][name="'+n+'"]');
      if(!mcb){ miss(key); return; }
      setCheck(mcb, toBool(v), key);
    };
    var alt = function(a, b){ return has(a) ? a : b; };

    if(tipo === 'cadastro'){
      t('fullName', d.nome, 'nome');
      t('document', d.cpf, 'cpf');
      t('cnsNumber', d.cns, 'cns');
      t('bornDate', d.nasc, 'nasc');
      t('nationality', d.nacionalidade, 'nacionalidade');
      t('motherName', d.mae, 'mae');
      t('fatherName', d.pai, 'pai');
      t('email', d.email, 'email');
      t('principalNumber', d.cel, 'cel');
      t('secondaryNumber', d.tel, 'tel');
      await sel('gender', d.sexo, 'sexo');
      await sel('bloodType', d.sangue, 'sangue');
      await sel('ethnicGroup', d.etnia, 'etnia');
      await sel('genderIdentity', d.identidadeGenero, 'identidadeGenero');
      matCheck('isMinor', d.menorDeIdade, 'menorDeIdade');
      ckByName('annotations', alt(d.anotacoes, d.obs), has(d.anotacoes) ? 'anotacoes' : 'obs');
    } else if(tipo === 'memed_cadastro'){
      t('fullName', alt(d.fullName, d.nome), 'nome');
      t('cpf', d.cpf, 'cpf');
      dt('date-picker', 'DD/MM/AAAA', alt(d.birthDate, d.nasc), 'nasc');
      t('motherName', alt(d.motherName, d.mae), 'mae');
      t('weight', alt(d.weight, d.peso), 'peso');
      t('height', alt(d.height, d.altura), 'altura');
      t('email', d.email, 'email');
      t('phone', alt(d.phone, d.cel), 'cel');
      t('cep', d.cep, 'cep');
      t('street', alt(d.street, d.rua), 'rua');
      t('number', alt(d.number, d.numero), 'numero');
      t('complement', alt(d.complement, d.complemento), 'complemento');
      t('neighborhood', alt(d.neighborhood, d.bairro), 'bairro');
      t('city', alt(d.city, d.cidade), 'cidade');
      t('state', alt(d.state, d.uf), 'uf');
      nsel('gender', alt(d.gender, d.sexo), 'sexo');
      nsel('genderIdentityId', d.genderIdentityId, 'genderIdentityId');
      nsel('race', alt(d.race, d.raca), 'raca');
    } else if(tipo === 'prescricao'){
      var tp = alt(d.prescricao, d.texto);
      if(!has(tp)){ alert('Chave prescricao nao encontrada.'); return; }
      /* v2: modo estruturado (padrao) nao tem editor; abre a aba "Texto livre" e espera o editor (ate ~3 s) */
      if(!readyEditors().length){
        var tabLivre = findTextoLivreTab();
        if(tabLivre){
          tabLivre.click();
          for(var tw = 0; tw < 30 && !readyEditors().length; tw++) await w(100);
          if(readyEditors().length) avisos.push('Aba Texto livre aberta automaticamente');
        }
        if(!readyEditors().length && !anyVisibleEditable()){
          showSummary(['Tipo: prescricao | preenchidos: 0', 'Abra a aba Texto livre e clique CARIMBAR de novo']);
          return;
        }
      }
      var cbS = Q('input[type="checkbox"][name="special"]');
      if(!ck(tp, cbS && cbS.closest('form'))) return;
      if(has(d.especial)){
        if(cbS) setCheck(cbS, toBool(d.especial), 'especial'); else miss('especial');
      }
    } else if(tipo === 'antropometria'){
      t('assessmentDate', d.data, 'data');
      t('height', d.altura, 'altura');
      t('weight', d.peso, 'peso');
      t('fatPct', d.gordura, 'gordura');
      t('fatMass', d.massaGorda, 'massaGorda');
      t('muscleMass', d.massaMuscular, 'massaMuscular');
      t('leanMass', d.massaMagra, 'massaMagra');
      t('visceral', d.gorduraVisceral, 'gorduraVisceral');
      t('bmr', d.tmb, 'tmb');
      t('chest', d.peitoral, 'peitoral');
      t('midaxillary', d.axilarMedia, 'axilarMedia');
      t('triceps', d.triceps, 'triceps');
      t('subscapular', d.subescapular, 'subescapular');
      t('abdominal', d.abdominal, 'abdominal');
      t('suprailiac', d.suprailiac, 'suprailiac');
      t('thigh', d.coxa, 'coxa');
      t('biceps', d.biceps, 'biceps');
      t('medialCalf', d.panturrilha, 'panturrilha');
      t('cWaist', d.cCintura, 'cCintura');
      t('cHip', d.cQuadril, 'cQuadril');
      t('cCalf', d.cPanturrilha, 'cPanturrilha');
      t('cArm', d.cBraco, 'cBraco');
      t('cNeck', d.cPescoco, 'cPescoco');
      t('cAbdomen', d.cAbdomen, 'cAbdomen');
      t('cThigh', d.cCoxa, 'cCoxa');
      ta('notes', d.obs, 'obs');
    } else if(tipo === 'generico'){
      await preencherGenerico(d, ctx);
    } else if(tipo === 'exames'){
      var te = alt(d.exames, d.texto);
      if(!has(te)){ alert('Chave exames nao encontrada.'); return; }
      if(!ck(te, null)) return;
    } else if(tipo === 'evolucao'){
      var tv = alt(d.evolucao, d.texto);
      if(!has(tv)){ alert('Chave evolucao nao encontrada.'); return; }
      if(!QA('.ck-editor__editable').length){
        /* 1.4: evolucao numa caixa de texto comum (sem CKEditor): modo generico so com a chave do texto */
        await preencherGenerico(d, ctx, [has(d.evolucao) ? 'evolucao' : 'texto']);
        avisos.push('Sem editor de texto rico: usei a caixa de texto da tela');
      } else if(!ck(tv, Q('#evolution-template'))) return;
    }

    /* resumo nao bloqueante dentro da barra */
    var linhas = ['Tipo: ' + tipo + (cands.length > 1 ? ' (pagina tambem parece: ' + cands.filter(function(c){ return c !== tipo; }).join(', ') + ')' : '') + ' | preenchidos: ' + filled];
    if(semCampo.length) linhas.push('Sem campo na pagina: ' + semCampo.join(', '));
    if(semOpcao.length) linhas.push('Opcao nao encontrada: ' + semOpcao.join(', '));
    if(recusados.length) linhas.push('Nao preenchido (campo recusou o valor): ' + recusados.join(', '));
    if(avisos.length) linhas.push(avisos.join('; '));
    notas.forEach(function(n){ linhas.push(n); });
    showSummary(linhas);
    updateStatus();

    btnC.style.background = '#1a6b3c';
    btnC.textContent = 'CARIMBADO!';
    setTimeout(function(){ btnC.style.background = '#0f3460'; btnC.textContent = 'CARIMBAR'; }, 1500);
  }
  btnC.onclick = function(){ return carimbar(); };

  /* INSERIR TEXTO: o texto antigo so e substituido quando o usuario confirma um texto novo */
  btnL.onclick = async function(){
    var r = await askText('Cole o texto/JSON do novo paciente:');
    if(r){
      guardarTexto(r);
      updateStatus();
      btnL.style.background = '#1a6b3c';
      btnL.textContent = 'SALVO!';
      setTimeout(function(){ btnL.style.background = '#0f3460'; btnL.textContent = 'INSERIR TEXTO'; }, 1500);
    } else {
      updateStatus();
    }
  };

  /* EXTRAIR: remove cdk-describedby, scripts e a propria barra num clone do body (sem regex) */
  function htmlDe(raiz){
    if(!raiz) return '';
    var clone = raiz.cloneNode(true);
    /* 1.3: o clone nao leva o que foi digitado (propriedades); grava os valores atuais no HTML antes de copiar */
    var SELV = 'input,textarea,select';
    var orig = raiz.querySelectorAll(SELV), copia = clone.querySelectorAll(SELV);
    for(var vi = 0; vi < orig.length && vi < copia.length; vi++){
      var o = orig[vi], c = copia[vi], ty = (o.type || '').toLowerCase();
      try{
        if(o.tagName === 'TEXTAREA') c.textContent = o.value;
        else if(o.tagName === 'SELECT'){
          for(var oi = 0; oi < o.options.length && oi < c.options.length; oi++){ if(o.options[oi].selected) c.options[oi].setAttribute('selected', ''); else c.options[oi].removeAttribute('selected'); }
        }
        else if(ty === 'password'){ c.removeAttribute('value'); }
        else if(ty === 'checkbox' || ty === 'radio'){ if(o.checked) c.setAttribute('checked', ''); else c.removeAttribute('checked'); }
        else if(ty !== 'file') c.setAttribute('value', o.value);
      }catch(e){}
    }
    [].slice.call(clone.querySelectorAll('.cdk-describedby-message-container, script, #' + BAR_ID + ', #' + BAR_ANTIGA)).forEach(function(n){ n.remove(); });
    [].slice.call(clone.querySelectorAll('[data-carimbar-destaque]')).forEach(function(n){ n.removeAttribute('data-carimbar-destaque'); n.style.outline = ''; n.style.outlineOffset = ''; if(!n.getAttribute('style')) n.removeAttribute('style'); });
    return clone.innerHTML;
  }
  btnE.onclick = function(){
    /* 1.4: o documento principal e, em seguida, cada quadro e cada shadow DOM aberto */
    var qd = quadros(), html = htmlDe(document.body);
    qd.docs.forEach(function(q){
      q.raizes.forEach(function(r, ri){
        if(ri === 0 && q.doc === document) return;
        var corpo = ri === 0 ? (q.doc.body || q.doc.documentElement) : r;
        var onde = (q.caminho || 'principal') + (ri > 0 ? ' | shadow ' + tag(r.host).toLowerCase() : '');
        html += '\n<!-- CARIMBAR quadro: ' + onde.replace(/--/g, '- -') + ' -->\n<div data-carimbar-quadro="' + esc(onde).replace(/"/g, '&quot;') + '"' + (ri === 0 && q.doc.location ? ' data-url="' + esc(q.doc.location.href).replace(/"/g, '&quot;') + '"' : '') + '>' + htmlDe(corpo) + '</div>';
      });
    });
    if(qd.ignorados) html += '\n<!-- CARIMBAR: ' + qd.ignorados + ' quadro(s) de outro site nao puderam ser lidos -->';
    var d = getExtracted();
    d.push({url: location.href, time: new Date().toLocaleString(), html: html});
    try{
      setExtracted(d);
    }catch(e){
      d.pop();
      alert('Nao foi possivel salvar: espaco de armazenamento local cheio. Toque em COPIAR agora para salvar o que ja foi extraido, depois em LIMPAR antes de continuar extraindo mais paginas.');
      updateStatus();
      return;
    }
    updateStatus();
    btnE.style.background = '#1a6b3c';
    btnE.textContent = 'EXTRAIDO!';
    setTimeout(function(){ btnE.style.background = '#0f3460'; btnE.textContent = 'EXTRAIR'; }, 1200);
  };

  /* COPIAR: so anuncia sucesso depois que a copia realmente deu certo */
  btnCopy.onclick = async function(){
    var d = getExtracted();
    if(!d.length){ alert('Nada extraido para copiar.'); return; }
    var text = d.map(function(item){ return '===== PAGINA: '+item.url+' | '+item.time+' =====\n'+item.html; }).join('\n\n');
    var ok = false;
    var tmp = UI.createElement('textarea');
    tmp.value = text;
    tmp.setAttribute('readonly', '');
    tmp.style.position = 'fixed';
    tmp.style.left = '-9999px';
    UI.body.appendChild(tmp);
    try{ tmp.focus(); tmp.select(); ok = UI.execCommand('copy') === true; }catch(e){ ok = false; }
    UI.body.removeChild(tmp);
    if(!ok && navigator.clipboard && navigator.clipboard.writeText){
      try{ await navigator.clipboard.writeText(text); ok = true; }catch(e){ ok = false; }
    }
    if(ok){
      alert('Copiado: ' + d.length + ' pagina(s).');
    } else {
      alert('Nao foi possivel copiar para a area de transferencia. Vou abrir o texto para voce copiar manualmente.');
      showManualCopy(text);
    }
  };

  btnCampos.onclick = function(){
    cacheQ = null;
    var qd = quadros(), lista = camposGenericos().filter(function(el){ return !isHidden(el); }), porQ = {};
    lista.forEach(function(el){ destacar(el, '#5dade2', 'campo'); var q = caminhoDe(el) || 'principal'; (porQ[q] = porQ[q] || []).push(chaveDe(el) || '?'); });
    var linhas = ['Campos visiveis: ' + lista.length + ' | quadros lidos: ' + (qd.docs.length - 1) + (qd.ignorados ? ' | de outro site (nao da para ler): ' + qd.ignorados : '')];
    Object.keys(porQ).forEach(function(q){ linhas.push(q + ': ' + corta(porQ[q].join(', '), 400)); });
    if(!lista.length) linhas.push('Nenhum campo visivel. Se o formulario estiver num quadro de outro site, abra esse quadro sozinho numa aba.');
    showSummary(linhas);
    atualizarInfo();
  };

  btnClear.onclick = function(){
    if(confirm('Limpar tudo que foi extraido?')){
      setExtracted([]);
      updateStatus();
    }
  };

  /* ---------- 1.1: nuvem pela janela-ponte ----------
     O favorito so conversa com a janela-ponte por postMessage (origem conferida nos dois sentidos).
     Quem acessa a nuvem e a ponte, que roda no dominio proprio do CARIMBAR. */
  var PONTE_PADRAO = 'https://drthaleschateaubriand.github.io/carimbo/ponte.html';
  var PONTE_URL = PONTE_PADRAO;
  try{
    var pTeste = window.CARIMBAR_PONTE_URL; /* so para testes locais */
    if(typeof pTeste === 'string' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(pTeste)) PONTE_URL = pTeste;
  }catch(e){}
  var PONTE_ORIGEM = new URL(PONTE_URL).origin;
  var ponte = null, ponteOk = false, pendente = null, aplicando = false, filaIA = [];

  function setIA(txt){ iaLabel.textContent = txt ? ('IA: ' + txt) : ''; }

  function corta(s, n){ s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) + '...' : s; }
  function limpaTxt(s){ return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function rotuloDe(el){
    var t = '', i;
    if(el.id){
      var rz = el.getRootNode ? el.getRootNode() : el.ownerDocument;
      var labs = rz && rz.querySelectorAll ? rz.querySelectorAll('label') : [];
      for(i = 0; i < labs.length; i++) if(labs[i].htmlFor === el.id){ t = labs[i].textContent; break; }
    }
    if(!limpaTxt(t) && el.closest){
      var ff = el.closest('mat-form-field,.mat-form-field,.mat-mdc-form-field');
      if(ff){ var ml = ff.querySelector('mat-label,label'); if(ml) t = ml.textContent; }
    }
    if(!limpaTxt(t)) t = el.getAttribute('aria-label') || el.getAttribute('data-placeholder') || el.getAttribute('placeholder') || '';
    if(!limpaTxt(t) && el.closest){ var pl = el.closest('label'); if(pl) t = pl.textContent; }
    /* 1.4: telas em tabela ou ExtJS/GWT: rotulo do item do formulario ou a celula anterior */
    if(!limpaTxt(t) && el.closest){
      var fi = el.closest('.x-form-item,.x-field,.form-group,.gwt-Label');
      var fl = fi && fi.querySelector('label,.x-form-item-label');
      if(fl && !fl.contains(el)) t = fl.textContent;
    }
    if(!limpaTxt(t) && el.closest){
      var td = el.closest('td'), ant = td && td.previousElementSibling;
      if(ant && !ant.querySelector('input,textarea,select') && limpaTxt(ant.textContent).length <= 60) t = ant.textContent;
    }
    if(!limpaTxt(t) && tag(el) === 'BODY'){ var fe = null; try{ fe = el.ownerDocument.defaultView.frameElement; }catch(e){} if(fe) t = fe.getAttribute('title') || fe.getAttribute('aria-label') || ''; }
    return corta(limpaTxt(t).replace(/\s*\*$/, ''), 120);
  }
  function opcoesMatSelect(g){
    var pid = g.getAttribute('aria-controls') || g.getAttribute('aria-owns');
    var painel = pid ? g.ownerDocument.getElementById(pid) : null;
    if(!painel) return null;
    return [].slice.call(painel.querySelectorAll('mat-option')).slice(0, 80).map(function(o){ return corta(limpaTxt(o.textContent), 80); });
  }
  /* resumo compacto dos campos da pagina (nao e o HTML): nome, rotulo, tipo, valor atual, opcoes */
  function resumoPagina(){
    var tipos = detectTipos();
    var campos = [], editores = [];
    var SEL_CAMPOS = 'input,textarea,select,mat-select,mat-checkbox,mat-radio-group';
    var els = QA(SEL_CAMPOS), gen = !tipos.length;
    for(var i = 0; i < els.length && campos.length < 400; i++){
      var el = els[i], tag = el.tagName.toLowerCase();
      if(bar.contains(el)) continue;
      if(el.closest && el.closest('.ck-editor,mat-option')) continue;
      var type = (el.getAttribute('type') || '').toLowerCase();
      if(tag === 'input' && ['hidden','submit','button','image','reset','file'].indexOf(type) > -1) continue;
      if(tag === 'input' && el.closest && el.closest('mat-checkbox,mat-select,mat-radio-group')) continue;
      var c = {};
      var nome = el.getAttribute('name'), fcn = el.getAttribute('formcontrolname');
      if(nome) c.name = nome;
      if(fcn && fcn !== nome) c.formcontrolname = fcn;
      if(el.id && !/^(mat-|cdk-)/.test(el.id)) c.id = el.id;
      c.campo = tag === 'input' ? (type || 'text') : tag;
      var rot = rotuloDe(el); if(rot) c.rotulo = rot;
      if(tag === 'input' && (type === 'checkbox' || type === 'radio')){ c.marcado = !!el.checked; if(type === 'radio' && el.value) c.valor = corta(el.value, 80); }
      else if(tag === 'mat-checkbox'){
        var ci = el.querySelector('input[type="checkbox"]');
        c.marcado = ci ? !!ci.checked : (el.classList.contains('mat-checkbox-checked') || el.classList.contains('mat-mdc-checkbox-checked'));
      }
      else if(tag === 'select'){
        c.opcoes = [].slice.call(el.options).slice(0, 80).map(function(o){ return corta(limpaTxt(o.textContent), 80); });
        if(el.selectedIndex > -1 && el.value !== '') c.valor = corta(limpaTxt(el.options[el.selectedIndex].textContent), 200);
      }
      else if(tag === 'mat-select'){
        var vt = el.querySelector('.mat-select-value-text,.mat-mdc-select-value-text');
        if(vt && limpaTxt(vt.textContent)) c.valor = corta(limpaTxt(vt.textContent), 200);
        var op = opcoesMatSelect(el); if(op && op.length) c.opcoes = op;
      }
      else if(tag === 'mat-radio-group'){
        c.opcoes = [].slice.call(el.querySelectorAll('mat-radio-button')).slice(0, 40).map(function(o){ return corta(limpaTxt(o.textContent), 80); });
      }
      else if(type === 'password'){ /* nunca envia senha */ }
      else if(el.value !== undefined && String(el.value) !== '') c.valor = corta(el.value, 500);
      if(el.required || el.getAttribute('aria-required') === 'true') c.obrigatorio = true;
      if(isHidden(el)) c.oculto = true;
      if(!c.name && !c.formcontrolname && !c.id && !c.rotulo) continue;
      var cq = caminhoDe(el); if(cq) c.quadro = cq;
      if(gen) c.chave = chaveDe(el);
      campos.push(c);
    }
    QA('.ck-editor__editable').forEach(function(ed, k){
      if(bar.contains(ed)) return;
      var e = {editor: k + 1};
      var w = ed.closest ? ed.closest('ckeditor') : null;
      if(w && w.getAttribute('name')) e.name = w.getAttribute('name');
      var ctx = ed.closest ? ed.closest('[id]') : null;
      if(ctx && ctx.id && !/^(mat-|cdk-)/.test(ctx.id)) e.dentroDe = ctx.id;
      var tx = limpaTxt(ed.textContent); if(tx) e.texto = corta(tx, 1000);
      if(isHidden(ed)) e.oculto = true;
      if(!ed.ckeditorInstance) e.semInstancia = true;
      var eq = caminhoDe(ed); if(eq) e.quadro = eq;
      editores.push(e);
    });
    /* 1.4: outros editores de texto (contenteditable e editores dentro de iframe) */
    editaveis().forEach(function(ed){
      if(ed.classList && ed.classList.contains('ck-editor__editable')) return;
      var e = {editor: editores.length + 1, rico: true};
      var ch = chaveDe(ed); if(ch) e.chave = ch;
      var rt = rotuloDe(ed); if(rt) e.rotulo = rt;
      var eq = caminhoDe(ed); if(eq) e.quadro = eq;
      var tx = limpaTxt(ed.textContent); if(tx) e.texto = corta(tx, 1000);
      if(isHidden(ed)) e.oculto = true;
      editores.push(e);
    });
    var qd = quadros();
    if(gen && (campos.length || editores.length)) tipos = ['generico'];
    var chaves = {};
    tipos.forEach(function(tp){ chaves[tp] = TIPO_KEYS[tp]; });
    if(tipos.indexOf('prescricao') > -1) chaves.prescricao = ['prescricao','especial'];
    if(gen && tipos.length){
      var lc = [];
      campos.concat(editores).forEach(function(x){ if(x.chave && lc.indexOf(x.chave) < 0 && lc.length < 200) lc.push(x.chave); });
      chaves.generico = lc.concat(['evolucao','texto']);
    }
    var res = {
      carimbar: VERSAO,
      url: location.href,
      titulo: corta(document.title, 200),
      tiposDetectados: tipos,
      chavesCarimbar: chaves,
      formato: 'Responder com JSON plano usando as chavesCarimbar do tipo detectado; datas DD/MM/AAAA; listas com o texto exato da opcao; texto livre com \\n entre linhas.' + (gen ? ' Tipo generico: use a "chave" de cada campo (ou o rotulo) como chave do JSON, ou {"campos": {"chave ou rotulo": "valor"}}; o texto livre vai em "evolucao" (cai na caixa de texto clicada ou na unica da tela).' : ''),
      pacienteNaTela: (function(){ var p = detectPaciente(); return p && (p.nome || p.prontuario) ? p : null; })(),
      campos: campos,
      editores: editores
    };
    if(qd.docs.length > 1 || qd.ignorados) res.quadros = {lidos: qd.docs.length - 1, ignorados: qd.ignorados};
    return res;
  }

  function abrirPonte(){
    ponteOk = false;
    ponte = window.open(PONTE_URL, 'carimbarPonte', 'width=430,height=600');
    if(!ponte){
      setIA('janela bloqueada');
      alert('O navegador bloqueou a janela do CARIMBAR. Permita janelas pop-up para este site e clique ENVIAR P/ IA de novo.');
      return false;
    }
    setIA('conectando...');
    return true;
  }
  function enviarPendente(){
    if(!pendente || !ponte || !ponteOk) return;
    try{
      ponte.postMessage({carimbar: 'extracao', conteudo: pendente, url: location.href, pagina: (pendente.tiposDetectados || []).join(',') || 'desconhecida'}, PONTE_ORIGEM);
      pendente = null;
      setIA('enviando...');
    }catch(e){ setIA('erro ao enviar'); }
  }
  btnIA.onclick = function(){
    pendente = resumoPagina();
    if(!ponte || ponte.closed){ if(!abrirPonte()) return; }
    else if(ponteOk) enviarPendente();
    else setIA('conectando...');
    btnIA.style.background = '#1a4b6b';
    btnIA.textContent = 'ENVIADO P/ IA';
    setTimeout(function(){ btnIA.style.background = '#0f3460'; btnIA.textContent = 'ENVIAR P/ IA'; }, 1500);
  };

  async function aplicarCarimbo(m){
    var j = m.json;
    if(typeof j === 'string'){ try{ j = JSON.parse(j); }catch(e){ j = null; } }
    if(!j || typeof j !== 'object' || Array.isArray(j)){
      showSummary(['Recebido da IA, mas o conteudo nao e um JSON valido.']);
      return 'JSON invalido';
    }
    setIA('carimbando...');
    var item = null;
    if(pacienteDe(j)) item = enfileirar(j);
    else sessionStorage.setItem(CHAVE, JSON.stringify(j));
    updateStatus();
    if(!item) summaryRow.style.display = 'none';
    await carimbar(item ? {somente: item} : {solto: true});
    var r = summaryRow.style.display === 'none' ? '' : (summaryRow.firstChild ? summaryRow.firstChild.textContent : '');
    if(summaryRow.firstChild) summaryRow.firstChild.textContent = 'Recebido da IA\n' + r;
    var av = summaryRow.getAttribute('data-aviso');
    setIA(av === 'paciente-diferente' ? 'outro paciente, nada preenchido' : av === 'sem-paciente' ? 'aguardando sua escolha' : 'carimbo aplicado');
    return r;
  }
  async function processarFila(){
    if(aplicando) return;
    aplicando = true;
    try{
      while(filaIA.length){
        var m = filaIA.shift(), r = '';
        try{ r = await aplicarCarimbo(m); }catch(e){ r = 'erro: ' + e.message; }
        try{ if(ponte && !ponte.closed) ponte.postMessage({carimbar: 'carimbado', id: m.id, resumo: corta(r, 2000)}, PONTE_ORIGEM); }catch(e){}
      }
    } finally { aplicando = false; }
  }
  on(window, 'message', function(ev){
    if(!ponte || ev.source !== ponte || ev.origin !== PONTE_ORIGEM) return;
    var m = ev.data;
    if(!m || typeof m !== 'object' || typeof m.carimbar !== 'string') return;
    if(m.carimbar === 'pronta'){
      ponte.postMessage({carimbar: 'ola', versao: VERSAO}, PONTE_ORIGEM);
    } else if(m.carimbar === 'conectado'){
      ponteOk = true;
      setIA('conectada');
      enviarPendente();
    } else if(m.carimbar === 'enviado'){
      setIA('aguardando a IA');
    } else if(m.carimbar === 'erro'){
      setIA('erro');
      showSummary(['Nuvem: ' + corta(m.mensagem || 'erro', 300)]);
    } else if(m.carimbar === 'carimbo'){
      filaIA.push(m);
      processarFila();
    }
  });

  /* ---------- 1.5: MODO TECLADO (telas montadas em plugin, ex.: Flash no MV) ----------
     Quando a tela e desenhada dentro de um plugin, os campos nao existem no documento e
     nenhum script consegue preencher. Este modo entrega o conteudo campo por campo na
     area de transferencia: no prontuario basta clicar no campo, Ctrl+V e Tab. */
  var btnTeclado = makeBtn('TECLADO', '#e59866');
  btnTeclado.title = 'Telas em plugin (Flash): entrega o JSON campo por campo na area de transferencia para Ctrl+V e Tab';
  advRow.appendChild(btnTeclado);

  function achatarJSON(obj, pre, out){
    Object.keys(obj).forEach(function(k){
      var v = obj[k];
      var nome = pre ? pre + ' / ' + k : k;
      if(v && typeof v === 'object' && !Array.isArray(v)) achatarJSON(v, nome, out);
      else if(Array.isArray(v)) out.push({ k: nome, v: v.map(function(x){ return (x && typeof x === 'object') ? Object.keys(x).map(function(kk){ return x[kk]; }).join(' ') : String(x); }).join('\n') });
      else out.push({ k: nome, v: (v == null) ? '' : String(v) });
    });
    return out;
  }

  function abrirTeclado(itens, quem){
    var w = window.open('', 'carimbarTeclado', 'width=430,height=680,left=8,top=8');
    if(!w){ alert('Libere as janelas pop-up neste site e clique em TECLADO de novo.'); return null; }
    var d = w.document;
    d.open();
    d.write('<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>CARIMBAR teclado</title></head><body></body></html>');
    d.close();
    var st = d.createElement('style');
    st.textContent = 'body{margin:0;padding:10px;background:#1a1a2e;color:#eaeaea;font:14px -apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif}'
      + 'h1{font-size:14px;margin:0 0 2px;color:#e59866;letter-spacing:1px}'
      + '#quem{font-size:12px;color:#8a97a8;margin:0 0 8px}'
      + 'button{font:14px inherit;padding:8px 10px;margin:4px 4px 0 0;border-radius:6px;border:2px solid #0f3460;background:#0f3460;color:#eaeaea;cursor:pointer;font-weight:bold}'
      + 'button.p{border-color:#2ecc71;color:#2ecc71}'
      + '#info{margin:10px 0 6px;color:#8a97a8;font-size:12.5px}'
      + '.it{padding:7px 8px;border:1px solid #2b3550;border-radius:6px;margin-bottom:5px;cursor:pointer;word-break:break-word;white-space:pre-wrap}'
      + '.it.at{background:#14361f;border-color:#2ecc71}'
      + '.it.ok{opacity:.45}'
      + '.k{color:#5dade2;font-size:11px;text-transform:uppercase;letter-spacing:.5px}';
    d.head.appendChild(st);
    var h = d.createElement('h1'); h.textContent = 'CARIMBAR  MODO TECLADO';
    var sub = d.createElement('div'); sub.id = 'quem'; sub.textContent = 'Paciente: ' + quem + '  |  clique no campo do prontuario, Ctrl+V, Tab';
    var barW = d.createElement('div');
    var bProx = d.createElement('button'); bProx.className = 'p'; bProx.textContent = 'COPIAR E AVANCAR';
    var bMesmo = d.createElement('button'); bMesmo.textContent = 'COPIAR ATUAL';
    var bVolta = d.createElement('button'); bVolta.textContent = 'VOLTAR';
    var bTudo = d.createElement('button'); bTudo.textContent = 'JUNTAR TUDO';
    var info = d.createElement('div'); info.id = 'info';
    var lista = d.createElement('div');
    [bProx, bMesmo, bVolta, bTudo].forEach(function(b){ barW.appendChild(b); });
    [h, sub, barW, info, lista].forEach(function(e){ d.body.appendChild(e); });

    var idx = 0;

    function copiarW(txt){
      var x = d.createElement('textarea');
      x.value = txt;
      x.setAttribute('readonly', '');
      x.style.position = 'fixed';
      x.style.left = '-9999px';
      d.body.appendChild(x);
      var ok = false;
      try{ x.focus(); x.select(); ok = d.execCommand('copy') === true; }catch(e){ ok = false; }
      d.body.removeChild(x);
      if(!ok && w.navigator.clipboard && w.navigator.clipboard.writeText){
        try{ w.navigator.clipboard.writeText(txt); ok = true; }catch(e){ ok = false; }
      }
      return ok;
    }

    function escW(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

    function render(msg){
      lista.innerHTML = '';
      itens.forEach(function(it, i){
        var e = d.createElement('div');
        e.className = 'it' + (i === idx ? ' at' : '') + (i < idx ? ' ok' : '');
        e.innerHTML = '<div class="k">' + escW(it.k) + '</div>' + escW(it.v);
        e.onclick = function(){ idx = i; render(copiarW(it.v) ? null : 'falhou a copia, selecione o texto a mao'); };
        lista.appendChild(e);
      });
      info.textContent = msg || ('Campo ' + (idx + 1) + ' de ' + itens.length + ' na area de transferencia');
    }

    bProx.onclick = function(){ if(idx < itens.length - 1) idx++; render(copiarW(itens[idx].v) ? null : 'falhou a copia'); };
    bMesmo.onclick = function(){ render(copiarW(itens[idx].v) ? null : 'falhou a copia'); };
    bVolta.onclick = function(){ if(idx > 0) idx--; render(copiarW(itens[idx].v) ? null : 'falhou a copia'); };
    bTudo.onclick = function(){ var t = itens.map(function(it){ return it.k + ': ' + it.v; }).join('\n'); render(copiarW(t) ? 'bloco completo na area de transferencia' : 'falhou a copia'); };
    d.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === 'ArrowRight') bProx.onclick();
      else if(e.key === 'ArrowLeft') bVolta.onclick();
    });
    render(copiarW(itens[0].v) ? null : 'abra e clique em COPIAR ATUAL');
    try{ w.focus(); }catch(e){}
    return w;
  }

  btnTeclado.onclick = async function(){
    var saved = sessionStorage.getItem(CHAVE);
    var objs = saved ? objetosDoTexto(saved) : [];
    if(!objs.length){
      var r = await askText('Cole o texto/JSON do paciente para o modo teclado:');
      if(!r) return;
      guardarTexto(r);
      updateStatus();
      saved = sessionStorage.getItem(CHAVE);
      objs = saved ? objetosDoTexto(saved) : [];
      if(!objs.length){ alert('JSON invalido'); return; }
    }
    var o = objs[objs.length - 1];
    var itens = achatarJSON(o, '', []).filter(function(it){ return String(it.v).trim() !== ''; });
    if(!itens.length){ alert('Nenhum campo com conteudo no JSON'); return; }
    abrirTeclado(itens, pacienteDe(o) || 'nao informado');
    showSummary(['Modo teclado aberto com ' + itens.length + ' campo(s). Esta tela nao e preenchida por script.']);
  };

  UI.body.appendChild(bar);
  updateStatus();
})();

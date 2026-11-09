/* CARIMBAR Grok 1.3 - leitura do(s) JSON(s) vindo do chat (colado, em bloco ``` ou com texto em volta, ou em link #j= / #t=).
   Sem rede e sem DOM: usado por enviar.js no navegador e pelos testes no Node. */
(function(raiz, fabrica){
  var api = fabrica();
  if(typeof module === 'object' && module.exports) module.exports = api;
  else raiz.CarimbarEnviar = api;
})(typeof self !== 'undefined' ? self : this, function(){
  'use strict';
  var TELAS = [
    {id: 'cadastro', nome: 'Cadastro', chaves: [
      ['nome','Nome'],['cpf','CPF'],['cns','CNS'],['nasc','Nascimento'],['nacionalidade','Nacionalidade'],['mae','Mãe'],['pai','Pai'],
      ['email','E-mail'],['cel','Celular'],['tel','Telefone'],['sexo','Sexo'],['sangue','Tipo sanguíneo'],['etnia','Etnia'],
      ['identidadeGenero','Identidade de gênero'],['menorDeIdade','Menor de idade'],['anotacoes','Anotações (admissão)']]},
    {id: 'prescricao', nome: 'Prescrição', chaves: [['prescricao','Prescrição'],['especial','Controle especial']]},
    {id: 'exames', nome: 'Exames', chaves: [['exames','Exames solicitados']]},
    {id: 'evolucao', nome: 'Evolução', chaves: [['evolucao','Evolução']]},
    {id: 'antropometria', nome: 'Antropometria', chaves: [
      ['data','Data da avaliação'],['altura','Altura (cm)'],['peso','Peso (kg)'],['gordura','Gordura (%)'],['massaGorda','Massa gorda (kg)'],
      ['massaMuscular','Massa muscular (kg)'],['massaMagra','Massa magra (kg)'],['gorduraVisceral','Gordura visceral'],['tmb','TMB (kcal)'],
      ['peitoral','Dobra peitoral'],['axilarMedia','Dobra axilar média'],['triceps','Dobra tríceps'],['subescapular','Dobra subescapular'],
      ['abdominal','Dobra abdominal'],['suprailiac','Dobra suprailíaca'],['coxa','Dobra coxa'],['biceps','Dobra bíceps'],['panturrilha','Dobra panturrilha'],
      ['cPescoco','Circ. pescoço'],['cBraco','Circ. braço'],['cCintura','Circ. cintura'],['cAbdomen','Circ. abdômen'],['cQuadril','Circ. quadril'],
      ['cCoxa','Circ. coxa'],['cPanturrilha','Circ. panturrilha'],['obs','Observações']]}
  ];
  var CONHECIDAS = {};
  TELAS.forEach(function(t){ t.chaves.forEach(function(c){ CONHECIDAS[c[0]] = t.id; }); });
  CONHECIDAS.texto = 'geral';
  CONHECIDAS.paciente = 'paciente';
  CONHECIDAS.prontuario = 'paciente';
  CONHECIDAS.campos = 'campos'; /* 1.4: {"campos": {"nome ou rotulo do campo": valor}} para telas de outros sistemas (ex.: MV) */

  function ehObjeto(v){ return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function tentar(s){ try{ var v = JSON.parse(s); return ehObjeto(v) ? v : null; }catch(e){ return null; } }
  /* aspas tipograficas que alguns teclados/apps colocam */
  function normalizaAspas(s){ return s.replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"'); }
  /* primeiro objeto JSON de nivel mais alto dentro de um texto qualquer (respeita strings e escapes) */
  function primeiroObjeto(s){
    for(var ini = s.indexOf('{'); ini > -1; ini = s.indexOf('{', ini + 1)){
      var prof = 0, str = false, esc = false;
      for(var i = ini; i < s.length; i++){
        var c = s[i];
        if(str){ if(esc) esc = false; else if(c === '\\') esc = true; else if(c === '"') str = false; continue; }
        if(c === '"') str = true;
        else if(c === '{') prof++;
        else if(c === '}'){ prof--; if(prof === 0){ var v = tentar(s.slice(ini, i + 1)); if(v) return v; break; } }
      }
    }
    return null;
  }
  /* todos os objetos JSON de nivel mais alto, em ordem (respeita strings e escapes) */
  function todosObjetos(s){
    var r = [], ini = s.indexOf('{');
    while(ini > -1){
      var prof = 0, str = false, esc = false, fim = -1;
      for(var i = ini; i < s.length; i++){
        var c = s[i];
        if(str){ if(esc) esc = false; else if(c === '\\') esc = true; else if(c === '"') str = false; continue; }
        if(c === '"') str = true;
        else if(c === '{') prof++;
        else if(c === '}'){ prof--; if(prof === 0){ fim = i; break; } }
      }
      var v = fim > -1 ? tentar(s.slice(ini, fim + 1)) : null;
      if(v){ r.push(v); ini = s.indexOf('{', fim + 1); } else ini = s.indexOf('{', ini + 1);
    }
    return r;
  }
  function base64urlParaTexto(b){
    b = String(b).replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
    while(b.length % 4) b += '=';
    var bin = (typeof atob === 'function') ? atob(b) : Buffer.from(b, 'base64').toString('binary');
    var bytes = new Uint8Array(bin.length);
    for(var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8', {fatal: true}).decode(bytes);
  }
  function textoParaBase64url(t){
    var bytes = new TextEncoder().encode(t), bin = '';
    for(var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    var b = (typeof btoa === 'function') ? btoa(bin) : Buffer.from(bin, 'binary').toString('base64');
    return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  /* le o fragmento (#parear=, #j=, #t=) */
  function lerHash(hash){
    var h = String(hash || '').replace(/^#/, '');
    var r = {};
    h.split('&').forEach(function(par){
      var k = par.indexOf('=');
      if(k < 1) return;
      var nome = par.slice(0, k), val = par.slice(k + 1);
      if(nome === 'parear' || nome === 'j' || nome === 't') r[nome] = val;
    });
    if(r.parear !== undefined){ try{ r.parear = decodeURIComponent(r.parear); }catch(e){} if(!/^[A-Za-z0-9_-]{32,128}$/.test(r.parear)){ r.erroParear = 'código de pareamento inválido'; delete r.parear; } }
    if(r.j !== undefined){ try{ r.texto = base64urlParaTexto(r.j); }catch(e){ r.erro = 'link #j= inválido (base64url)'; } }
    else if(r.t !== undefined){ try{ r.texto = decodeURIComponent(r.t); }catch(e){ r.erro = 'link #t= inválido'; } }
    return r;
  }
  /* aceita: JSON puro, bloco ```json```, texto com o JSON no meio, ou um link com #j= / #t= */
  function extrairJSON(texto){
    var s = String(texto == null ? '' : texto).replace(/^\uFEFF/, '').trim();
    if(!s) return {erro: 'Nada colado ainda.'};
    var m = s.match(/#(?:[^#\s]*&)?(j|t)=([^\s&#]+)/);
    if(m && !/^\s*\{/.test(s)){
      var h = lerHash('#' + m[1] + '=' + m[2]);
      if(h.erro) return {erro: h.erro};
      s = h.texto.trim();
    }
    var v = tentar(s);
    if(!v){
      var blocos = s.match(/```[a-zA-Z]*\s*[\s\S]*?```/g) || [];
      for(var i = 0; i < blocos.length && !v; i++) v = tentar(blocos[i].replace(/^```[a-zA-Z]*\s*/, '').replace(/```$/, '').trim()) || primeiroObjeto(blocos[i]);
    }
    if(!v) v = primeiroObjeto(s);
    if(!v) v = primeiroObjeto(normalizaAspas(s));
    if(!v) return {erro: 'Não encontrei um JSON válido no texto. Copie o bloco de código que o Grok mostrou (começa com { e termina com }).'};
    return {json: v};
  }
  /* varios pacientes: um bloco ```json``` por paciente, varios objetos soltos ou uma lista [ {...}, {...} ] */
  function extrairTodos(texto){
    var s = String(texto == null ? '' : texto).replace(/^\uFEFF/, '').trim();
    if(!s) return {erro: 'Nada colado ainda.'};
    var m = s.match(/#(?:[^#\s]*&)?(j|t)=([^\s&#]+)/);
    if(m && !/^\s*[\[{]/.test(s)){
      var h = lerHash('#' + m[1] + '=' + m[2]);
      if(h.erro) return {erro: h.erro};
      s = h.texto.trim();
    }
    var lista = [];
    try{ var v = JSON.parse(s); if(ehObjeto(v)) lista = [v]; else if(Array.isArray(v)) lista = v.filter(ehObjeto); }catch(e){}
    if(!lista.length){
      var blocos = s.match(/```[a-zA-Z]*\s*[\s\S]*?```/g) || [];
      blocos.forEach(function(b){
        var corpo = b.replace(/^```[a-zA-Z]*\s*/, '').replace(/```$/, '').trim(), x = null;
        try{ x = JSON.parse(corpo); }catch(e){ try{ x = JSON.parse(normalizaAspas(corpo)); }catch(e2){} }
        if(ehObjeto(x)) lista.push(x);
        else if(Array.isArray(x)) lista = lista.concat(x.filter(ehObjeto));
        else lista = lista.concat(todosObjetos(corpo).length ? todosObjetos(corpo) : todosObjetos(normalizaAspas(corpo)));
      });
    }
    if(!lista.length) lista = todosObjetos(s);
    if(!lista.length) lista = todosObjetos(normalizaAspas(s));
    if(!lista.length) return {erro: 'Não encontrei um JSON válido no texto. Copie o bloco de código que o Grok mostrou (começa com { e termina com }).'};
    var vistos = {};
    lista = lista.filter(function(o){ var k = JSON.stringify(o); if(vistos[k]) return false; vistos[k] = 1; return true; });
    return {jsons: lista};
  }
  function normalizaNome(n){ return String(n || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim(); }
  function nomePaciente(j){ return j && typeof j.paciente === 'string' && j.paciente.trim() ? j.paciente.trim() : (j && typeof j.paciente === 'number' ? String(j.paciente) : ''); }
  /* regras do lote: com mais de um JSON, todos precisam de "paciente"; paciente repetido e avisado (vale o ultimo) */
  function conferirLote(jsons){
    var erros = [], avisos = [], cont = {};
    if(jsons.length > 1){
      var sem = [];
      jsons.forEach(function(j, i){ if(!nomePaciente(j)) sem.push(i + 1); });
      if(sem.length) erros.push('Com mais de um JSON, cada um precisa de "paciente". Sem paciente: bloco ' + sem.join(', ') + '. Peça ao Grok para incluir o nome do paciente.');
    }
    jsons.forEach(function(j){ var n = normalizaNome(nomePaciente(j)); if(n) cont[n] = (cont[n] || 0) + 1; });
    var rep = Object.keys(cont).filter(function(k){ return cont[k] > 1; });
    if(rep.length) avisos.push('Paciente repetido: ' + rep.join(', ') + '. No computador vale o último enviado de cada um.');
    if(jsons.length === 1 && !nomePaciente(jsons[0])) avisos.push('JSON sem "paciente": o CARIMBAR vai preencher sem conferir o paciente da tela.');
    return {erros: erros, avisos: avisos};
  }
  /* organiza por tela, aponta chaves desconhecidas e valores que nao sao texto/numero/sim-nao */
  function analisar(json){
    var telas = TELAS.map(function(t){
      return {id: t.id, nome: t.nome, itens: t.chaves.filter(function(c){ return Object.prototype.hasOwnProperty.call(json, c[0]) && json[c[0]] !== '' && json[c[0]] !== null; })
        .map(function(c){ return {chave: c[0], rotulo: c[1], valor: json[c[0]]}; })};
    }).filter(function(t){ return t.itens.length; });
    var cp = ehObjeto(json.campos) ? json.campos : null;
    if(cp){
      var itens = Object.keys(cp).filter(function(k){ var v = cp[k]; return v !== '' && v !== null && typeof v !== 'object'; }).map(function(k){ return {chave: k, rotulo: k, valor: cp[k]}; });
      if(itens.length) telas.push({id: 'campos', nome: 'Campos do formulário (por nome ou rótulo)', itens: itens});
    }
    var desconhecidas = Object.keys(json).filter(function(k){ return !CONHECIDAS[k]; });
    var invalidas = Object.keys(json).filter(function(k){ var v = json[k]; return v !== null && typeof v === 'object' && !(k === 'campos' && ehObjeto(v)); });
    if(cp) Object.keys(cp).forEach(function(k){ var v = cp[k]; if(v !== null && typeof v === 'object') invalidas.push('campos.' + k); });
    var total = telas.reduce(function(a, t){ return a + t.itens.length; }, 0);
    return {telas: telas, desconhecidas: desconhecidas, invalidas: invalidas, total: total};
  }
  function valorLegivel(v){ return v === true ? 'sim' : v === false ? 'não' : String(v); }
  return {TELAS: TELAS, CONHECIDAS: CONHECIDAS, extrairJSON: extrairJSON, lerHash: lerHash, analisar: analisar,
    base64urlParaTexto: base64urlParaTexto, textoParaBase64url: textoParaBase64url, primeiroObjeto: primeiroObjeto, valorLegivel: valorLegivel,
    extrairTodos: extrairTodos, todosObjetos: todosObjetos, conferirLote: conferirLote, nomePaciente: nomePaciente, normalizaNome: normalizaNome};
});

/* CARIMBAR Grok 1.2 - leitura do JSON vindo do chat (colado, em bloco ``` ou com texto em volta, ou em link #j= / #t=).
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
  /* organiza por tela, aponta chaves desconhecidas e valores que nao sao texto/numero/sim-nao */
  function analisar(json){
    var telas = TELAS.map(function(t){
      return {id: t.id, nome: t.nome, itens: t.chaves.filter(function(c){ return Object.prototype.hasOwnProperty.call(json, c[0]) && json[c[0]] !== '' && json[c[0]] !== null; })
        .map(function(c){ return {chave: c[0], rotulo: c[1], valor: json[c[0]]}; })};
    }).filter(function(t){ return t.itens.length; });
    var desconhecidas = Object.keys(json).filter(function(k){ return !CONHECIDAS[k]; });
    var invalidas = Object.keys(json).filter(function(k){ var v = json[k]; return v !== null && typeof v === 'object'; });
    var total = telas.reduce(function(a, t){ return a + t.itens.length; }, 0);
    return {telas: telas, desconhecidas: desconhecidas, invalidas: invalidas, total: total};
  }
  function valorLegivel(v){ return v === true ? 'sim' : v === false ? 'não' : String(v); }
  return {TELAS: TELAS, CONHECIDAS: CONHECIDAS, extrairJSON: extrairJSON, lerHash: lerHash, analisar: analisar,
    base64urlParaTexto: base64urlParaTexto, textoParaBase64url: textoParaBase64url, primeiroObjeto: primeiroObjeto, valorLegivel: valorLegivel};
});

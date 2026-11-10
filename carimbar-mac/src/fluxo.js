'use strict';

const { VERSAO, ORIGEM, TELAS, ORDEM, FORMATO_IA } = require('./config');

function rotulo(nome) {
  const t = TELAS[nome];
  return t.titulo + (t.exemplo ? ` (${nome}, EXEMPLO)` : ` (${nome})`);
}

function descreveTela(nome) {
  const t = TELAS[nome];
  let s = 'Campos, na ordem do Tab: ' + t.chaves.map(c => c || '(pular)').join(' > ');
  if (t.exemplo) {
    s += '\n\nATENÇÃO: tela de EXEMPLO. A ordem do Tab ainda não foi conferida no hospital. Teste com paciente de teste e não salve.';
  }
  return s;
}

function valor(dados, chave) {
  if (!dados || !Object.prototype.hasOwnProperty.call(dados, chave) || dados[chave] == null) return '';
  return String(dados[chave]);
}

function normaliza(t, usarCrlf) {
  t = String(t).replace(/\r\n/g, '\n');
  return usarCrlf ? t.replace(/\n/g, '\r\n') : t;
}

function previa(v) {
  const s = String(v).replace(/\r/g, '').replace(/\n/g, ' ¶ ');
  return s.length > 90 ? s.slice(0, 90) + '...' : s;
}

function tituloBate(titulo, trecho) {
  if (!trecho) return false;
  return String(titulo || '').toLowerCase().includes(String(trecho).toLowerCase());
}

function montarConteudo({ tela, titulo, enviadoEm, plataforma }) {
  const t = TELAS[tela];
  if (!t) throw new Error('tela desconhecida: ' + tela);
  const nomes = t.chaves.filter(c => c !== '');
  const ordemTab = t.chaves.map(c => (c === '' ? '(pular)' : c));
  const chavesCarimbar = {};
  chavesCarimbar[tela] = nomes;
  return {
    carimbar: VERSAO,
    origem: ORIGEM,
    tela,
    telaExemplo: !!t.exemplo,
    titulo: String(titulo || '').slice(0, 200),
    enviadoEm,
    tiposDetectados: [tela],
    chavesCarimbar,
    ordemTab,
    formato: FORMATO_IA,
    pacienteNaTela: null,
    campos: [],
    editores: [],
    plataforma: plataforma || process.platform
  };
}

function montarCorpoEnvio({ codigo, conteudo, tela, imagens }) {
  return {
    p_codigo: codigo,
    p_conteudo: conteudo,
    p_url: 'carimbar-mv://' + tela,
    p_pagina: 'carimbar-mv:' + tela,
    p_imagens: imagens
  };
}

function deveAceitarResposta(dados, extId, tela) {
  if (!dados || typeof dados !== 'object') return { ok: false, motivo: 'json-invalido' };
  const ext = dados.extracao;
  if (ext == null || !/^\d+$/.test(String(ext)) || Number(ext) !== Number(extId)) {
    return { ok: false, motivo: 'extracao-diferente' };
  }
  if (dados.tela != null && String(dados.tela) !== '' && String(dados.tela) !== String(tela)) {
    return { ok: false, motivo: 'tela-diferente' };
  }
  return { ok: true };
}

/**
 * Percorre carimbos de carimbar_buscar. Cada id é visto uma vez.
 * Devolve { achou, dados, ignoradasDelta, vistos } — vistos é o mapa atualizado.
 */
function processaLinhas(linhas, { extId, tela, vistos }) {
  const visto = { ...(vistos || {}) };
  let ignoradasDelta = 0;
  const lista = Array.isArray(linhas) ? linhas : [];
  for (const lin of lista) {
    if (!lin || lin.id == null || lin.conteudo == null) continue;
    const id = Number(lin.id);
    if (!Number.isFinite(id) || id <= Number(extId) || visto[id]) continue;
    visto[id] = true;
    let dados = lin.conteudo;
    if (typeof dados === 'string') {
      try { dados = JSON.parse(dados); } catch { ignoradasDelta += 1; continue; }
    }
    if (typeof dados !== 'object' || dados == null) { ignoradasDelta += 1; continue; }
    const dec = deveAceitarResposta(dados, extId, tela);
    if (!dec.ok) { ignoradasDelta += 1; continue; }
    return { achou: true, dados, ignoradasDelta, vistos: visto };
  }
  return { achou: false, dados: null, ignoradasDelta, vistos: visto };
}

function resumoCampos(tela, dados) {
  const t = TELAS[tela];
  const linhas = [];
  let nCola = 0;
  t.chaves.forEach((chave, i) => {
    const idx = i + 1;
    if (chave === '') {
      linhas.push({ idx, chave: '(pular)', previa: 'só o Tab', caracteres: '', cola: false });
      return;
    }
    const v = valor(dados, chave);
    if (!String(v).trim()) {
      linhas.push({ idx, chave, previa: '(vazio: só o Tab, nada é colado)', caracteres: '0', cola: false });
      return;
    }
    nCola += 1;
    linhas.push({ idx, chave, previa: previa(v), caracteres: String(v.length), cola: true, texto: v });
  });
  const paciente = String(valor(dados, 'paciente')).trim();
  return {
    linhas,
    nCola,
    paciente,
    prontuario: String(valor(dados, 'prontuario')).trim(),
    podeColar: paciente !== '' && nCola > 0
  };
}

/** Sequência de ações de colagem (sem executar teclado). */
function planoColagem(tela, dados, substituir, usarCrlf) {
  const t = TELAS[tela];
  const passos = [];
  t.chaves.forEach((chave, i) => {
    if (i > 0) passos.push({ tipo: 'tab' });
    if (chave === '') return;
    const texto = valor(dados, chave);
    if (!String(texto).trim()) {
      passos.push({ tipo: 'pular', chave });
      return;
    }
    passos.push({
      tipo: 'colar',
      chave,
      texto: normaliza(texto, usarCrlf),
      substituir: !!substituir
    });
  });
  return passos;
}

function listasTelas() {
  return ORDEM.map(nome => ({
    nome,
    rotulo: rotulo(nome),
    descricao: descreveTela(nome),
    exemplo: TELAS[nome].exemplo,
    titulo: TELAS[nome].titulo
  }));
}

module.exports = {
  rotulo,
  descreveTela,
  valor,
  normaliza,
  previa,
  tituloBate,
  montarConteudo,
  montarCorpoEnvio,
  deveAceitarResposta,
  processaLinhas,
  resumoCampos,
  planoColagem,
  listasTelas
};

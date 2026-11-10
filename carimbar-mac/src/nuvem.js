'use strict';

const { SUPA_URL, SUPA_KEY } = require('./config');

async function http(rota, corpo, timeoutMs = 30000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/rpc/${rota}`, {
      method: 'POST',
      headers: {
        apikey: SUPA_KEY,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(corpo),
      signal: ctrl.signal
    });
    const texto = await r.text();
    return { status: r.status, texto };
  } finally {
    clearTimeout(t);
  }
}

async function enviarExtracao(corpo, timeoutMs = 60000) {
  const r = await http('carimbar_enviar_mv', corpo, timeoutMs);
  const t = String(r.texto || '').trim();
  if (r.status !== 200 || !/^\d+$/.test(t)) {
    throw new Error('a nuvem não aceitou o envio (HTTP ' + r.status + '): ' + t.slice(0, 300));
  }
  return Number(t);
}

async function buscar(codigo, desdeId, timeoutMs = 15000) {
  const r = await http('carimbar_buscar', { p_codigo: codigo, p_desde_id: desdeId }, timeoutMs);
  if (r.status !== 200) throw new Error('HTTP ' + r.status);
  let linhas;
  try { linhas = JSON.parse(r.texto); } catch {
    throw new Error('resposta da nuvem em formato inesperado');
  }
  if (!Array.isArray(linhas)) throw new Error('resposta da nuvem em formato inesperado');
  return linhas;
}

module.exports = { http, enviarExtracao, buscar };

'use strict';
const assert = require('node:assert/strict');
const fluxo = require('../src/fluxo');
const { TELAS, ORIGEM, VERSAO } = require('../src/config');

let falhas = 0;
function t(nome, fn) {
  try { fn(); console.log('ok  ', nome); }
  catch (e) { falhas++; console.error('FALHOU', nome, e.message); }
}

t('listasTelas tem as 6 telas na mesma ordem do AHK', () => {
  const L = fluxo.listasTelas();
  assert.deepEqual(L.map(x => x.nome), ['evolucao','prescricao','exames','admissao','alta','antropometria']);
  assert.equal(L[0].exemplo, false);
  assert.equal(L[1].exemplo, true);
  assert.match(L[1].rotulo, /EXEMPLO/);
  assert.ok(!/EXEMPLO/.test(L[0].rotulo));
});

t('tituloBate é "contém", sem diferença de maiúsculas', () => {
  assert.equal(fluxo.tituloBate('App SoulMV - paciente', 'SoulMV'), true);
  assert.equal(fluxo.tituloBate('app soulmv - x', 'SoulMV'), true);
  assert.equal(fluxo.tituloBate('Firefox', 'SoulMV'), false);
  assert.equal(fluxo.tituloBate('', 'SoulMV'), false);
});

t('normaliza CRLF e LF', () => {
  assert.equal(fluxo.normaliza('a\nb\r\nc', true), 'a\r\nb\r\nc');
  assert.equal(fluxo.normaliza('a\r\nb', false), 'a\nb');
});

t('montarConteudo: origem, chaves e pacienteNaTela iguais ao AHK', () => {
  const c = fluxo.montarConteudo({ tela: 'evolucao', titulo: 'X'.repeat(300), enviadoEm: '2026-11-10T12:00:00Z', plataforma: 'darwin' });
  assert.equal(c.carimbar, VERSAO);
  assert.equal(c.origem, ORIGEM);
  assert.equal(c.tela, 'evolucao');
  assert.equal(c.telaExemplo, false);
  assert.equal(c.titulo.length, 200);
  assert.equal(c.pacienteNaTela, null);
  assert.deepEqual(c.chavesCarimbar.evolucao, ['evolucao']);
  assert.deepEqual(c.ordemTab, ['evolucao']);
  assert.deepEqual(c.campos, []);
  const p = fluxo.montarConteudo({ tela: 'prescricao', titulo: 'T', enviadoEm: '2026-11-10T12:00:00Z' });
  assert.equal(p.telaExemplo, true);
  assert.deepEqual(p.chavesCarimbar.prescricao, ['prescricao', 'orientacoes']);
  const corpo = fluxo.montarCorpoEnvio({ codigo: 'a'.repeat(32), conteudo: c, tela: 'evolucao', imagens: [{ mime: 'image/jpeg', b64: 'aa' }] });
  assert.equal(corpo.p_url, 'carimbar-mv://evolucao');
  assert.equal(corpo.p_pagina, 'carimbar-mv:evolucao');
  assert.equal(corpo.p_imagens.length, 1);
});

t('deveAceitarResposta exige extracao igual e tela, se houver', () => {
  assert.equal(fluxo.deveAceitarResposta({ extracao: '10', paciente: 'José' }, 10, 'evolucao').ok, true);
  assert.equal(fluxo.deveAceitarResposta({ extracao: 10 }, 10, 'evolucao').ok, true);
  assert.equal(fluxo.deveAceitarResposta({ extracao: '11' }, 10, 'evolucao').ok, false);
  assert.equal(fluxo.deveAceitarResposta({ paciente: 'José' }, 10, 'evolucao').ok, false);
  assert.equal(fluxo.deveAceitarResposta({ extracao: '10', tela: 'prescricao' }, 10, 'evolucao').ok, false);
  assert.equal(fluxo.deveAceitarResposta({ extracao: '10', tela: 'evolucao' }, 10, 'evolucao').ok, true);
  assert.equal(fluxo.deveAceitarResposta({ extracao: '10', tela: '' }, 10, 'evolucao').ok, true);
});

t('processaLinhas ignora id menor/igual, id repetido, json ruim e extracao errada', () => {
  const base = { extId: 100, tela: 'evolucao', vistos: {} };
  let r = fluxo.processaLinhas([{ id: 90, conteudo: { extracao: 100, paciente: 'A' } }], base);
  assert.equal(r.achou, false);
  r = fluxo.processaLinhas([{ id: 101, conteudo: 'não-json' }], base);
  assert.equal(r.achou, false);
  assert.equal(r.ignoradasDelta, 1);
  r = fluxo.processaLinhas([{ id: 102, conteudo: { extracao: 99, paciente: 'A' } }], { ...base, vistos: r.vistos });
  assert.equal(r.achou, false);
  assert.equal(r.ignoradasDelta, 1);
  r = fluxo.processaLinhas([
    { id: 103, conteudo: { extracao: 100, tela: 'prescricao', paciente: 'A' } },
    { id: 104, conteudo: { extracao: 100, paciente: 'José Teste Fictício', evolucao: 'texto' } }
  ], { ...base, vistos: r.vistos });
  assert.equal(r.achou, true);
  assert.equal(r.dados.paciente, 'José Teste Fictício');
  assert.equal(r.ignoradasDelta, 1);
  // mesma 104 de novo não conta de novo
  const r2 = fluxo.processaLinhas([{ id: 104, conteudo: { extracao: 100, paciente: 'José Teste Fictício' } }], { ...base, vistos: r.vistos });
  assert.equal(r2.achou, false);
  assert.equal(r2.ignoradasDelta, 0);
});

t('resumoCampos: sem paciente ou sem valor desliga colar; pulados e vazios só Tab', () => {
  const a = fluxo.resumoCampos('evolucao', { extracao: 1, evolucao: 'oi' });
  assert.equal(a.podeColar, false);
  assert.equal(a.paciente, '');
  const b = fluxo.resumoCampos('evolucao', { paciente: '  José Teste Fictício  ', evolucao: 'EVOLUCAO FICTICIA' });
  assert.equal(b.podeColar, true);
  assert.equal(b.nCola, 1);
  assert.equal(b.paciente, 'José Teste Fictício');
  const c = fluxo.resumoCampos('prescricao', { paciente: 'Maria Teste Fictícia', prescricao: '', orientacoes: '' });
  assert.equal(c.podeColar, false);
  assert.equal(c.nCola, 0);
});

t('planoColagem: Tab entre campos, pular vazios, normalizar, substituir', () => {
  const p = fluxo.planoColagem('prescricao', { prescricao: 'dipirona ficticia\n8/8h', orientacoes: '' }, true, true);
  assert.equal(p[0].tipo, 'colar');
  assert.equal(p[0].substituir, true);
  assert.equal(p[0].texto, 'dipirona ficticia\r\n8/8h');
  assert.equal(p[1].tipo, 'tab');
  assert.equal(p[2].tipo, 'pular');
  assert.equal(p[2].chave, 'orientacoes');
});

t('previa troca quebra de linha e corta em 90', () => {
  assert.equal(fluxo.previa('a\nb'), 'a ¶ b');
  assert.equal(fluxo.previa('x'.repeat(100)).endsWith('...'), true);
  assert.equal(fluxo.previa('x'.repeat(100)).length, 93);
});

if (falhas) { console.error('\n' + falhas + ' teste(s) falharam'); process.exit(1); }
console.log('\nTodos os testes de fluxo passaram.');

'use strict';
/**
 * Teste de ponta a ponta da nuvem com dados fictícios.
 * Envia uma foto minúscula via carimbar_enviar_mv (chave pública) e consulta carimbar_buscar.
 * Se CARIMBAR_TEST_RESPONDER=1 e o ambiente tiver como chamar carimbar.responder_mv
 * (script opcional), também valida o aceite da resposta. Sem isso, o envio e a busca já
 * exercitam o mesmo caminho HTTP do programa.
 */
const assert = require('node:assert/strict');
const { execFileSync } = require('child_process');
const fluxo = require('../src/fluxo');
const nuvem = require('../src/nuvem');
const sessao = require('../src/sessao');
const { ORIGEM } = require('../src/config');

// JPEG 1x1 mínimo (bytes válidos)
const JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGf/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPwB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwB//9k=',
  'base64'
);
const B64 = JPEG.toString('base64');

async function main() {
  const codigo = sessao.novoCodigo();
  assert.match(codigo, /^[A-Za-z0-9_-]{32,128}$/);
  const conteudo = fluxo.montarConteudo({
    tela: 'evolucao',
    titulo: 'TesteCarimbar - SoulMV (dados ficticios)',
    enviadoEm: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    plataforma: 'linux-teste'
  });
  assert.equal(conteudo.origem, ORIGEM);
  const corpo = fluxo.montarCorpoEnvio({
    codigo,
    conteudo,
    tela: 'evolucao',
    imagens: [{ mime: 'image/jpeg', b64: B64 }]
  });
  console.log('enviando extração fictícia, sessão', codigo.slice(0, 8) + '…');
  const id = await nuvem.enviarExtracao(corpo, 60000);
  console.log('ok   carimbar_enviar_mv devolveu id', id);
  assert.ok(Number.isFinite(id) && id > 0);

  const linhas0 = await nuvem.buscar(codigo, id, 15000);
  assert.ok(Array.isArray(linhas0));
  const r0 = fluxo.processaLinhas(linhas0, { extId: id, tela: 'evolucao', vistos: {} });
  assert.equal(r0.achou, false, 'sem resposta ainda, não pode aceitar nada');
  console.log('ok   carimbar_buscar (ainda sem carimbo) e processaLinhas não aceitou nada');

  // Tenta responder pelo SQL se o wrapper existir no PATH (opcional).
  let respondeu = false;
  if (process.env.CARIMBAR_RESPONDER_CMD) {
    const json = JSON.stringify({
      paciente: 'José Teste Fictício',
      prontuario: '0000',
      evolucao: 'EVOLUCAO FICTICIA PARA TESTE\nPACIENTE ESTAVEL\nMANTER CONDUTA'
    });
    execFileSync('bash', ['-lc', process.env.CARIMBAR_RESPONDER_CMD], {
      input: JSON.stringify({ id, json }),
      encoding: 'utf8',
      timeout: 30000
    });
    respondeu = true;
  }

  if (respondeu) {
    const linhas = await nuvem.buscar(codigo, id, 15000);
    const r = fluxo.processaLinhas(linhas, { extId: id, tela: 'evolucao', vistos: {} });
    assert.equal(r.achou, true);
    assert.equal(r.dados.paciente, 'José Teste Fictício');
    assert.equal(Number(r.dados.extracao), id);
    const resumo = fluxo.resumoCampos('evolucao', r.dados);
    assert.equal(resumo.podeColar, true);
    console.log('ok   resposta fictícia aceita, paciente conferido no resumo, pode colar');
  } else {
    console.log('info não chamei carimbar.responder_mv (função restrita ao dono do banco neste ambiente).');
    console.log('     O envio e a busca com a chave pública passaram. Para o aceite da resposta, use o teste de processaLinhas (já coberto) ou defina CARIMBAR_RESPONDER_CMD.');
  }
}

main().then(() => {
  console.log('\nTeste de nuvem (dados fictícios) passou no que foi possível daqui.');
}).catch(e => {
  console.error('FALHOU teste de nuvem:', e);
  process.exit(1);
});

import { chromium } from 'playwright-core';
import fs from 'fs';
const B = 'http://127.0.0.1:8803/';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext(); await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:8803' });
const res = []; const ok = (c, m) => { if (!c) throw new Error(m); };
async function T(id, nome, fn) { try { res.push({ id, nome, status: 'passou', ev: await fn() }); } catch (e) { res.push({ id, nome, status: 'falhou', erro: String(e.message).slice(0, 800) }); } }
const fav = fs.readFileSync('/workspace/carimbo/carimbar-grok-1.4-favorito.txt', 'utf8');
await T('P-01', 'Página de instalação: aba SoulMV, copiar código com e sem javascript:, favorito igual ao arquivo', async () => {
  const p = await ctx.newPage(); await p.goto(B + 'index.html');
  const href = await p.getAttribute('#favorito', 'href'); ok(href === fav, 'href difere');
  ok(await p.textContent('.versao') .then(t => /Grok 1\.4/.test(t)), 'versao');
  await p.click('#tab-soulmv'); ok(await p.isVisible('#painel-soulmv') && !(await p.isVisible('#painel-chrome')), 'aba');
  await p.click('#copiarSoul'); await p.waitForTimeout(200); const c1 = await p.evaluate(() => navigator.clipboard.readText());
  await p.click('#copiarSemPrefixo'); await p.waitForTimeout(200); const c2 = await p.evaluate(() => navigator.clipboard.readText());
  ok(c1 === fav && c2 === fav.replace(/^javascript:/, '') && !c2.startsWith('javascript:'), 'copias');
  ok(decodeURIComponent(c2).length > 40000, 'codigo');
  await p.screenshot({ path: '/workspace/c14/p14-instalar-soulmv.png', fullPage: true });
  // o codigo colado "sem prefixo" roda como no console (decodificado)
  await p.close(); return { tamanho: fav.length };
});
await T('P-02', 'enviar.html: "campos" aceito, prévia por paciente com botão Copiar em cada texto e Copiar tudo', async () => {
  const p = await ctx.newPage(); await p.goto(B + 'enviar.html');
  const J = { paciente: 'José Teste Fictício', evolucao: 'Linha um\nLinha dois', campos: { 'PA': '120x80', 'Frequência cardíaca': '76' } };
  await p.fill('#texto', '```json\n' + JSON.stringify(J) + '\n```'); await p.dispatchEvent('#texto', 'input');
  const an = await p.textContent('#analise'); ok(/JSON válido: 3 campo/.test(an), an);
  const h3 = await p.$$eval('#previa h3', x => x.map(h => h.textContent)); ok(h3.join('|') === 'Evolução|Campos do formulário (por nome ou rótulo)', h3.join('|'));
  const bts = await p.$$eval('#previa button.copiar', x => x.map(b => b.textContent)); ok(bts.length === 4 && bts[0] === 'Copiar tudo deste paciente', bts.join());
  await p.click('#previa dl .copiar >> nth=0'); await p.waitForTimeout(200); const t1 = await p.evaluate(() => navigator.clipboard.readText());
  ok(t1 === 'Linha um\nLinha dois', JSON.stringify(t1));
  await p.click('#previa .copiar.tudo'); await p.waitForTimeout(200); const t2 = await p.evaluate(() => navigator.clipboard.readText());
  ok(t2 === 'Evolução: Linha um\nLinha dois\nPA: 120x80\nFrequência cardíaca: 76', JSON.stringify(t2));
  const env = await p.isDisabled('#enviar'); // nao pareado: copiar funciona mesmo assim
  await p.screenshot({ path: '/workspace/c14/p14-enviar-copiar.png', fullPage: true });
  await p.close(); return { analise: an, botoes: bts, enviarDesligadoSemPareamento: env };
});
await browser.close();
console.log(JSON.stringify({ passou: res.filter(r => r.status === 'passou').length, total: res.length, res }, null, 1));
fs.writeFileSync('/workspace/c14/resultados-e2e14-paginas.json', JSON.stringify(res, null, 1));

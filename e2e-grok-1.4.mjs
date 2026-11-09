import { chromium } from 'playwright-core';
import fs from 'fs';
const fav = fs.readFileSync(process.argv[2] || '/workspace/carimbo/carimbar-grok-1.4-favorito.txt', 'utf8');
const code = decodeURIComponent(fav.replace(/^javascript:/, ''));
const B = 'http://127.0.0.1:8801/';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext();
const res = [];
const dialogs = [];
async function T(id, nome, fn) { try { const ev = await fn(); res.push({ id, nome, status: 'passou', ev }); } catch (e) { res.push({ id, nome, status: 'falhou', erro: String(e.message || e).slice(0, 900) }); } }
function ok(c, msg) { if (!c) throw new Error(msg); }
async function abrir(page, p) { await page.goto(B + p); await page.waitForLoadState('load'); await page.waitForTimeout(150); }
async function injetar(page, ponte = true) { if (ponte) await page.evaluate(u => { window.CARIMBAR_PONTE_URL = u; }, B + 'ponte-stub.html'); await page.evaluate(code); await page.waitForTimeout(50); }
// barra pode estar no documento principal ou num quadro (frameset)
async function barra(page) { for (const f of page.frames()) { const has = await f.evaluate(() => !!document.getElementById('carimbarBar')).catch(() => false); if (has) return f; } return null; }
async function info(page) { const f = await barra(page); return f.evaluate(() => ({ resumo: document.getElementById('carimbarResumo').textContent, aviso: document.getElementById('carimbarResumo').getAttribute('data-aviso'), paciente: document.getElementById('carimbarPaciente').textContent, fila: document.getElementById('carimbarFilaInfo').textContent, quadros: document.getElementById('carimbarQuadros').textContent, status: document.getElementById('carimbarStatus').textContent })); }
async function clicar(page, rot) { const f = await barra(page); await f.evaluate(r => { const b = [...document.querySelectorAll('#carimbarBar button')].find(x => x.textContent === r); b.click(); }, rot); await page.waitForTimeout(400); }
const quadro = (page, sufixo) => page.frames().find(f => f.url().endsWith(sufixo));
const vals = (fr) => fr.evaluate(() => ({ pa: document.querySelector('[name=cdPa]').value, fc: document.querySelector('[name=nrFc]').value, risco: document.querySelector('[name=tpRisco]').value, alergia: document.querySelector('[name=snAlergia]').checked, transicao: document.querySelector('[name=dsTransicao]').value, modelo: window.modelo, destacados: document.querySelectorAll('[data-carimbar-destaque]').length }));
const JOSE = { paciente: 'José Teste Fictício', campos: { 'PA': '120x80', 'Frequência cardíaca': '76', 'Risco de queda': 'Moderado', 'Alergia': 'sim' }, evolucao: 'Transição de cuidados (teste fictício)\nPaciente estável, segue para enfermaria.' };
const MARIA = { paciente: 'Maria Teste Fictícia', campos: { 'PA': '110x70', 'Frequência cardíaca': '64' }, evolucao: 'Maria: texto de teste fictício.' };
const novaPagina = async () => { const p = await ctx.newPage(); p.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); }); return p; };

await T('14-01', 'iframe da mesma origem: preenche por rótulo, confere o paciente, eventos ExtJS/GWT, destaque', async () => {
  const page = await novaPagina(); await abrir(page, 'iframe.html');
  await page.evaluate(j => sessionStorage.setItem('carimbarJSON', JSON.stringify(j)), JOSE);
  await injetar(page); await clicar(page, 'CARIMBAR');
  const fr = quadro(page, 'form-transicao.html'); const v = await vals(fr); const i = await info(page);
  ok(v.pa === '120x80' && v.fc === '76' && v.risco === 'M' && v.alergia === true, 'valores ' + JSON.stringify(v));
  ok(v.transicao === JOSE.evolucao, 'transicao ' + v.transicao);
  ok(v.modelo.cdPa === '120x80' && v.modelo.dsTransicao === JOSE.evolucao && v.modelo.tpRisco === 'M' && v.modelo.snAlergia === true, 'modelo ' + JSON.stringify(v.modelo));
  ok(v.destacados >= 5, 'destaques ' + v.destacados);
  ok(/Paciente na tela: JOSÉ TESTE FICTÍCIO/.test(i.paciente), i.paciente);
  ok(/Paciente conferido/.test(i.resumo) && /preenchidos: 5/.test(i.resumo), i.resumo);
  ok(/Quadros lidos: 1/.test(i.quadros), i.quadros);
  await page.screenshot({ path: '/workspace/c14/p14-01-iframe.png' });
  const ev = await fr.evaluate(() => window.eventos.filter(e => e.startsWith('cdPa')));
  await page.close(); return { barra: i, eventosPA: ev };
});
await T('14-02', 'iframe: chave pelo name do campo e EXTRAIR com o quadro e o valor digitado', async () => {
  const page = await novaPagina(); await abrir(page, 'iframe.html');
  await page.evaluate(() => sessionStorage.setItem('carimbarJSON', JSON.stringify({ cdPa: '130x85', nrFc: '88' })));
  await injetar(page); await clicar(page, 'CARIMBAR');
  const v = await vals(quadro(page, 'form-transicao.html'));
  ok(v.pa === '130x85' && v.fc === '88', JSON.stringify(v));
  const i = await info(page); ok(/JSON sem paciente: sem checagem/.test(i.resumo), i.resumo);
  await clicar(page, 'EXTRAIR');
  const ext = await page.evaluate(() => JSON.parse(localStorage.getItem('__thales_extractor__'))[0].html);
  ok(ext.includes('data-carimbar-quadro="iframe#conteudo"') && ext.includes('value="130x85"') && ext.includes('Transição de cuidados'), 'extracao');
  ok(!ext.includes('data-carimbar-destaque'), 'destaque vazou');
  await page.evaluate(() => localStorage.removeItem('__thales_extractor__'));
  await page.close(); return { tamanhoHTML: ext.length };
});
await T('14-03', 'ENVIAR P/ IA (ponte local de teste): resumo traz campos do quadro, chaves e paciente; carimbo da nuvem preenche o quadro', async () => {
  const page = await novaPagina(); await abrir(page, 'iframe.html');
  await injetar(page);
  const pp = page.waitForEvent('popup'); await clicar(page, 'ENVIAR P/ IA'); const pop = await pp; await pop.waitForLoadState('load');
  await pop.waitForFunction(() => window.recebidas.some(m => m.carimbar === 'extracao'), null, { timeout: 10000 });
  const c = (await pop.evaluate(() => window.recebidas.find(m => m.carimbar === 'extracao'))).conteudo;
  const pa = c.campos.find(x => x.name === 'cdPa'), tr = c.campos.find(x => x.name === 'dsTransicao');
  ok(c.carimbar === 'Grok 1.4' && c.tiposDetectados.join() === 'generico', JSON.stringify(c.tiposDetectados));
  ok(pa && pa.quadro === 'iframe#conteudo' && pa.rotulo === 'PA (mmHg)' && pa.chave === 'cdPa', JSON.stringify(pa));
  ok(tr && tr.rotulo === 'Transição de cuidados:', JSON.stringify(tr));
  ok(c.pacienteNaTela && c.pacienteNaTela.nome === 'JOSÉ TESTE FICTÍCIO', JSON.stringify(c.pacienteNaTela));
  ok(c.quadros && c.quadros.lidos === 1 && c.quadros.ignorados === 0, JSON.stringify(c.quadros));
  ok(c.chavesCarimbar.generico.includes('cdPa') && c.chavesCarimbar.generico.includes('evolucao'), 'chaves');
  await pop.evaluate(j => window.mandar(j, 77), JOSE); await page.waitForTimeout(900);
  const v = await vals(quadro(page, 'form-transicao.html'));
  ok(v.pa === '120x80' && v.transicao === JOSE.evolucao, JSON.stringify(v));
  const back = await pop.evaluate(() => window.recebidas.find(m => m.carimbar === 'carimbado'));
  ok(back && back.id === 77 && /Paciente conferido/.test(back.resumo), JSON.stringify(back));
  await pop.close(); await page.close(); return { campos: c.campos.length, resumoKB: +(JSON.stringify(c).length / 1024).toFixed(1), carimbado: back.resumo };
});
await T('14-04', 'iframe aninhado, paciente em outro quadro: JSON do José na tela da Maria não preenche nada (aviso exato)', async () => {
  const page = await novaPagina(); await abrir(page, 'aninhado-maria.html');
  await page.evaluate(j => sessionStorage.setItem('carimbarJSON', JSON.stringify(j)), JOSE);
  await injetar(page); await clicar(page, 'CARIMBAR');
  const v = await vals(quadro(page, 'form-sem-paciente.html')); const i = await info(page);
  ok(v.pa === '' && v.fc === '' && v.transicao === '' && v.alergia === false, JSON.stringify(v));
  ok(i.resumo.includes('Este JSON é do paciente José Teste Fictício, mas a tela aberta é de MARIA TESTE FICTÍCIA. Nada foi preenchido.'), i.resumo);
  ok(/Quadros lidos: 3/.test(i.quadros), i.quadros);
  await page.screenshot({ path: '/workspace/c14/p14-04-aninhado-maria.png' });
  await page.close(); return { barra: i };
});
await T('14-05', 'Fila em quadros: José e Maria colados juntos; cada tela recebe só o seu', async () => {
  const page = await novaPagina(); await abrir(page, 'aninhado-maria.html');
  await injetar(page);
  const f = await barra(page);
  const pr = f.evaluate(() => { const b = [...document.querySelectorAll('#carimbarBar button')].find(x => x.textContent === 'INSERIR TEXTO'); b.onclick(); });
  await page.waitForTimeout(200);
  await page.evaluate(t => { document.querySelector('textarea').value = t; [...document.querySelectorAll('button')].find(b => b.textContent === 'OK').click(); }, '```json\n' + JSON.stringify(JOSE) + '\n```\n```json\n' + JSON.stringify(MARIA) + '\n```');
  await pr; await page.waitForTimeout(100);
  await clicar(page, 'CARIMBAR');
  let v = await vals(quadro(page, 'form-sem-paciente.html')); let i = await info(page);
  ok(v.pa === '110x70' && v.transicao === MARIA.evolucao, 'maria ' + JSON.stringify(v));
  ok(/Fila: José Teste Fictício, Maria Teste Fictícia/.test(i.fila), i.fila);
  const iM = i;
  await abrir(page, 'aninhado-jose.html'); await injetar(page); await clicar(page, 'CARIMBAR');
  v = await vals(quadro(page, 'form-sem-paciente.html')); i = await info(page);
  ok(v.pa === '120x80' && v.transicao === JOSE.evolucao && v.risco === 'M', 'jose ' + JSON.stringify(v));
  ok(/Paciente conferido: José Teste Fictício = JOSÉ TESTE FICTÍCIO/.test(i.resumo), i.resumo);
  await page.screenshot({ path: '/workspace/c14/p14-05-fila-jose.png' });
  await page.close(); return { maria: iM.resumo, jose: i.resumo };
});
await T('14-06', 'frameset: barra vai para o quadro principal; paciente lido do quadro do cabeçalho; preenche', async () => {
  const page = await novaPagina(); await abrir(page, 'frameset.html');
  await page.evaluate(j => sessionStorage.setItem('carimbarJSON', JSON.stringify(j)), JOSE);
  await injetar(page);
  const f = await barra(page); ok(f && f.url().endsWith('form-sem-paciente.html'), 'barra em ' + (f && f.url()));
  const vis = await f.evaluate(() => { const r = document.getElementById('carimbarBar').getBoundingClientRect(); return r.width > 50 && r.height > 20; });
  ok(vis, 'barra invisivel');
  await clicar(page, 'CARIMBAR');
  const v = await vals(quadro(page, 'form-sem-paciente.html')); const i = await info(page);
  ok(v.pa === '120x80' && v.transicao === JOSE.evolucao, JSON.stringify(v));
  ok(/Paciente na tela: JOSÉ TESTE FICTÍCIO \(prontuario 778899\)/.test(i.paciente), i.paciente);
  ok(/Quadros lidos: 2/.test(i.quadros), i.quadros);
  await page.screenshot({ path: '/workspace/c14/p14-06-frameset.png' });
  await page.close(); return { barra: i };
});
await T('14-07', 'quadro de outro site: ignorado e contado na barra; o da mesma origem é preenchido', async () => {
  const page = await novaPagina(); await abrir(page, 'outro-site.html');
  await page.evaluate(j => sessionStorage.setItem('carimbarJSON', JSON.stringify(j)), JOSE);
  await injetar(page); await clicar(page, 'CARIMBAR');
  const i = await info(page);
  ok(/Quadros lidos: 1 \| de outro site, ignorados: 1/.test(i.quadros), i.quadros);
  const v = await vals(page.frames().find(f => f.url() === B + 'form-transicao.html'));
  ok(v.pa === '120x80', JSON.stringify(v));
  const ext = page.frames().find(f => f.url().startsWith('http://127.0.0.1:8802/'));
  const ve = await vals(ext); ok(ve.pa === '', 'externo mexido');
  await page.close(); return { barra: i.quadros };
});
await T('14-08', 'só quadro de outro site: avisa que não dá para ler', async () => {
  const page = await novaPagina(); await abrir(page, 'so-externo.html');
  dialogs.length = 0; await injetar(page); await clicar(page, 'CARIMBAR');
  ok(dialogs.some(d => d === 'Nenhum formulario reconhecido. Esta tela tem 1 quadro(s) de outro site, que o navegador nao deixa ler.'), JSON.stringify(dialogs));
  const i = await info(page); ok(/de outro site, ignorados: 1/.test(i.quadros), i.quadros);
  await page.close(); return { dialogo: dialogs[0] };
});
await T('14-09', 'editor rico em iframe (designMode/contenteditable) e campo em shadow DOM aberto', async () => {
  const page = await novaPagina(); await abrir(page, 'rico.html'); await page.waitForTimeout(200);
  await page.evaluate(() => sessionStorage.setItem('carimbarJSON', JSON.stringify({ paciente: 'José', evolucao: 'Evolução de teste fictícia\nSegunda linha do texto', 'CID principal': 'J18.9' })));
  await injetar(page); await clicar(page, 'CARIMBAR');
  const ed = page.frames().find(f => f.url().endsWith('editor-iframe.html'));
  const t = await ed.evaluate(() => document.body.innerText);
  const inner = page.frames().find(f => f.url().endsWith('rico-inner.html'));
  const cid = await inner.evaluate(() => document.getElementById('sombra').shadowRoot.querySelector('input').value);
  const i = await info(page);
  ok(/Evolução de teste fictícia/.test(t) && /Segunda linha do texto/.test(t), 'editor: ' + t);
  ok(cid === 'J18.9', 'cid ' + cid);
  ok(/preenchidos: 2/.test(i.resumo), i.resumo);
  await page.screenshot({ path: '/workspace/c14/p14-09-rico.png' });
  await page.close(); return { editor: t, resumo: i.resumo };
});
await T('14-10', 'duas caixas de texto: sem clique pede para clicar; depois de clicar na Conduta vai para ela', async () => {
  const page = await novaPagina(); await abrir(page, 'dois-textos.html');
  await page.evaluate(() => sessionStorage.setItem('carimbarJSON', JSON.stringify({ paciente: 'José', evolucao: 'Texto de teste' })));
  await injetar(page); await clicar(page, 'CARIMBAR');
  const fr = quadro(page, 'dois-textos-inner.html');
  let i = await info(page); let v = await fr.evaluate(() => [document.getElementById('a').value, document.getElementById('b').value]);
  ok(v[0] === '' && v[1] === '' && /Ha 2 caixas de texto/.test(i.resumo), i.resumo);
  await page.waitForTimeout(1600); await fr.click('#b'); await clicar(page, 'CARIMBAR');
  v = await fr.evaluate(() => [document.getElementById('a').value, document.getElementById('b').value]); i = await info(page);
  ok(v[0] === '' && v[1] === 'Texto de teste', JSON.stringify(v));
  await page.close(); return { resumo: i.resumo };
});
await T('14-11', 'regressão 1.3 dentro de quadro: antropometria em iframe, paciente no topo, José confere', async () => {
  const page = await novaPagina(); await abrir(page, 'antro-quadro.html');
  await page.evaluate(() => sessionStorage.setItem('carimbarJSON', JSON.stringify({ paciente: 'José', peso: '80.5', gordura: '22.1', altura: '175' })));
  await injetar(page); await clicar(page, 'CARIMBAR');
  const fr = quadro(page, 'antro-inner.html');
  const v = await fr.evaluate(() => ['weight', 'fatPct', 'height'].map(n => document.querySelector('[name=' + n + ']').value));
  const i = await info(page);
  ok(v.join() === '80.5,22.1,175', v.join()); ok(/Tipo: antropometria \| preenchidos: 3/.test(i.resumo) && /Paciente conferido: José = José Teste Fictício/.test(i.resumo), i.resumo);
  await page.close(); return { resumo: i.resumo };
});
await T('14-12', 'AVANCADO > CAMPOS mostra os campos de cada quadro com contorno', async () => {
  const page = await novaPagina(); await abrir(page, 'aninhado-jose.html');
  await injetar(page); await clicar(page, 'CAMPOS');
  const i = await info(page); const fr = quadro(page, 'form-sem-paciente.html');
  const n = await fr.evaluate(() => document.querySelectorAll('[data-carimbar-destaque="campo"]').length);
  ok(n === 5 && /Campos visiveis: 5/.test(i.resumo) && /iframe#workspace > iframe#form: cdPa, nrFc, tpRisco, snAlergia, dsTransicao/.test(i.resumo), i.resumo + ' n=' + n);
  await page.screenshot({ path: '/workspace/c14/p14-12-campos.png' });
  await page.close(); return { resumo: i.resumo };
});
await browser.close();
const passou = res.filter(r => r.status === 'passou').length;
fs.writeFileSync('/workspace/c14/resultados-e2e14-' + (process.argv[3] || 'fonte') + '.json', JSON.stringify(res, null, 1));
console.log(JSON.stringify({ passou, total: res.length, falhas: res.filter(r => r.status !== 'passou') }, null, 1));

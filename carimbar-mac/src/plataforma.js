'use strict';

const { execFile, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { B64_MAX } = require('./config');

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: opts.timeout || 15000, maxBuffer: 20 * 1024 * 1024, encoding: 'utf8', ...opts }, (err, stdout, stderr) => {
      if (err) {
        err.stderr = stderr;
        return reject(err);
      }
      resolve({ stdout: stdout || '', stderr: stderr || '' });
    });
  });
}

function runOsascript(script) {
  return run('osascript', ['-e', script]);
}

function ehNossaApp(titulo, processo, nossosNomes) {
  const t = String(titulo || '');
  const p = String(processo || '');
  for (const n of nossosNomes || ['CARIMBAR']) {
    if (t.startsWith(n) || p === n) return true;
  }
  // Electron dev: process may be "Electron"
  if (/^CARIMBAR\b/i.test(t)) return true;
  return false;
}

async function janelaFrenteDarwin() {
  const script = `
tell application "System Events"
  set p to first application process whose frontmost is true
  set procName to name of p
  set winName to ""
  set winX to 0
  set winY to 0
  set winW to 0
  set winH to 0
  try
    tell window 1 of p
      set winName to name
      set pos to position
      set sz to size
      set winX to item 1 of pos
      set winY to item 2 of pos
      set winW to item 1 of sz
      set winH to item 2 of sz
    end tell
  end try
  return procName & tab & winName & tab & winX & tab & winY & tab & winW & tab & winH
end tell`;
  const { stdout } = await runOsascript(script);
  const parts = stdout.replace(/\n$/, '').split('\t');
  return {
    plataforma: 'darwin',
    processo: parts[0] || '',
    titulo: parts[1] || '',
    bounds: {
      x: Number(parts[2] || 0),
      y: Number(parts[3] || 0),
      w: Number(parts[4] || 0),
      h: Number(parts[5] || 0)
    }
  };
}

async function cgWindowIdDarwin(processo, titulo) {
  // JXA + CoreGraphics: pega o CGWindowID da janela na frente com o mesmo processo/título.
  const jxa = `
ObjC.import("CoreGraphics");
function run() {
  const opts = $.kCGWindowListOptionOnScreenOnly | $.kCGWindowListExcludeDesktopElements;
  const list = ObjC.deepUnwrap($.CGWindowListCopyWindowInfo(opts, $.kCGNullWindowID));
  const proc = ${JSON.stringify(processo)};
  const tit = ${JSON.stringify(titulo)};
  if (!list) return "";
  for (const w of list) {
    const owner = w["kCGWindowOwnerName"] || "";
    const name = w["kCGWindowName"] || "";
    const layer = w["kCGWindowLayer"];
    if (layer !== 0) continue;
    if (owner === proc && (!tit || name === tit || name.indexOf(tit) >= 0 || tit.indexOf(name) >= 0)) {
      return String(w["kCGWindowNumber"]);
    }
  }
  return "";
}
`;
  try {
    const { stdout } = await run('osascript', ['-l', 'JavaScript', '-e', jxa]);
    const id = String(stdout).trim();
    return /^\d+$/.test(id) ? id : '';
  } catch {
    return '';
  }
}

async function ativarDarwin(alvo) {
  if (!alvo || !alvo.processo) return false;
  const script = `tell application "System Events" to set frontmost of first application process whose name is ${JSON.stringify(alvo.processo)} to true`;
  try {
    await runOsascript(script);
    await sleep(250);
    return true;
  } catch {
    return false;
  }
}

async function capturaDarwin(alvo, { largura, qualidade, arquivo }) {
  const wid = await cgWindowIdDarwin(alvo.processo, alvo.titulo);
  const tmpPng = arquivo + '.png';
  try {
    if (wid) {
      await run('screencapture', ['-x', '-o', '-t', 'png', '-l', String(wid), tmpPng]);
    } else if (alvo.bounds && alvo.bounds.w >= 50 && alvo.bounds.h >= 50) {
      const { x, y, w, h } = alvo.bounds;
      await run('screencapture', ['-x', '-t', 'png', '-R', `${x},${y},${w},${h}`, tmpPng]);
    } else {
      throw new Error('não achei a janela para fotografar (está minimizada?)');
    }
    if (!fs.existsSync(tmpPng) || fs.statSync(tmpPng).size < 100) {
      throw new Error('a captura de tela falhou ou ficou vazia');
    }
    await reduzirJpeg(tmpPng, arquivo, largura, qualidade);
    return true;
  } finally {
    try { fs.unlinkSync(tmpPng); } catch {}
  }
}

async function reduzirJpeg(origem, destino, maxL, qualidade) {
  let larg = maxL;
  let qual = qualidade;
  let ok = false;
  let lastErr = '';
  for (let i = 0; i < 3; i++) {
    try {
      if (process.platform === 'darwin') {
        await run('sips', ['-Z', String(larg), '-s', 'format', 'jpeg', '-s', 'formatOptions', String(qual), origem, '--out', destino]);
      } else {
        await run('convert', [origem, '-resize', `${larg}x${larg}>`, '-quality', String(qual), destino]);
      }
      if (fs.existsSync(destino) && fs.statSync(destino).size > 50) {
        const b64 = fs.readFileSync(destino).toString('base64');
        if (b64.length <= B64_MAX) { ok = true; break; }
      }
    } catch (e) {
      lastErr = e.message;
    }
    larg = Math.round(larg * 0.75);
    qual = Math.max(30, qual - 10);
  }
  if (!ok) throw new Error(lastErr || 'a foto ficou grande demais mesmo depois de reduzir');
}

async function janelaFrenteLinux() {
  // Melhor esforço para testes no Linux. Prioriza xdotool.
  try {
    const { stdout: id } = await run('xdotool', ['getactivewindow']);
    const wid = id.trim();
    const { stdout: titulo } = await run('xdotool', ['getwindowname', wid]);
    let processo = '';
    try {
      const { stdout: pid } = await run('xdotool', ['getwindowpid', wid]);
      processo = fs.readFileSync(`/proc/${pid.trim()}/comm`, 'utf8').trim();
    } catch {}
    let bounds = { x: 0, y: 0, w: 0, h: 0 };
    try {
      const { stdout: geo } = await run('xdotool', ['getwindowgeometry', '--shell', wid]);
      const m = {};
      geo.split('\n').forEach(l => { const p = l.split('='); if (p.length === 2) m[p[0]] = Number(p[1]); });
      bounds = { x: m.X || 0, y: m.Y || 0, w: m.WIDTH || 0, h: m.HEIGHT || 0 };
    } catch {}
    return { plataforma: 'linux', id: wid, processo, titulo: titulo.replace(/\n$/, ''), bounds };
  } catch (e) {
    throw new Error('não consegui ler a janela da frente no Linux (xdotool?): ' + e.message);
  }
}

async function ativarLinux(alvo) {
  if (!alvo || !alvo.id) return false;
  try {
    await run('xdotool', ['windowactivate', '--sync', String(alvo.id)]);
    await sleep(200);
    return true;
  } catch { return false; }
}

async function capturaLinux(alvo, { largura, qualidade, arquivo }) {
  const tmp = arquivo + '.png';
  try {
    if (alvo.id) {
      try {
        await run('import', ['-window', String(alvo.id), tmp]);
      } catch {
        await run('scrot', ['-u', tmp]);
      }
    } else {
      await run('scrot', ['-u', tmp]);
    }
    if (!fs.existsSync(tmp)) throw new Error('a captura de tela falhou');
    await reduzirJpeg(tmp, arquivo, largura, qualidade);
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function janelaFrente() {
  if (process.platform === 'darwin') return janelaFrenteDarwin();
  if (process.platform === 'linux') return janelaFrenteLinux();
  throw new Error('plataforma não suportada neste programa: ' + process.platform);
}

async function ativar(alvo) {
  if (process.platform === 'darwin') return ativarDarwin(alvo);
  if (process.platform === 'linux') return ativarLinux(alvo);
  return false;
}

async function mesmaJanelaNaFrente(alvo, trecho) {
  const atual = await janelaFrente();
  if (trecho && !String(atual.titulo || '').toLowerCase().includes(String(trecho).toLowerCase())) {
    return { ok: false, atual };
  }
  if (alvo) {
    if (alvo.processo && atual.processo && alvo.processo !== atual.processo) return { ok: false, atual };
    if (alvo.id && atual.id && String(alvo.id) !== String(atual.id)) return { ok: false, atual };
    if (alvo.titulo && atual.titulo && alvo.titulo !== atual.titulo) {
      // título pode mudar (aba); se o trecho ainda bate, aceita
      if (!trecho || !String(atual.titulo).toLowerCase().includes(String(trecho).toLowerCase())) {
        return { ok: false, atual };
      }
    }
  }
  return { ok: true, atual };
}

function descreve(j) {
  if (!j) return '(nenhuma janela ativa)';
  const t = j.titulo || '(sem título)';
  const p = j.processo ? ` (${j.processo})` : '';
  return t + p;
}

async function fotografar(alvo, opts) {
  const dir = opts.tempDir || os.tmpdir();
  const arquivo = path.join(dir, 'carimbar-mac-foto-' + Date.now() + '.jpg');
  const largura = opts.largura || 1280;
  const qualidade = opts.qualidade || 60;
  try {
    if (alvo.bounds && (alvo.bounds.w < 50 || alvo.bounds.h < 50)) {
      throw new Error('a janela do sistema está pequena demais ou minimizada');
    }
    if (process.platform === 'darwin') await capturaDarwin(alvo, { largura, qualidade, arquivo });
    else if (process.platform === 'linux') await capturaLinux(alvo, { largura, qualidade, arquivo });
    else throw new Error('plataforma sem captura: ' + process.platform);
    const b64 = fs.readFileSync(arquivo).toString('base64');
    if (b64.length > B64_MAX) throw new Error('a foto ficou grande demais mesmo depois de reduzir');
    return { mime: 'image/jpeg', b64 };
  } finally {
    try { fs.unlinkSync(arquivo); } catch {}
  }
}

async function lerClipboard() {
  if (process.platform === 'darwin') {
    try {
      const { stdout } = await run('pbpaste', []);
      return stdout;
    } catch { return ''; }
  }
  if (process.platform === 'linux') {
    try {
      const { stdout } = await run('xclip', ['-selection', 'clipboard', '-o']);
      return stdout;
    } catch {
      try {
        const { stdout } = await run('xsel', ['--clipboard', '--output']);
        return stdout;
      } catch { return ''; }
    }
  }
  return '';
}

async function escreverClipboard(texto) {
  if (process.platform === 'darwin') {
    await new Promise((resolve, reject) => {
      const p = spawn('pbcopy');
      p.on('error', reject);
      p.on('close', code => code === 0 ? resolve() : reject(new Error('pbcopy ' + code)));
      p.stdin.end(texto, 'utf8');
    });
    return;
  }
  if (process.platform === 'linux') {
    await new Promise((resolve, reject) => {
      const p = spawn('xclip', ['-selection', 'clipboard']);
      p.on('error', err => {
        const q = spawn('xsel', ['--clipboard', '--input']);
        q.on('error', reject);
        q.on('close', code => code === 0 ? resolve() : reject(new Error('xsel ' + code)));
        q.stdin.end(texto, 'utf8');
      });
      p.on('close', code => code === 0 ? resolve() : reject(new Error('xclip ' + code)));
      p.stdin.end(texto, 'utf8');
    });
  }
}

async function tecla(tipo, atalhoColar) {
  const usarCmd = atalhoColar !== 'ctrl';
  if (process.platform === 'darwin') {
    if (tipo === 'tab') {
      await runOsascript('tell application "System Events" to key code 48');
    } else if (tipo === 'selecionar') {
      const mod = usarCmd ? 'command down' : 'control down';
      await runOsascript(`tell application "System Events" to keystroke "a" using ${mod}`);
    } else if (tipo === 'colar') {
      const mod = usarCmd ? 'command down' : 'control down';
      await runOsascript(`tell application "System Events" to keystroke "v" using ${mod}`);
    }
    return;
  }
  if (process.platform === 'linux') {
    if (tipo === 'tab') await run('xdotool', ['key', 'Tab']);
    else if (tipo === 'selecionar') await run('xdotool', ['key', 'ctrl+a']);
    else if (tipo === 'colar') await run('xdotool', ['key', 'ctrl+v']);
  }
}

/**
 * Executa o plano de colagem. Nunca envia Enter nem atalho de salvar.
 * onChecarFrente() deve lançar ou devolver {ok:false, motivo} se a janela mudou.
 */
async function executarColagem({ passos, atalhoColar, atrasoTab, atrasoColar, checarFrente }) {
  const salvo = await lerClipboard();
  let colados = 0;
  const faltou = [];
  const falhou = [];
  let parou = '';
  let erro = '';
  try {
    for (const passo of passos) {
      const chk = await checarFrente();
      if (!chk || !chk.ok) {
        parou = chk && chk.motivo ? chk.motivo : 'a janela do sistema deixou de estar na frente';
        break;
      }
      if (passo.tipo === 'tab') {
        await tecla('tab', atalhoColar);
        await sleep(atrasoTab);
        continue;
      }
      if (passo.tipo === 'pular') {
        faltou.push(passo.chave);
        continue;
      }
      if (passo.tipo === 'colar') {
        const chk2 = await checarFrente();
        if (!chk2 || !chk2.ok) {
          parou = 'a janela do sistema deixou de estar na frente antes de colar \'' + passo.chave + '\'';
          break;
        }
        try {
          await escreverClipboard(passo.texto);
          await sleep(40);
        } catch {
          falhou.push(passo.chave);
          continue;
        }
        if (passo.substituir) {
          await tecla('selecionar', atalhoColar);
          await sleep(120);
        }
        await tecla('colar', atalhoColar);
        await sleep(atrasoColar);
        colados += 1;
      }
    }
  } catch (e) {
    erro = e.message;
  }
  try { await escreverClipboard(salvo); } catch (e2) {
    erro += (erro ? ' | ' : '') + 'Não consegui restaurar a área de transferência: ' + e2.message;
  }
  return { colados, faltou, falhou, parou, erro };
}

module.exports = {
  janelaFrente,
  ativar,
  mesmaJanelaNaFrente,
  descreve,
  fotografar,
  lerClipboard,
  escreverClipboard,
  tecla,
  executarColagem,
  ehNossaApp,
  sleep
};

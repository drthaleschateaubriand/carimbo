'use strict';

const { app, BrowserWindow, globalShortcut, ipcMain, screen, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const { MAX_FOTOS, INTERVALO_MS, ESPERA_MAX_MS, VERSAO } = require('./config');
const fluxo = require('./fluxo');
const nuvem = require('./nuvem');
const sessao = require('./sessao');
const plat = require('./plataforma');
const ajustes = require('./ajustes');

let btnWin = null;
let dlgWin = null;
let tray = null;
let cfg;
let codigo = '';
let ocupado = false;
let consultando = false;
let colando = false;
let timerConsulta = null;
let ultimoAlvoOk = null; // última janela do sistema rastreada
let ultimaAtiva = null;  // última janela não-CARIMBAR
let estado = { vista: 'nada' };
const nossosNomes = ['CARIMBAR', 'Electron'];

function userData() { return app.getPath('userData'); }

function criarBotao() {
  const { width } = screen.getPrimaryDisplay().workAreaSize;
  btnWin = new BrowserWindow({
    width: 168,
    height: 52,
    x: Math.max(0, width - 188),
    y: 12,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    fullscreenable: false,
    minimizable: false,
    maximizable: false,
    closable: true,
    focusable: true,
    show: false,
    title: 'CARIMBAR',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  if (process.platform === 'darwin') {
    try { btnWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true }); } catch {}
    try { btnWin.setAlwaysOnTop(true, 'screen-saver'); } catch {}
  }
  btnWin.loadFile(path.join(__dirname, '../ui/botao.html'));
  btnWin.once('ready-to-show', () => btnWin.showInactive());
  btnWin.on('close', () => { app.quit(); });
}

function criarDialogo() {
  if (dlgWin && !dlgWin.isDestroyed()) return dlgWin;
  dlgWin = new BrowserWindow({
    width: 680,
    height: 560,
    frame: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    minimizable: false,
    fullscreenable: false,
    title: 'CARIMBAR',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  if (process.platform === 'darwin') {
    try { dlgWin.setAlwaysOnTop(true, 'floating'); } catch {}
  }
  dlgWin.loadFile(path.join(__dirname, '../ui/dialogo.html'));
  dlgWin.on('close', (e) => {
    if (ocupado && estado.vista && estado.vista !== 'ajustes') {
      e.preventDefault();
      dlgWin.hide();
      cancelarTudo();
    }
  });
  return dlgWin;
}

function enviarEstado() {
  const payload = { ...estado, ocupado, versao: VERSAO };
  if (dlgWin && !dlgWin.isDestroyed()) dlgWin.webContents.send('estado', payload);
  if (btnWin && !btnWin.isDestroyed()) btnWin.webContents.send('estado', payload);
}

function mostrarDialogo(vista, extra) {
  estado = { vista, ...(extra || {}) };
  const w = criarDialogo();
  const pronto = () => {
    enviarEstado();
    w.showInactive();
  };
  if (w.webContents.isLoading()) w.webContents.once('did-finish-load', pronto);
  else pronto();
}

function fecharDialogo() {
  estado = { vista: 'nada' };
  if (dlgWin && !dlgWin.isDestroyed()) {
    try { dlgWin.hide(); } catch {}
  }
  enviarEstado();
}

function esconderNossas() {
  const wins = [];
  if (btnWin && !btnWin.isDestroyed() && btnWin.isVisible()) { btnWin.hide(); wins.push(btnWin); }
  if (dlgWin && !dlgWin.isDestroyed() && dlgWin.isVisible()) { dlgWin.hide(); wins.push(dlgWin); }
  return wins;
}

function mostrarNossas(wins) {
  for (const w of wins) {
    try { if (!w.isDestroyed()) w.showInactive(); } catch {}
  }
}

function ehNossa(j) {
  if (!j) return false;
  return plat.ehNossaApp(j.titulo, j.processo, nossosNomes);
}

async function rastrear() {
  try {
    const j = await plat.janelaFrente();
    if (ehNossa(j)) return;
    ultimaAtiva = j;
    if (fluxo.tituloBate(j.titulo, cfg.janelaTitulo)) ultimoAlvoOk = j;
  } catch {}
}

async function alvoSistema(viaHotkey) {
  let j;
  try { j = await plat.janelaFrente(); } catch (e) {
    await alerta('Não consegui ler a janela da frente: ' + e.message);
    return null;
  }
  if (fluxo.tituloBate(j.titulo, cfg.janelaTitulo) && !ehNossa(j)) return j;
  // Clique no botão pode ter tomado o foco: se a última janela ativa era o sistema, reativa.
  if (ehNossa(j) && ultimoAlvoOk && ultimaAtiva &&
      ultimaAtiva.titulo === ultimoAlvoOk.titulo &&
      ultimaAtiva.processo === ultimoAlvoOk.processo) {
    const ok = await plat.ativar(ultimoAlvoOk);
    if (ok) {
      const deNovo = await plat.janelaFrente().catch(() => null);
      if (deNovo && fluxo.tituloBate(deNovo.titulo, cfg.janelaTitulo)) return deNovo;
    }
  }
  void viaHotkey;
  await alerta(
    'A janela ativa não é a do sistema configurado. Nada foi enviado.\n\n' +
    'Janela ativa agora: ' + plat.descreve(j) + '\n' +
    'O título precisa conter: “' + cfg.janelaTitulo + '”. Ajuste isso em Configurações, se for o caso.'
  );
  return null;
}

async function alerta(msg) {
  // Usa dialog do Electron (só para avisos). Não cola nada.
  if (btnWin && !btnWin.isDestroyed()) {
    await dialog.showMessageBox(btnWin, { type: 'warning', title: 'CARIMBAR', message: msg, buttons: ['OK'] });
  } else {
    await dialog.showMessageBox({ type: 'warning', title: 'CARIMBAR', message: msg, buttons: ['OK'] });
  }
}

async function iniciarCaptura(viaHotkey) {
  if (ocupado) {
    await alerta('Já existe uma extração em andamento (janela “aguardando a IA” ou de confirmação). Termine ou cancele antes de começar outra.');
    return;
  }
  const hwnd = await alvoSistema(viaHotkey);
  if (!hwnd) return;
  ocupado = true;
  estado = {
    vista: 'escolha',
    alvo: hwnd,
    fotos: [],
    telas: fluxo.listasTelas(),
    tela: 'evolucao'
  };
  mostrarDialogo('escolha', estado);
}

async function tirarFoto(alvo) {
  const okAtivo = await plat.ativar(alvo);
  if (!okAtivo) {
    const agora = await plat.janelaFrente().catch(() => null);
    await alerta('O sistema deixou de ser a janela ativa. Nada foi enviado.\n\nJanela ativa agora: ' + plat.descreve(agora));
    return null;
  }
  const wins = esconderNossas();
  await plat.sleep(400);
  let foto;
  try {
    const frente = await plat.janelaFrente();
    if (!fluxo.tituloBate(frente.titulo, cfg.janelaTitulo)) {
      throw new Error('a janela da frente mudou antes da foto: ' + plat.descreve(frente));
    }
    foto = await plat.fotografar(frente, {
      largura: cfg.fotoLargura,
      qualidade: cfg.fotoQualidade,
      tempDir: app.getPath('temp')
    });
    estado.alvo = frente;
  } finally {
    mostrarNossas(wins);
  }
  return foto;
}

function pararConsulta() {
  if (timerConsulta) { clearInterval(timerConsulta); timerConsulta = null; }
  consultando = false;
}

function liberar() {
  pararConsulta();
  ocupado = false;
  colando = false;
  consultando = false;
  fecharDialogo();
}

function cancelarTudo() {
  liberar();
}

async function enviarEEsperar() {
  const { alvo, tela, fotos } = estado;
  if (!fotos || !fotos.length) {
    await alerta('Tire pelo menos uma foto antes de enviar.');
    return;
  }
  const enviadoEm = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const conteudo = fluxo.montarConteudo({
    tela,
    titulo: alvo.titulo,
    enviadoEm,
    plataforma: process.platform
  });
  const corpo = fluxo.montarCorpoEnvio({
    codigo,
    conteudo,
    tela,
    imagens: fotos.map(f => ({ mime: f.mime, b64: f.b64 }))
  });
  mostrarDialogo('espera', {
    tela,
    telaTitulo: require('./config').TELAS[tela].titulo,
    nFotos: fotos.length,
    extId: '…',
    sessao: codigo.slice(0, 8),
    horaEnvio: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    tickEnvio: Date.now(),
    ignoradas: 0,
    erroRede: 'enviando…'
  });
  let id;
  try {
    id = await nuvem.enviarExtracao(corpo, 60000);
  } catch (e) {
    liberar();
    await alerta('Erro: ' + e.message + '\n\nNada foi colado.');
    return;
  }
  estado.extId = id;
  estado.alvo = alvo;
  estado.tela = tela;
  estado.tickEnvio = Date.now();
  estado.horaEnvio = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  estado.nFotos = fotos.length;
  estado.ignoradas = 0;
  estado.vistos = {};
  estado.erroRede = '';
  estado.vista = 'espera';
  estado.sessao = codigo.slice(0, 8);
  estado.telaTitulo = require('./config').TELAS[tela].titulo;
  enviarEstado();
  pararConsulta();
  timerConsulta = setInterval(() => { consulta().catch(() => {}); }, INTERVALO_MS);
  consulta().catch(() => {});
}

async function consulta() {
  if (!ocupado || consultando || !estado.extId || estado.extId === '…') return;
  if (Date.now() - estado.tickEnvio > ESPERA_MAX_MS) {
    liberar();
    await alerta('A IA não respondeu em 15 minutos. Nada foi colado. Se ainda quiser, comece de novo com o atalho.');
    return;
  }
  consultando = true;
  try {
    const linhas = await nuvem.buscar(codigo, estado.extId, 15000);
    estado.erroRede = '';
    const r = fluxo.processaLinhas(linhas, { extId: estado.extId, tela: estado.tela, vistos: estado.vistos });
    estado.vistos = r.vistos;
    estado.ignoradas = (estado.ignoradas || 0) + r.ignoradasDelta;
    if (r.achou) {
      pararConsulta();
      abrirConfirmacao(r.dados);
      return;
    }
  } catch (e) {
    estado.erroRede = String(e.message || e).slice(0, 80);
  } finally {
    consultando = false;
  }
  if (ocupado && estado.vista === 'espera') enviarEstado();
}

function abrirConfirmacao(dados) {
  const resumo = fluxo.resumoCampos(estado.tela, dados);
  const telas = require('./config').TELAS;
  estado = {
    ...estado,
    vista: 'confirma',
    dados,
    resumo,
    telaTitulo: telas[estado.tela].titulo,
    telaExemplo: !!telas[estado.tela].exemplo,
    sessao: codigo.slice(0, 8)
  };
  mostrarDialogo('confirma', estado);
}

async function colar(substituir) {
  if (colando || !estado.dados) return;
  colando = true;
  const alvo = estado.alvo;
  try {
    let frente = await plat.janelaFrente().catch(() => null);
    if (!frente || !fluxo.tituloBate(frente.titulo, cfg.janelaTitulo)) {
      // Só reativa se o foco estiver numa janela do CARIMBAR e a origem era este mesmo alvo.
      if (frente && ehNossa(frente) && ultimoAlvoOk && alvo &&
          ultimoAlvoOk.processo === alvo.processo) {
        await plat.ativar(alvo);
        await plat.sleep(300);
        frente = await plat.janelaFrente().catch(() => null);
        if (!frente || !fluxo.tituloBate(frente.titulo, cfg.janelaTitulo)) {
          await alerta('O sistema não voltou para a frente. Nada foi colado.\n\nJanela ativa agora: ' + plat.descreve(frente) + '\n\nClique no primeiro campo e confirme de novo.');
          colando = false;
          return;
        }
      } else {
        await alerta('O sistema não está na frente (e não é a mesma janela de onde a foto saiu). Nada foi colado.\n\nJanela ativa agora: ' + plat.descreve(frente) + '\n\nClique no primeiro campo e confirme de novo.');
        colando = false;
        return;
      }
    }
    // Devolve o foco ao sistema antes de colar (a janela de confirmação pode tê-lo tomado — no Windows o AHK usa NoActivate; no Mac isso não se reproduz por completo).
    await plat.ativar(alvo);
    await plat.sleep(200);

    const passos = fluxo.planoColagem(estado.tela, estado.dados, substituir, cfg.usarCrlf);
    const r = await plat.executarColagem({
      passos,
      atalhoColar: cfg.atalhoColar,
      atrasoTab: cfg.atrasoTab,
      atrasoColar: cfg.atrasoColar,
      checarFrente: async () => {
        const j = await plat.janelaFrente().catch(() => null);
        if (!j || !fluxo.tituloBate(j.titulo, cfg.janelaTitulo)) {
          return { ok: false, motivo: 'o sistema deixou de ser a janela ativa', atual: j };
        }
        return { ok: true, atual: j };
      }
    });
    if (r.parou) {
      await alerta('Colagem INTERROMPIDA: ' + r.parou + '. Campos colados até aqui: ' + r.colados + '.\n\nConfira a tela e não salve.');
    } else if (r.erro) {
      await alerta('Erro durante a colagem: ' + r.erro + '\n\nConfira o campo antes de continuar.');
    } else {
      let aviso = 'CARIMBAR: ' + r.colados + ' campo(s) colado(s). Confira e salve você mesmo.';
      if (r.faltou.length) aviso += ' Sem valor (só Tab): ' + r.faltou.join(', ') + '.';
      if (r.falhou.length) aviso += ' Falha ao copiar: ' + r.falhou.join(', ') + '.';
      await dialog.showMessageBox({ type: 'info', title: 'CARIMBAR', message: aviso, buttons: ['OK'] });
    }
  } catch (e) {
    await alerta('Erro: ' + e.message + '\n\nConfira a tela antes de continuar.');
  }
  colando = false;
  liberar();
}

ipcMain.handle('ui', async (_e, acao, payload) => {
  try {
    if (acao === 'ping') return { ok: true, versao: VERSAO, plataforma: process.platform };
    if (acao === 'capturar') { await iniciarCaptura(false); return { ok: true }; }
    if (acao === 'abrir-ajustes') {
      mostrarDialogo('ajustes', { cfg, codigoPrefixo: codigo.slice(0, 8) });
      return { ok: true };
    }
    if (acao === 'salvar-ajustes') {
      cfg = ajustes.salvar(userData(), payload);
      registrarAtalho();
      return { ok: true, cfg };
    }
    if (acao === 'cancelar') { cancelarTudo(); return { ok: true }; }
    if (acao === 'escolher-tela') {
      if (!ocupado || estado.vista !== 'escolha') return { ok: false };
      if (!payload || !payload.tela || !require('./config').TELAS[payload.tela]) return { ok: false };
      estado.tela = payload.tela;
      let foto;
      try { foto = await tirarFoto(estado.alvo); }
      catch (e) { liberar(); await alerta('Não consegui tirar a foto da janela: ' + e.message); return { ok: false }; }
      if (!foto) { liberar(); return { ok: false }; }
      estado.fotos = [foto];
      estado.vista = 'fotos';
      estado.nFotos = 1;
      estado.maxFotos = MAX_FOTOS;
      estado.telaTitulo = require('./config').TELAS[estado.tela].titulo;
      mostrarDialogo('fotos', estado);
      return { ok: true };
    }
    if (acao === 'mais-foto') {
      if (!ocupado || estado.vista !== 'fotos') return { ok: false };
      if ((estado.fotos || []).length >= MAX_FOTOS) return { ok: false };
      let foto;
      try { foto = await tirarFoto(estado.alvo); }
      catch (e) { await alerta('Não consegui tirar a foto da janela: ' + e.message); return { ok: false }; }
      if (!foto) return { ok: false };
      estado.fotos.push(foto);
      estado.nFotos = estado.fotos.length;
      enviarEstado();
      return { ok: true };
    }
    if (acao === 'enviar') { await enviarEEsperar(); return { ok: true }; }
    if (acao === 'confirmar-substituir') { await colar(true); return { ok: true }; }
    if (acao === 'inserir-cursor') { await colar(false); return { ok: true }; }
    if (acao === 'estado') return { ...estado, ocupado, versao: VERSAO };
    return { ok: false, erro: 'acao-desconhecida' };
  } catch (e) {
    await alerta('Erro: ' + e.message + '\n\nNada foi colado.');
    if (ocupado && estado.vista !== 'confirma') liberar();
    return { ok: false, erro: e.message };
  }
});

function registrarAtalho() {
  try { globalShortcut.unregisterAll(); } catch {}
  const atalho = cfg.atalhoGlobal || 'CommandOrControl+Alt+M';
  const ok = globalShortcut.register(atalho, () => { iniciarCaptura(true); });
  if (!ok) {
    console.warn('não registrei o atalho', atalho);
  }
}

function criarTray() {
  const img = nativeImage.createFromPath(path.join(__dirname, '../assets/icon.png'));
  tray = new Tray(img.isEmpty() ? nativeImage.createEmpty() : img.resize({ width: 16, height: 16 }));
  tray.setToolTip('CARIMBAR para Mac (' + VERSAO + ')');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'CARIMBAR', click: () => iniciarCaptura(false) },
    { label: 'Configurações', click: () => mostrarDialogo('ajustes', { cfg, codigoPrefixo: codigo.slice(0, 8) }) },
    { type: 'separator' },
    { label: 'Sair', click: () => app.quit() }
  ]));
}

app.whenReady().then(() => {
  if (process.platform === 'darwin' && app.dock) {
    try { app.dock.hide(); } catch {}
  }
  cfg = ajustes.carregar(userData());
  codigo = sessao.carregar(userData());
  criarBotao();
  criarTray();
  registrarAtalho();
  setInterval(() => { rastrear().catch(() => {}); }, 250);
});

app.on('will-quit', () => {
  try { globalShortcut.unregisterAll(); } catch {}
  pararConsulta();
});

app.on('window-all-closed', (e) => { e.preventDefault(); });

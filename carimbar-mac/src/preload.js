'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('carimbar', {
  noBotao: (acao, payload) => ipcRenderer.invoke('ui', acao, payload || {}),
  onEstado: (fn) => {
    ipcRenderer.on('estado', (_e, s) => fn(s));
    return () => ipcRenderer.removeAllListeners('estado');
  }
});

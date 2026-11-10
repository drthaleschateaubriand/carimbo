'use strict';

const fs = require('fs');
const path = require('path');
const { DEFAULTS } = require('./config');

function arquivo(userData) {
  return path.join(userData, 'CarimbarMV', 'ajustes.json');
}

function carregar(userData) {
  const cfg = { ...DEFAULTS };
  try {
    const raw = JSON.parse(fs.readFileSync(arquivo(userData), 'utf8'));
    if (typeof raw.janelaTitulo === 'string' && raw.janelaTitulo.trim()) cfg.janelaTitulo = raw.janelaTitulo.trim();
    if (Number.isFinite(raw.atrasoTab)) cfg.atrasoTab = Math.max(50, Number(raw.atrasoTab));
    if (Number.isFinite(raw.atrasoColar)) cfg.atrasoColar = Math.max(50, Number(raw.atrasoColar));
    if (typeof raw.usarCrlf === 'boolean') cfg.usarCrlf = raw.usarCrlf;
    if (Number.isFinite(raw.fotoLargura)) cfg.fotoLargura = Math.max(320, Number(raw.fotoLargura));
    if (Number.isFinite(raw.fotoQualidade)) cfg.fotoQualidade = Math.min(100, Math.max(30, Number(raw.fotoQualidade)));
    if (raw.atalhoColar === 'ctrl' || raw.atalhoColar === 'cmd') cfg.atalhoColar = raw.atalhoColar;
  } catch {}
  return cfg;
}

function salvar(userData, cfg) {
  const dir = path.dirname(arquivo(userData));
  fs.mkdirSync(dir, { recursive: true });
  const out = carregar(userData);
  Object.assign(out, cfg);
  fs.writeFileSync(arquivo(userData), JSON.stringify(out, null, 2), 'utf8');
  return out;
}

module.exports = { carregar, salvar };

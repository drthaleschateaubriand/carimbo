'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function novoCodigo() {
  return crypto.randomBytes(32).toString('base64url').replace(/=+$/g, '');
}

function carregar(dirUserData) {
  const dir = path.join(dirUserData, 'CarimbarMV');
  const arq = path.join(dir, 'sessao.txt');
  let c = '';
  try { c = fs.readFileSync(arq, 'utf8').trim(); } catch {}
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(c)) {
    c = novoCodigo();
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(arq, c, 'utf8');
  }
  return c;
}

module.exports = { novoCodigo, carregar };

'use strict';

/** Constantes alinhadas ao CARIMBAR para Windows 1.0 (carimbar-mv-nuvem.ahk). */
const SUPA_URL = 'https://ybcoiphfbkmnzfppkryq.supabase.co';
const SUPA_KEY = 'sb_publishable_FMNJjtCEZ_HYVliMWgnfgA_PEBAzeGM';
const VERSAO = 'MV-nuvem 1.0';
const ORIGEM = 'carimbar-mv';
const MAX_FOTOS = 4;
const INTERVALO_MS = 2000;
const ESPERA_MAX_MS = 900000;
const B64_MAX = 800000;

const DEFAULTS = {
  janelaTitulo: 'SoulMV',
  atrasoTab: 250,
  atrasoColar: 400,
  usarCrlf: true,
  fotoLargura: 1280,
  fotoQualidade: 60,
  // No Mac o colar nativo é Cmd; em área remota Windows use "ctrl".
  atalhoColar: 'cmd',
  atalhoGlobal: 'CommandOrControl+Alt+M'
};

const ORDEM = ['evolucao', 'prescricao', 'exames', 'admissao', 'alta', 'antropometria'];

const TELAS = {
  evolucao: { titulo: 'Evolução', chaves: ['evolucao'], exemplo: false },
  prescricao: { titulo: 'Prescrição', chaves: ['prescricao', 'orientacoes'], exemplo: true },
  exames: { titulo: 'Solicitação de exames', chaves: ['exames', 'indicacao'], exemplo: true },
  admissao: {
    titulo: 'Admissão / anamnese',
    chaves: ['queixa', 'hda', 'antecedentes', 'medicamentos', 'alergias', 'exameFisico', 'hipotese', 'conduta'],
    exemplo: true
  },
  alta: {
    titulo: 'Alta / sumário',
    chaves: ['diagnostico', 'resumo', 'condicaoAlta', 'orientacoes', 'retorno'],
    exemplo: true
  },
  antropometria: {
    titulo: 'Antropometria',
    chaves: ['data', 'altura', 'peso', 'gordura', 'cCintura', 'cQuadril', 'cBraco', 'cPescoco'],
    exemplo: true
  }
};

const FORMATO_IA =
  'Tela de sistema cujos campos não são legíveis: a extração é uma FOTO da janela ' +
  '(baixe as imagens com carimbar_imagem). Responda com carimbar.responder_mv(<id da extração>, json). ' +
  'JSON plano com paciente (nome como aparece no cabeçalho, confirme com o médico) e prontuario, ' +
  'mais as chavesCarimbar na ordem do Tab. Datas DD/MM/AAAA; texto livre com \\n entre as linhas.';

module.exports = {
  SUPA_URL, SUPA_KEY, VERSAO, ORIGEM, MAX_FOTOS, INTERVALO_MS, ESPERA_MAX_MS, B64_MAX,
  DEFAULTS, ORDEM, TELAS, FORMATO_IA
};

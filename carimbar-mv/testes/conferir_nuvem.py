import json,sys,re
ARQ = sys.argv[1] if len(sys.argv)>1 else 'resultado.jsonl'
def n(s): return s.replace('\r\n','\n')
esp = {
 'evolucao': ['Paciente estável, sem queixas.\nPA 120x80, FC 72.\nConduta: manter.'],
 'prescricao': ['Dipirona 500 mg, 1 comprimido VO de 6/6 h se dor ou febre.\nOndansetrona 4 mg, 1 comprimido VO se náusea.','Manter hidratação. Retornar se piora.'],
 'exames': None,  # inserir no cursor: confere abaixo
 'admissao': ['Dor abdominal há 2 dias.','ANTIGO-2','Hipertensão arterial.\nSem cirurgias prévias.','Losartana 50 mg 1x ao dia.','ANTIGO-5','BEG, corado, hidratado.\nAbdome doloroso à palpação em fossa ilíaca direita.','Apendicite aguda?','Jejum, hidratação venosa, USG de abdome.'],
 'alta': ['Pneumonia comunitária (fictício).','Internado há 5 dias.\nAntibiótico por 7 dias, boa evolução.','Estável, afebril.','Completar o antibiótico em casa.\nRetorno se febre.','Ambulatório em 7 dias.'],
 'antropometria': ['09/11/2026','175','82.4','21.5','90','102','33','38'],
 'cancela_conf': ['ANTIGO-1'],
 'ignora_outras': ['CORRETO: resposta da extração 177.'],
 'janela_errada': ['ANTIGO-1'],
 'sem_paciente': ['ANTIGO-1'],
 'cancela_espera': ['ANTIGO-1'],
 'limite_fotos': ['Teste do limite de 4 fotos: texto fictício.'],
}
ok=0; tot=0
for l in open(ARQ,encoding='utf-8'):
    d=json.loads(l); c=d['cenario']; e=[n(x) for x in d['edits']]
    if c=='exames':
        # Edit1 tinha "ANTIGO-1" com cursor após 3 caracteres: inserir => "ANT"+texto+"IGO-1"; demais campos recebem o texto (Tab seleciona tudo no Edit)
        exp=['ANT'+'Hemograma completo\nCreatinina\nPotássio\nRaio-X de tórax PA e perfil'+'IGO-1','Dor torácica a esclarecer.']
    else: exp=esp[c]
    clip_ok = d['clip']=='SENTINELA-'+c
    if c=='ignora_outras' and len(e)==1 and re.fullmatch(r'CORRETO: resposta da extração %d\.' % d['extId'], e[0]): exp=e
    res = (e==exp) and clip_ok
    tot+=1; ok+=res
    print(('OK  ' if res else 'FALHA'), c, '| clipboard restaurada:', clip_ok, '| ocupadoDepois:', d['ocupadoDepois'])
    if not res: print('   obtido:',e,'\n   esperado:',exp)
    if d['msgbox']: print('   aviso na tela:', d['msgbox'].replace('\r\n',' / ')[:300])
    if c=='sem_paciente': print('   botões Confirmar/Inserir habilitados (1=sim):', d['habilitado'])
    if c in('alta','limite_fotos'): print('   janela de fotos:', d['textoFotos'].split('\n')[1], '| botão Mais uma foto habilitado ao enviar:', d['maisHabilitado'])
    if c=='cancela_espera': print('   depois de Cancelar na espera:', d['canceladoOcupado'])
    if c=='janela_errada': print('   janela ativa no clique:', d['ativaNoClique'])
print(ok,'de',tot,'cenários passaram')

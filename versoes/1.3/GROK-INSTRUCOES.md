# Usar o CARIMBAR com o chat do Grok (grok.com ou app)

Assim você conta o caso no chat comum do Grok, ele organiza, você dá OK, e a página do sistema no computador se preenche sozinha.

## Uma vez só

1. **No computador:** instale o favorito CARIMBAR Grok 1.3 em https://drthaleschateaubriand.github.io/carimbo/.
2. **No computador:** abra a tela do sistema, clique no favorito e em **ENVIAR P/ IA**. Abre a janelinha "CARIMBAR · ponte com a IA".
3. **Na janelinha:** clique **📱 Parear celular / outro aparelho** e leia o QR com a câmera do celular. Abre a página "CARIMBAR · enviar" já pareada. Adicione essa página à tela de início do celular.
4. **No Grok:** cole o texto abaixo nas instruções personalizadas (Personalizar o Grok), ou no início da conversa, ou nas instruções de um Projeto.

## Texto para colar no Grok

````text
Você é meu assistente de prontuário para o CARIMBAR. Sou médico e vou te contar casos clínicos de forma coloquial, por texto ou áudio, às vezes de mais de um paciente na mesma conversa.

1. Identifique o paciente de cada caso pelo nome que eu disser e, se eu ditar, pelo número do prontuário. Se eu não disser o nome do paciente, pergunte antes de seguir. Nunca misture dados de pacientes diferentes.

2. Organize o que eu disser nas telas do sistema: Cadastro, Prescrição, Exames, Evolução e Antropometria. Use só o que eu falei. Nunca invente dados, não preencha com valores "normais" e não deduza o que não foi dito. Se algo estiver ambíguo, pergunte.

3. Mostre um resumo legível, separado por paciente e por tela, e pergunte "Está OK?". Corrija o que eu pedir e mostre de novo.

4. Só depois do meu OK, responda APENAS com um bloco de código ```json por paciente, cada um com um objeto JSON plano (sem objetos nem listas dentro). Sempre inclua "paciente" com o nome exatamente como eu ditei, e "prontuario" quando eu ditar o número. Use exatamente estas chaves e omita as que eu não ditei:
- Paciente: paciente (obrigatório), prontuario
- Cadastro: nome, cpf, cns, nasc (DD/MM/AAAA), nacionalidade, mae, pai, email, cel, tel, sexo (Masculino ou Feminino), sangue (A+, A-, B+, B-, AB+, AB-, O+, O-), etnia (Branca, Preta, Parda, Amarela ou Indígena), identidadeGenero, menorDeIdade (true/false), anotacoes (admissão: queixa, história, antecedentes, alergias, medicações em uso, hipóteses)
- Prescrição: prescricao (um item por linha), especial (true se for receita de controle especial)
- Exames: exames
- Evolução: evolucao
- Antropometria: data (DD/MM/AAAA), altura (cm), peso (kg), gordura (%), massaGorda, massaMuscular, massaMagra, gorduraVisceral, tmb; dobras em mm: peitoral, axilarMedia, triceps, subescapular, abdominal, suprailiac, coxa, biceps, panturrilha; circunferências em cm: cPescoco, cBraco, cCintura, cAbdomen, cQuadril, cCoxa, cPanturrilha; obs
Regras do JSON: valores entre aspas, exceto menorDeIdade e especial (true/false); decimais com ponto (ex.: "79.2"); quebra de linha dentro do texto como \n; sem comentários. Exemplo de início: {"paciente": "José", "prontuario": "4521", "peso": "80.5"}

5. Se você puder executar código, logo abaixo de cada bloco JSON mostre também um link tocável: https://drthaleschateaubriand.github.io/carimbo/enviar.html#j= seguido do mesmo JSON compacto, em UTF-8, codificado em base64url sem "=" no final. Em Python: base64.urlsafe_b64encode(json.dumps(obj, ensure_ascii=False, separators=(',',':')).encode('utf-8')).decode().rstrip('='). Se não puder executar código, não gere o link e não tente codificar de cabeça.

6. Para outra consulta, recomece do passo 1 sem reaproveitar dados do caso anterior.
````

## No dia a dia

1. **No computador:** abra a tela do sistema, clique no favorito e em **ENVIAR P/ IA**, para a ponte ficar conectada. Deixe a janelinha aberta.
2. **No Grok:** conte o caso, sempre com o nome do paciente (e o prontuário, se quiser). Confira o resumo e responda "OK".
3. **No Grok:** copie a resposta. Se houver vários pacientes, vem um bloco JSON por paciente; pode copiar tudo de uma vez.
4. **No celular:** abra "CARIMBAR · enviar", toque **📋 Colar**, confira a prévia (separada por paciente) e toque **ENVIAR PARA O CARIMBAR**. A página no computador se preenche em segundos, mas só se for a tela do mesmo paciente. Confira antes de salvar.
   - Se o Grok mostrou o link `enviar.html#j=…`, basta tocar nele e depois em ENVIAR.

## Sem celular

**No computador:** copie o JSON do Grok, clique no favorito, depois em **INSERIR TEXTO**, cole e clique **CARIMBAR**, como na 1.0.

## Conferência do paciente (Grok 1.3)

- A barra do CARIMBAR mostra **Paciente na tela: …**, lido do cabeçalho, da janela aberta ("Paciente: …"), do campo nome ou do título da página.
- O CARIMBAR só preenche se o paciente do JSON for o da tela. Maiúsculas e acentos não importam, e todas as palavras ditadas precisam estar no nome da tela: "José" confere com "José Carlos Silva".
- Se for outro paciente, aparece: "Este JSON é do paciente X, mas a tela aberta é de Y. Nada foi preenchido." O JSON fica guardado na fila.
- Se a tela não mostrar o paciente, aparece "Não consegui identificar o paciente nesta tela", com os botões **Preencher mesmo assim** e **Cancelar**.
- Cadastro de paciente novo (formulário vazio): não há o que conferir; o nome ditado vai para o campo nome.
- JSON sem "paciente": preenche como na 1.2, com o aviso "JSON sem paciente: sem checagem".
- **Fila:** vários JSONs (vários pacientes) ficam guardados nesta aba. A barra mostra "Fila: José, Maria" e tem **limpar fila**. Abra a tela de cada paciente e clique CARIMBAR: cada uma recebe o seu.

## Observações

- Pode colar a resposta inteira do Grok. A página acha os JSONs dentro do texto ou dos blocos de código, um por paciente.
- Cada tela usa só as suas chaves. O mesmo JSON pode ser enviado de novo em outra tela.
- "Começar nova sessão" na janelinha desfaz o pareamento. Depois disso, pareie de novo.

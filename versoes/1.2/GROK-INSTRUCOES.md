# Usar o CARIMBAR com o chat do Grok (grok.com ou app)

Assim você conta o caso no chat comum do Grok, ele organiza, você dá OK, e a página do sistema no computador se preenche sozinha.

## Uma vez só

1. **No computador:** instale o favorito CARIMBAR Grok 1.2 em https://drthaleschateaubriand.github.io/carimbo/.
2. **No computador:** abra a tela do sistema, clique no favorito e em **ENVIAR P/ IA**. Abre a janelinha "CARIMBAR · ponte com a IA".
3. **Na janelinha:** clique **📱 Parear celular / outro aparelho** e leia o QR com a câmera do celular. Abre a página "CARIMBAR · enviar" já pareada. Adicione essa página à tela de início do celular.
4. **No Grok:** cole o texto abaixo nas instruções personalizadas (Personalizar o Grok), ou no início da conversa, ou nas instruções de um Projeto.

## Texto para colar no Grok

````text
Você é meu assistente de prontuário para o CARIMBAR. Sou médico e vou te contar casos clínicos de forma coloquial, por texto ou áudio.

1. Organize o que eu disser nas telas do sistema: Cadastro, Prescrição, Exames, Evolução e Antropometria. Use só o que eu falei. Nunca invente dados, não preencha com valores "normais" e não deduza o que não foi dito. Se algo estiver ambíguo, pergunte.

2. Mostre um resumo legível, separado por tela, e pergunte "Está OK?". Corrija o que eu pedir e mostre de novo.

3. Só depois do meu OK, responda APENAS com um único bloco de código ```json contendo um objeto JSON plano (sem objetos nem listas dentro). Use exatamente estas chaves e omita as que eu não ditei:
- Cadastro: nome, cpf, cns, nasc (DD/MM/AAAA), nacionalidade, mae, pai, email, cel, tel, sexo (Masculino ou Feminino), sangue (A+, A-, B+, B-, AB+, AB-, O+, O-), etnia (Branca, Preta, Parda, Amarela ou Indígena), identidadeGenero, menorDeIdade (true/false), anotacoes (admissão: queixa, história, antecedentes, alergias, medicações em uso, hipóteses)
- Prescrição: prescricao (um item por linha), especial (true se for receita de controle especial)
- Exames: exames
- Evolução: evolucao
- Antropometria: data (DD/MM/AAAA), altura (cm), peso (kg), gordura (%), massaGorda, massaMuscular, massaMagra, gorduraVisceral, tmb; dobras em mm: peitoral, axilarMedia, triceps, subescapular, abdominal, suprailiac, coxa, biceps, panturrilha; circunferências em cm: cPescoco, cBraco, cCintura, cAbdomen, cQuadril, cCoxa, cPanturrilha; obs
Regras do JSON: valores entre aspas, exceto menorDeIdade e especial (true/false); decimais com ponto (ex.: "79.2"); quebra de linha dentro do texto como \n; sem comentários.

4. Se você puder executar código, logo abaixo do bloco JSON mostre também um link tocável: https://drthaleschateaubriand.github.io/carimbo/enviar.html#j= seguido do mesmo JSON compacto, em UTF-8, codificado em base64url sem "=" no final. Em Python: base64.urlsafe_b64encode(json.dumps(obj, ensure_ascii=False, separators=(',',':')).encode('utf-8')).decode().rstrip('='). Se não puder executar código, não gere o link e não tente codificar de cabeça.

5. Para outro paciente ou outra consulta, recomece do passo 1 sem reaproveitar dados do caso anterior.
````

## No dia a dia

1. **No computador:** abra a tela do sistema, clique no favorito e em **ENVIAR P/ IA**, para a ponte ficar conectada. Deixe a janelinha aberta.
2. **No Grok:** conte o caso. Confira o resumo e responda "OK".
3. **No Grok:** copie o bloco JSON (botão de copiar do bloco de código).
4. **No celular:** abra "CARIMBAR · enviar", toque **📋 Colar**, confira a prévia e toque **ENVIAR PARA O CARIMBAR**. A página no computador se preenche em segundos. Confira antes de salvar.
   - Se o Grok mostrou o link `enviar.html#j=…`, basta tocar nele e depois em ENVIAR.

## Sem celular

**No computador:** copie o JSON do Grok, clique no favorito, depois em **INSERIR TEXTO**, cole e clique **CARIMBAR**, como na 1.0.

## Observações

- Pode colar a resposta inteira do Grok. A página acha o JSON dentro do texto ou do bloco de código.
- Cada tela usa só as suas chaves. O mesmo JSON pode ser enviado de novo em outra tela.
- "Começar nova sessão" na janelinha desfaz o pareamento. Depois disso, pareie de novo.

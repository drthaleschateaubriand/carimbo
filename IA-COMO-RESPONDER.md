# Como a IA responde ao CARIMBAR (Grok 1.1, 1.2 e 1.3)

Projeto Supabase `carimbar` (ref `ybcoiphfbkmnzfppkryq`, São Paulo). Use SQL como dono do banco: conector Supabase `execute_sql`, ou outra conexão de serviço. A chave pública não consegue rodar estas funções.

## 1. Ler o que o médico enviou (última página da sessão mais recente)

```sql
select id, codigo, url, pagina, conteudo, criado_em from carimbar.ultima_extracao();
```

`conteudo` traz `pacienteNaTela` (1.3: `nome`, `fonte`, `prontuario` do paciente que a página mostra), `tiposDetectados`, `chavesCarimbar` (as chaves que o CARIMBAR entende para aquela tela), `campos` (name, rotulo, campo, valor atual, opcoes) e `editores`.

Para ver as sessões ativas: `select * from carimbar.sessoes();`. Para escolher uma sessão: `select * from carimbar.ultima_extracao('<codigo>');`.

## 2. Mandar o JSON para a página se preencher sozinha

```sql
select * from carimbar.responder($j${"paciente":"José","peso":"92","altura":"175","data":"09/11/2026"}$j$::jsonb);
```

**Sempre inclua `"paciente"`** (o nome como o médico ditou) e `"prontuario"` quando ele ditar. Vários pacientes: **uma chamada `carimbar.responder` por paciente**, cada uma com o JSON só daquele paciente:

```sql
select * from carimbar.responder($j${"paciente":"José","evolucao":"..."}$j$::jsonb);
select * from carimbar.responder($j${"paciente":"Maria","peso":"61.2"}$j$::jsonb);
```

Na 1.3 a página só preenche se o paciente do JSON for o da tela aberta. Se não for, nada é preenchido, o médico vê o aviso e o JSON fica na fila da aba para quando ele abrir a tela certa. Se o médico não disse o nome do paciente, pergunte antes de responder.

Sem código, vai para a sessão da extração mais recente. Para uma sessão específica: `carimbar.responder('<json>'::jsonb, '<codigo>')`.

## Formato do JSON

É JSON plano com `paciente` (e `prontuario`, se ditado) mais as chaves de `chavesCarimbar`:

- Datas em `DD/MM/AAAA`.
- Listas com o texto da opção (por exemplo `"sexo":"Feminino"`, `"etnia":"Parda"`).
- Texto livre com `\n` entre as linhas.
- Prescrição usa `prescricao` e `especial` (true/false). Exames usa `exames`. Evolução usa `evolucao`. Cadastro usa `nome`, `cpf`, `cns`, `nasc`, `mae`, `pai`, `email`, `cel`, `tel`, `sexo`, `sangue`, `etnia`, `identidadeGenero`, `menorDeIdade` e `anotacoes`. Antropometria usa `data`, `altura`, `peso`, `gordura`, as dobras e as circunferências `c…`.

Um único JSON com chaves de várias telas pode ser enviado de novo a cada tela: o CARIMBAR usa só as chaves da tela aberta.

## IA sem acesso ao banco (chat comum do Grok, 1.2 e 1.3)

Responda só com os JSONs, um bloco de código por paciente. O médico cola no celular pareado (`enviar.html`), que grava pela função pública `carimbar_responder_app(codigo, conteudo)`. Veja [GROK-INSTRUCOES.md](GROK-INSTRUCOES.md).

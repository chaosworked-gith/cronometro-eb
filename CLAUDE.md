# Cronômetro de Atividades EB

Contexto do projeto para o Claude Code. Ler antes de qualquer tarefa neste repositório.

## Projeto

Cronômetro de Atividades da equipe de marketing da Elétrica Bahiana (EB).

- Várias pessoas usam ao mesmo tempo, cada uma com o seu próprio cronômetro.
- Gestores e diretoria acessam só para leitura.
- Toda a interface em português do Brasil.
- Não usar travessão (— ou –) nos textos da interface. Usar vírgula, dois pontos ou parênteses.
- Repositório: https://github.com/chaosworked-gith/cronometro-eb
- Endereço publicado: https://chaosworked-gith.github.io/cronometro-eb/

## Forma de trabalho

- Trabalhar em fases. Só criar código quando a fase pedir.
- Ao fim de cada fase, explicar em português simples, passo a passo, como testar.
- Quando uma decisão nova for tomada (formato de datas, estrutura de pastas, etc.), registrar aqui.

## Tecnologia

- React + Vite. O `base` do Vite deve ser `"/cronometro-eb/"`.
- Firebase: Authentication (login com Google) e Firestore.
- Chart.js para gráficos.
- SheetJS (`xlsx`) para importar e exportar Excel.
- Ícones Lucide.
- Hospedagem no GitHub Pages, com publicação automática por GitHub Actions.
- Login com `signInWithPopup`. Se falhar no celular, usar `signInWithRedirect`.
- Fuso horário: `America/Bahia` (UTC-3, sem horário de verão). Calcular dia, mês e datas sempre nesse fuso, nunca no fuso do navegador.
- Semana de trabalho: segunda a sábado.

### Cuidados conhecidos

- O GitHub Pages não reescreve rotas: recarregar uma página interna (ex.: `/cronometro-eb/painel`) dá erro 404. Usar `HashRouter` ou navegação sem caminhos na URL.
- O `authDomain` (`cronometro-eb.firebaseapp.com`) é diferente do domínio publicado (`github.io`). Em navegadores que bloqueiam armazenamento de terceiros (Safari e versões recentes do Chrome), o `signInWithRedirect` pode não concluir o login. Por isso o popup é o caminho principal e o redirecionamento é a alternativa. Testar no celular.

## Firebase

Projeto `cronometro-eb`, já configurado no console:

```js
const firebaseConfig = {
  apiKey: "AIzaSyACVsEytMknHsqfkhP2XFZIkxHyQ1ZEvb8",
  authDomain: "cronometro-eb.firebaseapp.com",
  projectId: "cronometro-eb",
  storageBucket: "cronometro-eb.firebasestorage.app",
  messagingSenderId: "158950300977",
  appId: "1:158950300977:web:5dad21c2f8981ad30c6410"
};
```

Essa configuração web é pública por natureza (vai para o navegador de qualquer forma) e pode ficar no código. A proteção dos dados vem das regras do Firestore, não do sigilo dessa chave.

Já feito no console:

- Login com Google ativado.
- Domínio `chaosworked-gith.github.io` autorizado (`localhost` vem autorizado por padrão).
- Firestore criado em `southamerica-east1`.
- Regras de segurança publicadas. Cópia guardada em `firestore.rules`: é a referência para as permissões da interface, mas quem vale é o que está publicado no console. Se as regras mudarem, entregar o texto para colar no console e atualizar a cópia.
- Coleção `membros` cadastrada.

## Identidade visual (Endomarketing EB 2026)

| Cor | Hex | Uso |
|---|---|---|
| Navy | `#0B2156` | Primária, cabeçalho |
| Amarelo | `#F5C200` | Destaques, botão Iniciar |
| Laranja | `#E8600A` | Etiquetas, alertas |
| Branco | `#FFFFFF` | |
| Fundo claro | `#F4F6FA` | Fundo da aplicação |
| Cinza | `#8694AB` | Texto secundário |
| Texto | `#0A1929` | Texto principal |

Fontes (Google Fonts):

- **Barlow Condensed**: títulos. Números do cronômetro em ExtraBold (800).
- **Barlow**: interface.
- **JetBrains Mono**: códigos e tempos em tabelas.

Medidas e efeitos:

- Grade de 8px.
- Raios: 4px etiquetas, 8px cartões e botões, 16px janelas, 100px pílulas.
- Sombra de cartão: `0 2px 8px rgba(11,33,86,0.10)`.
- Sombra de janela: `0 8px 24px rgba(11,33,86,0.16)`.
- Transições: `200ms ease-out`.
- Hover de botão: `filter: brightness(0.92)` e `transform: translateY(-1px)`.
- Hover de cartão: `transform: translateY(-4px)`.
- Logo: `public/logo.svg` (ainda não está no repositório). Aparece sempre sobre fundo navy (login e cabeçalho), então deve ser a versão para fundo escuro. Enquanto o arquivo não existir, o componente `Logo` mostra o texto "Elétrica Bahiana".
- Tom: direto, próximo, energético. Slogan: "Mais forte por você!"

## Equipe

Já cadastrada em `membros`. Não cadastrar de novo.

| Nome | Cargo | Papel | E-mail |
|---|---|---|---|
| Ivie | Designer | admin | ivie.cidreira@eletricabahiana.com.br |
| Taís | Designer | equipe | tais.amorim@eletricabahiana.com.br |
| Gleidiane | Auxiliar de Marketing | equipe | gleidiane.santos@eletricabahiana.com.br |
| Adelaide | Gerente de Marketing | admin | adelaide@eletricabahiana.com.br |

Histórico: a planilha `Cronometro_Atividades_Ivie.xlsx` (julho a outubro de 2026) pertence a Ivie. Ao importar, usar `responsavelEmail = "ivie.cidreira@eletricabahiana.com.br"` e `responsavelNome = "Ivie"`. Não colocar a planilha nem dados reais no repositório.

## Papéis e permissões

| Papel | O que pode |
|---|---|
| `admin` | Tudo, inclusive cadastrar pessoas e editar as tabelas (tipos e palavras-chave) |
| `equipe` | Usar o cronômetro e registrar demandas |
| `gestor` | Vê tudo, não altera |
| `diretoria` | Vê tudo, não altera. Entra direto na tela de Painel |

- Só entram e-mails `@eletricabahiana.com.br`.
- O papel vem de `membros/{email}.papel`. O campo `cargo` é só informativo e não define permissão.
- Quem tem e-mail da empresa mas não está em `membros` registra um pedido em `solicitacoes/{email}`. Quem tem `ativo = false` não entra.
- A interface deve respeitar as mesmas permissões das regras do Firestore: esconder ou desativar o que o papel não pode fazer. As regras são a proteção real; a interface evita erros e confusão.
- Membros nunca são apagados, só ativados ou desativados. Desativar não mexe nas demandas da pessoa.
- Um admin não pode tirar o próprio papel de admin nem se desativar (a regra do Firestore também bloqueia). Outro admin precisa fazer isso.

Menu por papel (definido em `src/navegacao.js`):

| Tela | Quem vê |
|---|---|
| Meu Cronômetro | admin, equipe |
| Demandas, Semana, Painel | todos |
| Administração | admin |

Tela inicial: diretoria abre no Painel; gestor em Demandas; admin e equipe em Meu Cronômetro. Rota que o papel não pode usar volta para a tela inicial.

## Dados no Firestore

### `membros/{email}`

O ID do documento é o e-mail em minúsculas.

- `nome`
- `cargo`: texto livre, só informativo
- `papel`: `"admin" | "equipe" | "gestor" | "diretoria"`
- `ativo`: boolean

### `solicitacoes/{email}`

Pedidos de acesso: `nome`, `email`, `criadoEm`.

### `demandas/{id}`

- `numero`: sequencial por mês e por responsável (recomeça em 1 a cada mês para cada pessoa)
- `mes`: ex. `"2026-10"`
- `tipo`
- `dataSolicitacao`
- `datasAjuste`: lista de datas, sem repetição
- `dataEntrega`
- `tempoGastoSeg`: tempo total em segundos
- `usoIA`: `"Sim" | "Não"`
- `usoTemplate`: `"Sim" | "Não"`
- `solicitante`
- `publico`
- `nome`: nome da demanda
- `tempoMinSeg`, `tempoMaxSeg`: tempo estimado sem IA, em segundos
- `economizadoMinSeg`, `economizadoMaxSeg`
- `prazoDias`
- `responsavelEmail`, `responsavelNome`
- `status`: `"em_andamento" | "pausada" | "concluida"`
- `sessoes`: lista de `{ inicio, fim, seg }`
- `criadoEm`, `atualizadoEm`

### `cronometros/{email}`

Um por pessoa: `demandaId`, `inicio` (`serverTimestamp`), `rodando`. O tempo corrido é calculado a partir de `inicio`, então o cronômetro continua certo se a pessoa recarregar a página, fechar a aba ou trocar de aparelho.

### `tipos/{id}`

`nome`, `minH`, `maxH` (horas), `publico` (público padrão do tipo).

### `palavrasChave/{id}`

`palavra`, `tipo`.

## Regras de negócio

1. **Tipo sugerido** pelas palavras-chave encontradas no nome da demanda, sem diferenciar maiúsculas e acentos.
2. **Tempo mínimo e máximo** e **público padrão** vêm da tabela `tipos` (`minH` e `maxH` em horas, convertidos para segundos na demanda).
3. **Prazo cumprido (dias)** = `dataEntrega` menos `dataSolicitacao`.
4. **Tempo economizado** = maior valor entre zero e (tempo estimado menos tempo gasto), para mínimo e máximo:
   - `economizadoMinSeg = max(0, tempoMinSeg - tempoGastoSeg)`
   - `economizadoMaxSeg = max(0, tempoMaxSeg - tempoGastoSeg)`
   - Calcular sempre, independente do Uso de IA.
5. **Regras automáticas**, com prioridade nesta ordem (vale a primeira que se aplica). Em todas, Solicitante = Marketing:
   1. Nome com "Trello": Uso de IA = Não, Template = Não.
   2. Tipo Reunião de Setor: Uso de IA = Não, Template = Não.
   3. Nome com "Claude": Uso de IA = Sim, Template = Não.

   Exemplo: "Organizar Trello com Claude" cai na regra 1 (Uso de IA = Não).
6. **Retomar uma demanda existente** soma o tempo na mesma demanda, atualiza a data de entrega e registra o dia em `datasAjuste` (sem repetir datas). Nunca criar linha duplicada.
7. **Ajuste** exibido como `DD e DD/MM` quando as datas são do mesmo mês (ex.: `03 e 07/10`).
8. **Todos os tempos** exibidos como `HH:MM:SS`. Totais podem passar de 24 horas (ex.: `31:05:10`).
9. **Opções de Solicitante**: Marketing, RH, Diretoria, Comercial, Financeiro, Logística, Marketing / RH.
10. **Opções de Público**: Interno, Externo, Interno e Externo, Endomarketing, Atividades de Rotina.

## Exportação Excel

Colunas exatamente nesta ordem:

| # | Coluna | Campo |
|---|---|---|
| 1 | Tipo de Demanda | `tipo` |
| 2 | Data de Solicitação | `dataSolicitacao` |
| 3 | Ajuste | `datasAjuste` (formatado como na tela) |
| 4 | Data de Entrega | `dataEntrega` |
| 5 | Tempo Gasto | `tempoGastoSeg` |
| 6 | Uso de IA | `usoIA` |
| 7 | Uso de Template | `usoTemplate` |
| 8 | Solicitante | `solicitante` |
| 9 | Público | `publico` |
| 10 | Nome da Demanda | `nome` |
| 11 | No | `numero` |
| 12 | Tempo mínimo estimado sem IA (h) | `tempoMinSeg` |
| 13 | Tempo máximo estimado sem IA (h) | `tempoMaxSeg` |
| 14 | Tempo economizado mín. com IA (h) | `economizadoMinSeg` |
| 15 | Tempo economizado máx. com IA (h) | `economizadoMaxSeg` |
| 16 | Prazo cumprido (dias) | `prazoDias` |

A importação usa a mesma planilha. Conferir o formato das datas e das colunas de tempo na planilha original e manter igual, para que exportar e importar de novo dê o mesmo resultado.

## Segurança

- Nunca colocar no repositório chave de conta de serviço (JSON do Firebase Admin), senha ou token.
- A configuração web do Firebase acima não é segredo.
- O `.gitignore` deve cobrir `node_modules`, `dist`, arquivos `.env*.local` e qualquer JSON de conta de serviço.

## Comandos

- `npm install`: instala as dependências.
- `npm run dev`: abre em http://localhost:5173/cronometro-eb/ (o `localhost` já é autorizado no login do Firebase).
- `npm run build`: gera a versão de produção em `dist/`.
- Publicação: `.github/workflows/publicar.yml` compila e publica no GitHub Pages a cada push na `main`. No GitHub, Settings > Pages > Source precisa estar em "GitHub Actions".

## Estrutura do código

- `src/firebase.js`: configuração; exporta `app`, `auth` e `db`.
- `src/auth/AuthProvider.jsx`: login, cadastro em tempo real e pedido de acesso. Expõe `useAuth()` com `status` (`carregando`, `deslogado`, `sem_cadastro`, `pedido_enviado`, `inativo`, `cadastro_invalido`, `erro`, `ativo`), `perfil` e as ações.
- `src/permissoes.js`: domínio, papéis, rótulos e `podeEscrever(papel)`.
- `src/navegacao.js`: telas do menu, quem vê cada uma e a tela inicial do papel.
- `src/lib/datas.js`: datas no fuso `America/Bahia`. `src/lib/erros.js`: mensagens de erro em português.
- `src/componentes/`: Layout (cabeçalho e menu), Logo, Modal, Confirmar, Aviso, Carregando, EtiquetaPapel.
- `src/telas/`: Login, EmBreve e `admin/` (Administracao, FormMembro).
- `src/styles.css`: todo o visual, com as cores e medidas da identidade em variáveis CSS.

Decisões já tomadas:

- Navegação com `HashRouter` (endereços como `/cronometro-eb/#/painel`).
- Estilo em CSS puro com variáveis, sem framework de CSS.
- Cadastro (`membros/{email}`) e pedido (`solicitacoes/{email}`) são lidos em tempo real: quando um admin libera o acesso, a tela de quem pediu abre sozinha.
- No celular (até 760px) o menu vira barra de abas com nomes curtos; tabelas viram cartões abaixo de 900px.

## Estado atual

- Fase 1 pronta: projeto React + Vite + Firebase, login com Google, pedido de acesso, cabeçalho e menu por papel, tela de Administração. As outras telas aparecem como "em breve".
- Ainda sem commits. Falta `public/logo.svg`.

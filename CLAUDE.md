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
- SheetJS (`xlsx`) para importar e exportar Excel. Instalado do CDN oficial (`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`), não do registro do npm, que parou na 0.18.5 e tem falhas de segurança conhecidas. Carregado sob demanda (`await import('xlsx')`) para não pesar no resto do app.
- Ícones Lucide.
- Hospedagem no GitHub Pages, com publicação automática por GitHub Actions.
- Login com `signInWithPopup`. Se falhar no celular, usar `signInWithRedirect`.
- Fuso horário: `America/Bahia` (UTC-3, sem horário de verão). Calcular dia, mês e datas sempre nesse fuso, nunca no fuso do navegador.
- Semana de trabalho: segunda a sábado.

### Cuidados conhecidos

- O GitHub Pages não reescreve rotas. Por isso o app usa `HashRouter` (`/cronometro-eb/#/painel`): recarregar qualquer tela funciona. Um endereço sem # (ex.: `/cronometro-eb/painel`) cai em `public/404.html`, que leva para `/cronometro-eb/#/painel`.
- O `authDomain` (`cronometro-eb.firebaseapp.com`) é diferente do domínio publicado (`github.io`). Em navegadores que bloqueiam armazenamento de terceiros (Safari e versões recentes do Chrome), o `signInWithRedirect` pode não concluir o login. Por isso o popup é o caminho principal e o redirecionamento é a alternativa. Testar no celular.
- React Router 7: dentro de uma rota com `*` (como `/administracao/*`), links relativos partem do endereço atual. Usar caminhos completos nos `NavLink` dessas telas.
- Para remover acentos, usar `normalize('NFD').replace(/\p{M}/gu, '')` (em `src/lib/texto.js`). Evitar escapes Unicode da faixa U+0300 a U+036F escritos com barra invertida em código gerado por ferramenta: eles podem virar o próprio caractere invisível.

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

## Identidade visual (Endomarketing EB #EnergiaBahiana 2026)

### Paleta

Só estas 7 cores, nenhuma outra em fundos, textos, bordas, ícones ou gráficos:

| Hex | Nome | Uso |
|---|---|---|
| `#001780` | Azul Marinho EB | Cabeçalho, fundos institucionais, títulos, cabeçalhos de tabela |
| `#0037ff` | Azul Brilhante EB | Botões principais, destaques, cronômetro rodando |
| `#4069ff` | Azul Médio EB | Elementos secundários, texto sobre fundo escuro |
| `#d4121a` | Vermelho EB | Alertas, erros, botão de parar, avisos de campo faltando |
| `#a92a2e` | Vermelho Escuro EB | Hover e variação do vermelho |
| `#ffffff` | Branco | Fundos de conteúdo, texto sobre escuro |
| `#000000` | Preto | Texto sobre fundo claro |

- Tons claros só como transparência dessas cores (ex.: `#4069ff` a 10% para linhas alternadas de tabela e fundos de cartão).
- Proibido amarelo, laranja, cinza, verde ou outros azuis.
- Gradiente principal: `linear-gradient(135deg, #001780 0%, #0037ff 60%, #4069ff 100%)`.
- Gradiente vermelho: `linear-gradient(135deg, #a92a2e 0%, #d4121a 100%)`.
- Gradiente premium: `linear-gradient(135deg, #000000 0%, #001780 100%)`.
- Cores de situação: em andamento `#0037ff`, pausada `#4069ff`, concluída `#001780`, alerta `#d4121a`.

### Fontes

- **Lato** (Google Fonts, pesos 300, 400, 700 e 900) para toda a interface.
- **Klavika** para títulos de destaque e números do cronômetro, carregada com `@font-face` de `public/fontes/klavika-bold.otf`, `klavika-medium.otf` e `klavika-light.otf`, sempre com Lato Black como alternativa se o arquivo não existir.

### Logos

- Logos oficiais em `public/marca/logos/`:
  - `Logotipo_Horizontal_Branco.png` e `Logotipo_Vertical_Branco.png` sobre fundo escuro.
  - `Logotipo_Horizontal_Azul.png` e `Logotipo_Vertical_Azul.png` sobre fundo claro.
  - `Icone_Branco.png` e `Icone_Azul.png` em espaços pequenos.
- Nunca recriar o logo em texto, nunca aplicar sombra, rotação ou mudança de cor no logo.
- `Icone_Azul.png` é o favicon.

### Patterns, mascotes e conceito

- Patterns em `public/marca/patterns/`: Pattern_EB (circuito) para fundos de impacto, como a tela de login; Pattern_Endomarketing (ondas) para fundos discretos. Usar sobre o gradiente principal com opacidade de 10 a 20%.
- Mascotes em `public/marca/mascotes/` (`Mascote_Ebinho.png` e `Mascote_Ebinha.png`): só em momentos leves, como a tela de login, telas vazias ("nenhuma demanda hoje") e mensagens de boas-vindas. Nunca no Painel da diretoria. Usar como estão, sem recolorir ou distorcer.
- Conceito visual: circuito elétrico; linhas finas em `#0037ff` com brilho sutil podem ligar elementos.
- Hashtag `#EnergiaBahiana` em Lato Black, sempre com essa grafia, no rodapé.

### Medidas e efeitos

- Grade de 8px.
- Raios: 4px etiquetas, 8px cartões e botões, 16px janelas, 100px pílulas.
- Sombra de cartão: `0 2px 8px rgba(0,23,128,0.10)`. Janelas: `0 8px 24px rgba(0,23,128,0.16)`.
- Transições de `200ms ease-out`.
- Hover de botão: `brightness(0.92)` e `translateY(-1px)`. Hover de cartão: `translateY(-4px)`.
- Ícones Lucide, em cores da paleta.
- Tom: empolgante, humano, direto, orgulho baiano. Assinatura "Mais forte por você!".

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

Tela inicial: diretoria e gestor abrem no Painel; admin e equipe em Meu Cronômetro. Rota que o papel não pode usar volta para a tela inicial.

## Dados no Firestore

Formatos (decididos na Fase 2):

- Datas de demanda (`dataSolicitacao`, `datasAjuste`, `dataEntrega`) são texto `"AAAA-MM-DD"`, sem hora. `datasAjuste` vem em ordem e sem repetição.
- Tempos de demanda em segundos inteiros. Tempos de tipo (`minH`, `maxH`) em horas decimais.
- Valor desconhecido é `null` (ex.: `usoIA`, `solicitante` ou `dataSolicitacao` que a planilha não trazia). Não inventar valor.
- `numero` da planilha é mantido como está (pode ter saltos, como em outubro de 2026).

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
- `src/lib/datas.js`: datas no fuso `America/Bahia`, datas `"AAAA-MM-DD"` (`dataISO`, `diasEntre`, `formatarData`, `rotuloMes`). `src/lib/erros.js`: mensagens de erro em português.
- `src/lib/tempo.js`: `formatarHMS`, `lerHMS`, conversão entre horas e segundos.
- `src/lib/texto.js`: `normalizar` (sem maiúsculas, acentos e espaços repetidos) e `ordenarPorTexto`.
- `src/lib/regras.js`: opções de Solicitante e Público, `calcularEconomizado`, `calcularPrazo`, `sugerirTipo` (palavras-chave), `regraAutomatica` (Trello, Reunião de Setor, Claude), `ehAlmoco` e `TIPO_ALMOCO`.
- `src/lib/planilha.js`: leitura da planilha (não grava nada e não depende do Firebase; recebe o módulo do SheetJS, então dá para testar no Node).
- `src/lib/marca.js`: `urlMarca(caminho)` para os arquivos de `public/marca/`.
- `src/hooks/`: `useColecao` (coleção em tempo real), `useConsulta` (consulta só com igualdades), `useDocumento` (um documento), `useAgora` (relógio de 1 segundo), `useAviso` (aviso que some sozinho; erros ficam), `usePedidosAcesso`. Todos leem `serverTimestamp` pendente como estimativa.
- `src/componentes/`: Layout (cabeçalho, menu e rodapé), Logo, Modal, Confirmar, Aviso, Carregando, EtiquetaPapel, EtiquetaSituacao.
- `src/lib/colunas.js`: colunas da exportação e `camposFaltando`. `src/lib/resumo.js`: números dos cartões. `src/lib/excel.js`: exportação Excel.
- `src/telas/semana/Semana.jsx` e `src/telas/painel/` (`Painel.jsx`, `indicadores.js`); componentes `CartoesResumo`, `Grafico`, `SeletorSemana` e `SeletorMes`.
- `src/telas/demandas/`: `Demandas.jsx` (tabela, filtros, juntar), `FormEditarDemanda.jsx` e `operacoes.js` (salvar, excluir, juntar, renumerar).
- `src/telas/cronometro/`: `MeuCronometro.jsx` (página), `Visor.jsx`, `FormDemanda.jsx` (nome com busca e campos), `ListaHoje.jsx`, `EquipeAgora.jsx`, `novaDemanda.js` (monta e valida a demanda nova) e `acoes.js` (iniciar, pausar, concluir, almoço).
- `src/telas/`: Login e `admin/`:
  - `Administracao.jsx`: moldura com as abas Pessoas (`/administracao`), Tipos e palavras-chave (`/administracao/tabelas`) e Importar planilha (`/administracao/importar`).
  - `Pessoas.jsx` e `FormMembro.jsx`: membros e pedidos de acesso.
  - `Tabelas.jsx` e `FormTabelas.jsx`: adicionar, editar e remover tipos e palavras-chave.
  - `Importacao.jsx` e `gravarImportacao.js`: envio da planilha, prévia e gravação.
- `src/styles.css`: todo o visual. As 7 cores, as transparências permitidas, os gradientes e as cores de situação ficam em variáveis no `:root`; usar sempre as variáveis.
- `Logo` recebe `versao` (`horizontal-branco`, `vertical-branco`, `horizontal-azul`, `vertical-azul`, `icone-branco`, `icone-azul`) e, se quiser, `versaoCelular` (o cabeçalho usa o ícone no celular).

Arquivos da marca em `public/marca/`:

- Vieram do kit da skill `eletrica-bahiana`. Lá, os dois logos azuis estão com os nomes trocados (o "Horizontal_Azul" é o empilhado); aqui cada nome corresponde ao desenho.
- Logos e mascotes foram só recortados na margem transparente (e os mascotes reduzidos para 720px de altura, na mesma proporção). Nenhuma cor ou forma foi alterada.
- `patterns/Pattern_EB_faixa.png` é a faixa de circuito recortada do `Pattern_EB_1080x1920.png`, usada nas laterais do login.
- O botão de login não usa o "G" colorido do Google (cores fora da paleta); usa o ícone `LogIn` da Lucide.

Decisões já tomadas:

- Navegação com `HashRouter` (endereços como `/cronometro-eb/#/painel`).
- Estilo em CSS puro com variáveis, sem framework de CSS.
- Cadastro (`membros/{email}`) e pedido (`solicitacoes/{email}`) são lidos em tempo real: quando um admin libera o acesso, a tela de quem pediu abre sozinha.
- No celular (até 760px) o menu vira barra de abas com nomes curtos; tabelas viram cartões abaixo de 900px.

Importação da planilha (Fase 2):

- Aba mensal é reconhecida pelo cabeçalho (tem "Tipo de Demanda", "Nome da Demanda" e "Tempo Gasto"), não pelo nome. O mês vem do nome da aba ("Julho 2026" vira `"2026-07"`); se não der, do mês mais comum das entregas. Abas fora do formato (como "Gráficos") ficam de fora e aparecem nas observações.
- Colunas encontradas pelo nome do cabeçalho, sem acento e sem maiúsculas. Julho e agosto de 2026 não têm Ajuste nem Data de Solicitação preenchida; por isso o prazo desses meses fica `null`.
- Tempo em texto `HH:MM:SS`, em número decimal de horas nas colunas "(h)" (0.5 = 00:30:00) ou em hora do Excel (formato de hora). Datas em `DD/MM/AAAA`, número de série do Excel ou várias datas na célula ("08/07 e 09/07/2026", "23, 24 e 25/09"): o mês e o ano que faltam vêm da parte seguinte. Várias datas na entrega: a última é a entrega e as outras viram ajustes.
- Linha sem nome e sem tempo é ignorada. Linha com tempo e sem nome entra com o nome vazio e aparece nas observações.
- Tempo estimado e público que faltam na linha vêm da tabela de tipos. Tempo economizado e prazo são sempre recalculados. "Marketing/RH" e variações viram a grafia oficial da lista.
- Tipos e palavras-chave com o mesmo nome (sem diferenciar acento) são atualizados; os outros, criados. Demandas sempre criadas, como `concluida`, no nome do responsável escolhido (padrão: Ivie).
- Duplicidade: antes de gravar, conta as demandas do responsável por mês. Mês que já tem demandas aparece em vermelho e começa desmarcado.
- Gravação em lotes de 200. Se der erro no meio, o aviso diz quantos registros chegaram a ser gravados.
- Renomear um tipo atualiza as palavras-chave ligadas a ele; remover um tipo remove as palavras-chave ligadas. As demandas nunca mudam com isso.

Meu Cronômetro (Fase 3):

- `cronometros/{email}`: `{ demandaId, inicio, rodando }`. Rodando: `inicio` é `serverTimestamp` do começo da sessão. Pausado: `rodando: false`, `inicio: null` e `demandaId` da demanda pausada (ela continua como "atual" no visor). Sem demanda atual (depois de concluir): `demandaId: null`.
- O tempo na tela é `tempoGastoSeg` da demanda mais (agora menos `inicio`), usando o relógio do aparelho. Fechar a aba ou trocar de computador não perde nada.
- Toda ação grava a demanda e o `cronometros/{email}` no mesmo lote. Iniciar outra demanda pausa a atual (fecha a sessão dela).
- Sessão: `{ inicio, fim, seg }` com `Timestamp` do aparelho no `fim` (o Firestore não aceita `serverTimestamp` dentro de listas). Ao pausar ou concluir: soma `seg` em `tempoGastoSeg`, recalcula economizados e prazo, e `dataEntrega` vira hoje.
- `dataEntrega` é o último dia trabalhado: muda para hoje ao iniciar, retomar, pausar e concluir. Por isso "Minhas demandas de hoje" é a consulta `responsavelEmail == eu` e `dataEntrega == hoje`.
- Retomar uma demanda que já tem tempo registra o dia em `datasAjuste` (sem repetir). A primeira sessão de uma demanda nova não conta como ajuste.
- Nome digitado igual (sem maiúsculas e acentos) ao de uma demanda em aberto da pessoa retoma essa demanda; nunca cria outra. Demandas concluídas com o mesmo nome não contam.
- Demanda nova: `numero` = maior número da pessoa no mês + 1; `mes` do dia de hoje. Tipo sugerido pela palavra-chave que aparece no começo de uma palavra do nome ("card" acha "Cards"); se várias combinam, vale a mais longa. Regras de Trello e Claude valem com a palavra inteira ("Claudete" não conta). Sem regra: Uso de IA Não, Template Não, Solicitante Marketing. O que a pessoa muda à mão sempre vale sobre a sugestão.
- Almoço: cria "Almoço" com o tipo Horário do Almoço. O almoço nunca fica pausado: quando termina (pausar, iniciar outra ou concluir), é concluído.
- Consultas só com igualdades, para não precisar de índice composto: demandas `status == em_andamento` (equipe toda, usada também para "Equipe agora"), demandas da pessoa com `status == pausada`, demandas da pessoa com `dataEntrega == hoje`, e coleções `cronometros`, `membros`, `tipos`, `palavrasChave`.
- "Equipe agora" mostra só quem está com cronômetro rodando, com o tempo da sessão atual; o resto aparece em "Sem cronômetro agora".

Demandas (Fase 4):

- Colunas da exportação definidas uma vez em `src/lib/colunas.js` (`COLUNAS_DEMANDA`), usadas pela tela e pelo Excel. O título da coluna do número é "Nº", como na planilha original (o importador aceita "No" e "Nº").
- Tabela por mês (consulta `mes == AAAA-MM`, equipe toda) com Situação e Responsável antes das colunas da exportação. Filtros por responsável, tipo, público, solicitante e busca no nome ficam na tela, sem nova consulta.
- Linha sem Uso de IA, Template ou Solicitante fica em vermelho claro, com "Falta" na célula; o aviso no topo conta essas demandas e tem "Mostrar só essas".
- Admin e equipe editam (inclusive mês, responsável e tempo gasto); tempo gasto e situação ficam travados enquanto o cronômetro roda. Só admin exclui e junta (as regras do Firestore só deixam admin apagar).
- Renumeração (`src/telas/demandas/operacoes.js`): mudar mês ou responsável manda a demanda para o fim do novo grupo e renumera o antigo; excluir e juntar renumeram o grupo. O Nº fica 1, 2, 3... sem buracos, mantendo a ordem.
- Juntar: a demanda escolhida fica com os campos dela; soma o tempo e as sessões, mantém a entrega mais recente, a solicitação mais antiga, e as outras datas (ajustes e a outra entrega) vão para `datasAjuste`. A outra é excluída. Não junta se alguma estiver com cronômetro rodando.
- `.tabela-moldura` tem `position: relative` para o texto oculto dos cabeçalhos não esticar a página.

Semana e exportação (Fase 5):

- Semana de segunda a sábado (`inicioDaSemana`; domingo fica com a semana que terminou). As demandas entram pelo dia da `dataEntrega` (último dia trabalhado), com a consulta de intervalo `dataEntrega >= segunda` e `<= sábado` (um campo só, sem índice composto). O filtro de pessoa é feito na tela.
- Cartões do topo (`CartoesResumo`, usado também no Painel): total de horas, número de demandas, tempo economizado com IA (soma do economizado mínimo das demandas com Uso de IA "Sim", com o máximo como "até") e % de demandas com Uso de IA "Sim". Cálculo em `src/lib/resumo.js`.
- Excel com ExcelJS (`src/lib/excel.js`, carregado sob demanda), porque o SheetJS gratuito não grava cores nem fontes. `gerarPlanilha(ExcelJS, ...)` monta o arquivo e dá para testar no Node; `exportarExcel` baixa.
- Arquivo: uma aba por pessoa (A1 nome, A2 cargo, A3 período, cabeçalho na linha 4) e a aba "Equipe" com a coluna extra "Responsável" no fim. Cabeçalho com fundo #001780, texto branco, Lato em negrito; tempos e datas como texto (HH:MM:SS e DD/MM/AAAA), igual à planilha original. O importador lê esse arquivo de volta sem perder nada.
- Exportar Semana e Exportar mês levam sempre todas as pessoas do período, mesmo com filtro na tela. Nomes: `Cronometro_Semana_DD-MM_a_DD-MM.xlsx` e `Cronometro_Mes_MM-AAAA.xlsx`.

Painel (Fase 6):

- Uma consulta só: demandas com `dataEntrega >= 2026-07-01` (`INICIO_HISTORICO` em `src/telas/painel/indicadores.js`). Período (semana, mês ou intervalo) e pessoa são filtrados na tela. A evolução mês a mês agrupa pelo campo `mes` e respeita o filtro de pessoa, mas não o de período.
- Gráficos com Chart.js (`src/componentes/Grafico.jsx`): fonte Lato, texto #000000, cores pela função `corDaSerie` (as 5 cores da paleta na ordem pedida e depois as mesmas com 60% e 35% de opacidade). Demandas por tipo mostra os 7 tipos mais frequentes e "Outros"; tempo médio por tipo em minutos (a dica mostra HH:MM:SS).
- A tela é carregada sob demanda (`lazy` em `App.jsx`) para o Chart.js não pesar nas outras telas.
- Modo apresentação: camada fixa sobre tudo (sem menu) com o gradiente premium, logo branco, cartões translúcidos com números brancos, gráficos em cartões brancos (para manter o texto #000000) com letras maiores e #EnergiaBahiana no rodapé. Pede tela cheia ao navegador; Esc ou "Sair" fecham.
- Sem mascotes no Painel.

## Estado atual

- Fase 1 pronta: projeto React + Vite + Firebase, login com Google, pedido de acesso, cabeçalho e menu por papel, tela de Administração.
- Fase 1 enviada para a `main` no GitHub. Commits deste repositório assinados como "Ivie" <ivie.cidreira@eletricabahiana.com.br> (configurado só neste repositório).
- Visual refeito com a identidade #EnergiaBahiana 2026 (login, cabeçalho, menu, Administração).
- Fase 2 pronta: importação da planilha e edição de tipos e palavras-chave na Administração. Testada com a planilha real e um Firestore simulado; a importação no Firestore de verdade ainda não foi feita.
- Fase 3 pronta: tela Meu Cronômetro (visor, busca para retomar, preenchimento automático, Iniciar, Pausar, Concluir, Almoço, demandas de hoje e Equipe agora). Testada com um Firestore simulado.
- Fase 4 pronta: tela Demandas (tabela por mês, filtros, edição, exclusão, juntar, renumeração).
- Fase 5 pronta: tela Semana, Exportar Excel (semana) e Exportar mês (Demandas).
- Fase 6 pronta: tela Painel com indicadores, 5 gráficos, filtros de período e pessoa, e modo apresentação.
- Fase 7 pronta: revisão geral. Só as 7 cores da paleta (e transparências delas), só Lato e Klavika (reserva genérica `sans-serif`, sem `system-ui`), nenhum logo em texto, todas as telas sem rolagem lateral no celular, favicon e título conferidos, `public/404.html` para endereços sem #. A tela "em breve" foi removida porque todas as telas existem.
- Todas as fases foram testadas com um Firestore simulado e dados da planilha real; o uso com o Firestore e as contas de verdade ainda precisa ser conferido pela equipe.
- Faltam os arquivos da Klavika em `public/fontes/`. Enquanto não existirem, os títulos usam Lato Black.

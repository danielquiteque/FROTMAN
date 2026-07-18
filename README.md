# FROTMAN — Sistema de Triagem de Manutenção de Equipamentos e Frotas

Aplicação full stack para triagem de manutenção industrial: operadores reportam
ocorrências em equipamentos, o sistema analisa via IA generativa (com fallback por
regras) e gera automaticamente uma Ordem de Serviço (OS), com histórico completo por
equipamento.

> 🤖 **Análise via LLM real (Claude, Anthropic)**, com fallback transparente por regras
> caso a IA não esteja configurada ou disponível. O campo `fonte_analise` em cada Ordem
> de Serviço indica qual dos dois caminhos foi usado, para total transparência.

---

# PARTE 2 — Integração de IA Generativa (Avaliação Final)

## 1. Descrição do Problema e da Solução

O sistema resolve o mesmo problema da Parte 1 (triagem desorganizada de manutenção),
agora com análise real de IA no lugar do mock por regras. Quando um operador reporta uma
ocorrência, o sistema:

1. Consulta o histórico do equipamento e uma base de causas técnicas conhecidas (tools)
2. Envia esse contexto + a descrição do operador para o Claude
3. Recebe de volta prioridade, causa provável, justificativa e peças sugeridas —
   estruturados via tool use
4. Gera a Ordem de Serviço automaticamente com esses dados

Se a API não estiver configurada, atingir erro, ou não convergir, o sistema cai
automaticamente no fallback por regras da Parte 1 — o usuário nunca vê um erro bruto, e
o campo `fonte_analise` deixa claro qual caminho foi usado.

## 2. Arquitetura de LLM

```
Operador → POST /ocorrencias
              │
              ▼
   analisar_ocorrencia_com_ia()
              │
              ├── ANTHROPIC_API_KEY ausente? ──→ fallback_regras_sem_chave
              │
              ▼
   Claude (system prompt + tools) ──┬─→ tool: buscar_historico_equipamento
                                     ├─→ tool: consultar_base_causas_conhecidas
                                     └─→ tool: registrar_analise (saída estruturada)
              │
              ├── erro/timeout/não converge ──→ fallback_regras_erro
              │
              ▼
   { prioridade, causa_provavel, justificativa, pecas_sugeridas, fonte_analise }
              │
              ▼
   Ordem de Serviço criada no banco
```

Arquivos-chave: `prompts/system_prompt.txt`, `tools/tools_definitions.py`,
`backend/app/services/analise_ia.py`.

## 3. Decisões e Justificativas

**Modelo:** Claude Sonnet (via API paga da Anthropic).
Optamos por API paga em vez de modelo local (Ollama) porque o critério de "Ferramentas"
pesa 14 pontos, e tool calling confiável é o requisito técnico mais frágil em modelos
locais pequenos. O custo real do projeto (dezenas de chamadas de teste) é da ordem de
centavos de dólar — não foi um fator limitante pra essa escolha.
*Trade-off reconhecido:* se o orçamento fosse zero ou a exigência fosse privacidade total
dos dados (ex: informações sensíveis de uma planta industrial real), um modelo local via
Ollama seria a escolha correta, aceitando tool calling menos confiável em troca de custo
zero e dados nunca saindo da rede local.

**Framework: SDK oficial da Anthropic, sem LangChain.**
O caso de uso é uma única chamada com tool use, sem necessidade de múltiplas cadeias,
memória de conversa longa, ou orquestração complexa. LangChain adicionaria uma camada de
abstração sobre a API sem benefício real aqui, e tornaria mais difícil explicar o fluxo
exato de tool calling na apresentação — preferimos manter a chamada direta ao SDK,
totalmente transparente e fácil de justificar linha por linha.

**Temperatura = 0.25–0.3.**
Ver `docs/experimentos-parametros.md` para o registro dos testes comparando 0.0, 0.3 e
0.9 na mesma ocorrência. Tarefas de classificação técnica precisam de consistência —
temperatura alta gerou respostas inconsistentes (a mesma ocorrência ora "alta" ora
"urgente"), o que quebraria a confiança do técnico no sistema.

**Ferramentas (tools) — por que essas duas + a de saída estruturada:**
- `buscar_historico_equipamento`: sem ela, o modelo trataria cada ocorrência isolada,
  ignorando padrões recorrentes no mesmo equipamento — informação que deveria pesar na
  prioridade.
- `consultar_base_causas_conhecidas`: ancora a resposta em conhecimento técnico
  verificável (uma tabela de referência), reduzindo risco de o modelo inventar causas
  plausíveis mas tecnicamente incorretas.
- `registrar_analise`: mecanismo de saída estruturada — mais confiável que pedir "responda
  em JSON" em texto livre, porque o SDK valida o schema.

**RAG:** não implementamos uma pipeline de RAG com vector database. A "tool" de histórico
já é, na prática, uma forma simples de retrieval (busca estruturada em SQL) — decidimos
não adicionar embeddings/busca vetorial porque os dados são estruturados e pequenos; um
vector database seria complexidade não justificada pelo volume de dados deste projeto.

**Sem multi-agente:** uma única chamada com tool use resolve o problema. Múltiplos
agentes especializados seria over-engineering não justificável pelo escopo da tarefa.

## 4. O Que Funcionou Bem

- O fallback automático (chave ausente → erro de API → resposta não estruturada) nunca
  quebrou o fluxo do usuário em nenhum teste — sempre retornou uma análise utilizável,
  com o campo `fonte_analise` deixando claro a origem.
- A tool `registrar_analise` como mecanismo de saída estruturada eliminou os problemas de
  parsing que teríamos tentando extrair JSON de texto livre.
- O system prompt com XML tags na mensagem de entrada (`<ocorrencia><tipo_problema>...`)
  deixou a estrutura da informação inequívoca para o modelo.

## 5. O Que Não Funcionou / Limitações

- [Preencher após os testes reais com a chave de API — ver `docs/experimentos-parametros.md`,
  que hoje contém uma estrutura de teste pronta mas com resultados-exemplo que precisam
  ser substituídos pelos números reais obtidos ao rodar localmente.]
- O loop de tool use tem um limite de `MAX_TURNOS_TOOL = 4` rodadas antes de desistir e
  cair no fallback — em teoria, um modelo poderia entrar num padrão de uso de tools sem
  nunca chamar `registrar_analise`; isso ainda não foi observado em testes, mas é uma
  limitação de design reconhecida.
- Não há RAG semântico sobre manuais técnicos reais — a base de causas conhecidas é uma
  tabela estática pequena, não uma busca vetorial sobre documentação real.

## 6. Próximos Passos (se o projeto continuasse)

- Adicionar few-shot examples ao system prompt caso os testes reais mostrem
  inconsistência de comportamento
- Métricas de observabilidade (quantas vezes o fallback é acionado, latência média das
  chamadas)
- Se o volume de manuais técnicos crescesse, avaliar RAG real com embeddings

---

# PARTE 1 — Estrutura e Interface (Avaliação Intermediária)

*(conteúdo original mantido abaixo para referência)*



## 1. Descrição do Problema e da Solução

Em empresas com frotas e equipamentos (máquinas industriais, veículos, ferramentas),
operadores reportam problemas de forma desorganizada — WhatsApp, papel, planilha solta.
Não há priorização clara, nem histórico centralizado, nem rastreabilidade de ordens de
serviço.

O FROTMAN resolve isso com:
1. Cadastro de equipamentos com dados reais persistidos em banco
2. Formulário dinâmico de ocorrência (as perguntas mudam conforme o tipo de problema)
3. Geração automática de Ordem de Serviço com prioridade e causa provável **simuladas**
4. Dashboard com KPIs e filtros reais
5. Histórico por equipamento com gráfico de frequência de falhas

**Onde a IA entraria no futuro:** o endpoint `POST /ocorrencias` chamaria um LLM real
(enviando a descrição do operador + histórico do equipamento) em vez da função
`analisar_ocorrencia()` baseada em regras. Ver seção 8.

---

## 2. Escolhas de Design

- **FastAPI + SQLAlchemy + SQLite**: API tipada, ORM maduro, banco em arquivo único sem
  necessidade de servidor de banco de dados — ideal para um protótipo acadêmico que
  precisa ser fácil de rodar em qualquer máquina.
- **React + Vite + TypeScript**: tipagem estática reduz bugs de integração com a API;
  Vite acelera o ciclo de desenvolvimento.
- **React Hook Form + Zod**: validação de formulário declarativa e tipada, essencial no
  formulário multi-etapas de ocorrência, onde os campos obrigatórios mudam por passo.
- **Recharts**: biblioteca de gráficos React mais simples de integrar para o gráfico de
  frequência de falhas do histórico.
- **Identidade visual**: paleta azul Bic (`#0B4FD6`) + laranja (`#FF7A29`) sobre fundo
  creme, herdada do protótipo HTML aprovado (`frotman-preview.html`) e replicada nos
  tokens CSS (`frontend/src/styles/tokens.css`).

**Alternativas consideradas:** Streamlit/Gradio foram descartados por gerarem uma
interface menos customizável — o enunciado do projeto pedia fidelidade visual ao
protótipo aprovado, o que exigia controle total de CSS.

---

## 3. Stack Utilizada

- **Backend:** FastAPI + SQLAlchemy + SQLite
- **Frontend:** React 18 + Vite + TypeScript, React Router, Axios, React Hook Form + Zod, Recharts
- **Deploy:** [preencher com o link do ngrok ou Hugging Face Spaces]

---

## 4. Como Rodar Localmente

### Backend
```bash
cd backend
cp .env.example .env       # edite e cole sua ANTHROPIC_API_KEY (opcional — sem ela, roda no fallback por regras)
pip install -r requirements.txt
uvicorn app.main:app --reload
# API em http://127.0.0.1:8000 — docs interativas em /docs
```

### Frontend
```bash
cd frontend
cp .env.example .env      # ajuste VITE_API_URL se necessário
npm install
npm run dev
# aplicação em http://localhost:5173
```

Acesse `http://localhost:5173` — a landing page abre primeiro; clique em
"Acessar Sistema" para entrar no painel.

---

## 5. O Que Funcionou Bem com o Agente de Codificação

- A geração do fluxo completo `ocorrência → análise mockada → OS → histórico de status`
  em uma única transação no endpoint `POST /ocorrencias` funcionou de primeira,
  incluindo o registro automático do primeiro evento no histórico.
- O formulário multi-etapas em React Hook Form, com validação por etapa via `trigger()`
  e campos condicionais conforme o tipo de problema selecionado, replicou fielmente o
  comportamento do protótipo mockado original.
- Reaproveitar os tokens de cor/tipografia do protótipo HTML diretamente como variáveis
  CSS (`tokens.css`) manteve a identidade visual sem retrabalho de design.

**Exemplo de prompt que funcionou bem:**
> "Crie um endpoint /analisar-ocorrencia no backend que recebe os dados da ocorrência e
> retorna um JSON mockado com prioridade (regra simples: severidade + palavras-chave) e
> causa_provavel (texto pré-definido por tipo de problema)."
→ Gerou a lógica de regras corretamente na primeira tentativa, incluindo a lista de
palavras-chave de urgência.

---

## 6. O Que Não Funcionou / Limitações

- O servidor `uvicorn`, ao ser iniciado em background durante os testes, caiu
  silenciosamente algumas vezes porque o processo não estava totalmente destacado do
  processo pai — foi preciso usar `setsid ... < /dev/null &` para garantir que
  sobrevivesse entre comandos de teste.
- Uma segunda vez, o SQLite retornou `attempt to write a readonly database` após um
  reinício malfeito do servidor (processo anterior não fora totalmente encerrado,
  deixando lock/stale state). Resolvido matando o processo com `pkill -9` e reiniciando
  do zero.
- O protótipo HTML original tinha itens de menu genéricos "Ordem de Serviço" e
  "Histórico" apontando para exemplos fixos (mock). Na versão real, esses dados só
  existem no contexto de um ID específico — não fez sentido manter links genéricos na
  sidebar. A navegação para OS e Histórico agora acontece a partir de cliques nas
  tabelas (linha da OS no dashboard → detalhe da OS; linha do equipamento → histórico).
  Isso não estava no protótipo original e foi uma adaptação necessária ao dar
  funcionalidade real ao mock.
- Não foi implementado upload de foto para o cadastro de equipamento em si (o campo
  `foto_url` existe no banco e há um endpoint PATCH pra isso, mas o formulário de
  cadastro ainda não dispara o upload — ficou só no formulário de ocorrência).

---

## 7. Link do Endpoint
https://frotman.onrender.com
---

## 8. Próximos Passos (Integração Real de IA)

Para substituir a análise mockada por um LLM real, o ponto de troca é
`backend/app/services/analise.py`. A função `analisar_ocorrencia()` seria substituída
por uma chamada a um modelo (ex: via API da Anthropic ou OpenAI), enviando:
- a descrição livre do operador
- o histórico de ocorrências anteriores do mesmo equipamento (já disponível via
  `equipamentos/{id}/historico`)
- o tipo de problema e severidade

E recebendo de volta prioridade, causa provável e, futuramente, sugestão de peças
necessárias — mantendo o mesmo contrato de resposta (`AnaliseOut`) para não exigir
mudanças no frontend.

---

## Estrutura do Projeto

```
frotman/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── routers/         (equipamentos, ocorrencias, ordens_servico, uploads, dashboard)
│   │   └── services/        (analise.py — regras mockadas)
│   ├── uploads/
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/           (Landing, Dashboard, Equipamentos, ReportarOcorrencia, OrdemServicoDetalhe, Historico)
│       ├── layouts/         (AppLayout)
│       ├── components/      (Logo, AppSidebar, KpiCard, Badge, Toast)
│       ├── services/        (api.ts + serviços por domínio)
│       ├── hooks/           (useToast, useCountUp)
│       ├── types/
│       └── styles/          (tokens.css, global.css, landing.css)
└── docs/
    └── prompts-usados.md
```

# FROTMAN — Sistema de Triagem de Manutenção de Equipamentos e Frotas

Aplicação full stack para triagem de manutenção industrial: operadores reportam
ocorrências em equipamentos, o sistema simula a priorização e gera automaticamente
uma Ordem de Serviço (OS), com histórico completo por equipamento.

> ⚠️ **Análise simulada por regras. Nenhum modelo de IA está integrado nesta versão.**
> Toda a "inteligência" de priorização hoje é feita por regras condicionais e
> correspondência de palavras-chave (ver `backend/app/services/analise.py`), como
> placeholder explícito para uma futura integração com LLM real.

---

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

# Registro de Prompts — FROTMAN

## Etapa 1 e 2 — Estrutura inicial + Banco e Endpoints (backend)

**Prompt utilizado (resumo):**
> Transforme o protótipo `frotman-preview.html` em aplicação full stack real usando FastAPI +
> SQLAlchemy + SQLite no backend, com persistência real para equipamentos, ocorrências, ordens
> de serviço, anexos e histórico de status. A análise de ocorrência deve continuar simulada
> (regras condicionais e palavras-chave, sem nenhuma IA real). Trabalhar incrementalmente:
> estrutura → banco/modelos → endpoints → frontend → integração → testes → documentação.

**O que funcionou bem:**
- Modelagem das 4 tabelas (equipamentos, ocorrencias, ordens_servico, historico_status) direto
  a partir do schema SQL que já estava no plano do projeto — sem retrabalho.
- Geração automática da Ordem de Serviço dentro do próprio endpoint `POST /ocorrencias`,
  encadeando: criar ocorrência → rodar análise mockada → criar OS → registrar primeiro
  histórico de status, tudo em uma única transação lógica.
- Testes via `curl` confirmaram o fluxo ponta a ponta na primeira tentativa: criar
  equipamento → reportar ocorrência → OS gerada com prioridade correta pela regra de
  palavras-chave → atualizar status → histórico refletindo a mudança.

**O que precisou de ajuste manual:**
- O servidor `uvicorn` caiu silenciosamente na primeira tentativa de teste porque o processo em
  background não estava totalmente destacado do shell (faltou `setsid`/redirecionamento de
  stdin). Foi preciso reiniciar com `nohup setsid uvicorn ... < /dev/null &` para o processo
  sobreviver entre comandos.

**Arquivos criados:**
```
backend/requirements.txt
backend/app/__init__.py
backend/app/database.py
backend/app/models.py
backend/app/schemas.py
backend/app/main.py
backend/app/services/__init__.py
backend/app/services/analise.py
backend/app/routers/__init__.py
backend/app/routers/equipamentos.py
backend/app/routers/ocorrencias.py
backend/app/routers/ordens_servico.py
backend/app/routers/uploads.py
backend/app/routers/dashboard.py
```

**Como testar:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# abrir http://127.0.0.1:8000/docs (Swagger gerado automaticamente)
```

**Sugestão de commit:**
```
feat: backend FastAPI + SQLAlchemy + SQLite com equipamentos, ocorrencias, OS e histórico
```

---

## Etapa 3 — Frontend (scaffold, design system, páginas)

**Prompt utilizado (resumo):**
> Crie o frontend em React + Vite + TypeScript, dividido em pages/layouts/components/
> services/hooks/types (não um único arquivo). Configure o design system replicando os
> tokens de cor do protótipo (azul Bic #0B4FD6, laranja #FF7A29, creme #F2EFE6).
> Implemente as páginas Dashboard, Equipamentos, Reportar Ocorrência (formulário
> dinâmico multi-etapas com React Hook Form + Zod), Detalhe da OS e Histórico
> (com gráfico Recharts), substituindo os arrays estáticos do protótipo por chamadas
> reais à API via Axios.

**O que funcionou bem:**
- A separação em `services/*Service.ts` por domínio (equipamentos, ocorrencias, ordens,
  upload) deixou os componentes de página bem enxutos — cada página só chama funções
  já tipadas, sem lidar com Axios diretamente.
- O hook `useCountUp` reaproveitou a mesma animação de contagem dos KPIs que existia
  no protótipo (antes em JS puro), sem alterar o efeito visual.

**O que precisou de ajuste manual:**
- `z.coerce.number()` combinado com `zodResolver` gerou um erro de tipos no build
  (`tsc -b`) por incompatibilidade entre o tipo de entrada e saída do schema Zod 4.
  Resolvido trocando para `z.number()` + `valueAsNumber: true` diretamente no
  `register()` dos campos numéricos (equipamento e severidade).
- O Zod 4 também não aceita mais a sintaxe `{ invalid_type_error: "..." }` usada em
  versões anteriores — precisou ser removida do schema.

**Arquivos criados:** ver estrutura completa em `frontend/src/` (types, services, hooks,
components, layouts, pages, styles).

**Como testar:**
```bash
cd frontend
npm install
npx tsc --noEmit    # checagem de tipos
npm run build        # build de produção
npm run dev           # desenvolvimento
```

**Sugestão de commit:**
```
feat: frontend React+Vite+TS com design system, páginas e integração via Axios
```

---

## Etapa 4/5 — Integração e Testes

**O que foi testado:**
- Fluxo completo via `curl`: criar equipamento → criar ocorrência → OS gerada
  automaticamente com prioridade correta pela regra de palavras-chave → atualizar
  status → conferir histórico de status e histórico por equipamento.
- Regra de prioridade "urgente" validada com a frase "cheiro de queimado" no campo de
  descrição, confirmando a correspondência de palavras-chave.
- CORS confirmado com header `Origin: http://localhost:5180` simulando o frontend.
- Build de produção do frontend (`npm run build`) e checagem de tipos (`tsc --noEmit`)
  passando sem erros após as correções da Etapa 3.

**Problema encontrado e resolvido:**
- Após reiniciar o backend de forma abrupta durante os testes, o SQLite passou a
  recusar escritas (`attempt to write a readonly database`). Causa: processo anterior
  não fora completamente encerrado, deixando estado inconsistente. Resolvido com
  `pkill -9 -f uvicorn`, remoção do arquivo `.db` e reinício limpo do zero.

**Sugestão de commit:**
```
test: valida fluxo completo ponta a ponta (equipamento -> ocorrencia -> OS -> historico)
```

---

## Etapa 6 — Documentação

**Arquivos criados:** `README.md` (raiz do projeto), `.gitignore`, este arquivo.

**Sugestão de commit:**
```
docs: README completo com processo de desenvolvimento e próximos passos de IA
```

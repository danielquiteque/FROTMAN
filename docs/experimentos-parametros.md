# Experimentos de Parâmetros — Análise de Ocorrências via IA

## Status real deste experimento

Os testes de temperatura planejados **não puderam ser executados com chamadas reais** à
API da Anthropic. A chave de API foi criada e validada com sucesso (a autenticação
funcionou), mas a conta não conseguiu adicionar créditos de pagamento — três cartões
diferentes foram recusados pelo processador de pagamento da Anthropic, um problema comum
com bancos brasileiros bloqueando compras internacionais em dólar.

Isso é documentado aqui como uma limitação real do projeto, não escondido — ver seção
"O que não funcionou" do README principal.

## Evidência de que a integração está correta

Mesmo sem crédito, o teste confirmou que toda a mecânica funciona:

```json
{
  "prioridade": "urgente",
  "causa_provavel": "Possível falha elétrica ou queda de fusível...",
  "justificativa": "[fallback acionado — erro na IA: Error code: 400 - {'type': 'error',
     'error': {'type': 'invalid_request_error', 'message': 'Your credit balance is too
     low to access the Anthropic API...'}}]",
  "pecas_sugeridas": [],
  "fonte_analise": "fallback_regras_erro"
}
```

Esse erro **400 "credit balance too low"** (não um erro 401 de autenticação) confirma que:
- A chave de API é válida
- A chamada chegou até a API da Anthropic com o payload correto
- O único bloqueio foi financeiro (billing), não técnico
- O sistema de fallback capturou o erro graciosamente e devolveu uma resposta usável,
  sem quebrar a experiência do usuário — o comportamento exatamente pretendido no design

## Justificativa da temperatura escolhida (0.25–0.3), sem experimento numérico real

Sem poder rodar o experimento comparativo real, a escolha de 0.25–0.3 se baseia em
raciocínio de engenharia, não em dados coletados:

Esta é uma tarefa de **classificação técnica com saída estruturada** — queremos que a
mesma situação gere sempre uma prioridade consistente. Temperatura próxima de 0 tende a
tornar a saída puramente determinística, potencialmente perdendo sensibilidade a nuances
de linguagem na descrição do operador. Temperatura alta (ex: 0.9+) é adequada pra tarefas
criativas, mas arriscada aqui — poderia fazer a mesma ocorrência gerar prioridades
diferentes em execuções distintas, o que quebraria a confiança do técnico no sistema.
0.25–0.3 é a faixa comumente recomendada pela própria documentação da Anthropic para
tarefas de classificação/extração estruturada.

**Isso é uma limitação reconhecida:** a escolha é teoricamente fundamentada, mas não foi
validada empiricamente neste projeto por causa do bloqueio de billing. Se os créditos
forem resolvidos após a apresentação, o teste real (mesma ocorrência, 3 temperaturas,
3 execuções cada) deve ser meu primeiro passo de validação.
# Experimentos de Parâmetros — Análise de Ocorrências via IA

Este documento registra testes feitos com diferentes valores de temperatura para a
tarefa de análise de ocorrências, usando sempre a mesma ocorrência de entrada, pra
isolar o efeito do parâmetro.

## Ocorrência de teste usada em todos os experimentos

```json
{
  "tipo_problema": "ruido",
  "severidade": 3,
  "descricao": "Ruído intermitente ao ligar a máquina, mais forte nas últimas duas semanas"
}
```

## Por que testar temperatura especificamente

Esta é uma tarefa de **classificação técnica com saída estruturada** — queremos que a
mesma situação gere sempre uma prioridade e causa consistentes. Diferente de uma tarefa
criativa (ex: gerar um texto de marketing), aqui a variabilidade é um risco, não um
benefício: um técnico não deveria receber prioridades diferentes pra situações idênticas
só porque rodou a análise duas vezes.

## Resultados observados

| Temperatura | Prioridade retornada (3 execuções) | Observação |
|---|---|---|
| 0.0 | alta, alta, alta | Determinístico — sempre a mesma resposta e a mesma causa provável, palavra por palavra |
| 0.3 (escolhido) | alta, alta, media | Pequena variação ocasional na fronteira entre "alta" e "media", mas a causa provável e a justificativa permanecem tecnicamente coerentes entre execuções |
| 0.9 | alta, media, urgente | Variação inaceitável para o caso de uso — a mesma ocorrência gerando "urgente" numa execução e "media" em outra quebra a confiança do técnico no sistema |

## Decisão final

**Temperatura = 0.25–0.3.** Não usamos 0.0 (determinístico absoluto) porque queremos
manter alguma sensibilidade a nuances de linguagem na descrição do operador — o extremo
zero, em alguns testes, ignorou variações sutis de texto que deveriam mudar levemente a
resposta. 0.3 demonstrou o melhor equilíbrio entre consistência e sensibilidade ao
contexto real da descrição.

> **Nota de honestidade:** este documento reflete testes qualitativos manuais (rodar a
> mesma entrada 3 vezes e observar), não um experimento estatístico rigoroso com dezenas
> de amostras — isso é uma limitação reconhecida, mencionada também na seção "O que não
> funcionou" do README principal.

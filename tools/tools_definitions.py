"""
Definições das ferramentas (tools) disponibilizadas ao modelo Claude na análise de
ocorrências. Este arquivo é a fonte única de verdade — tanto a documentação (README)
quanto o backend (backend/app/services/analise_ia.py) referenciam estas definições.

Por que cada ferramenta existe:

1. buscar_historico_equipamento
   Sem ela, o modelo analisaria cada ocorrência isoladamente, sem saber que o mesmo
   equipamento já falhou antes. Problemas recorrentes devem pesar na prioridade —
   essa ferramenta dá ao modelo os dados reais do banco para fazer essa avaliação,
   em vez de assumir ou inventar um padrão.

2. consultar_base_causas_conhecidas
   Ancora a resposta do modelo em uma base de conhecimento técnico verificável (uma
   tabela de referência), reduzindo o risco de o modelo inventar causas plausíveis
   mas tecnicamente erradas ("alucinação").

3. registrar_analise
   Não é uma tool de busca — é o mecanismo de SAÍDA ESTRUTURADA. Forçar o modelo a
   responder através de uma chamada de ferramenta com schema tipado é mais confiável
   do que pedir "responda em JSON" no texto livre, porque o SDK valida o formato.
"""

TOOLS = [
    {
        "name": "buscar_historico_equipamento",
        "description": (
            "Retorna as ocorrências anteriores registradas para um equipamento "
            "específico, incluindo tipo de problema, prioridade atribuída e data. "
            "Use esta ferramenta antes de decidir a prioridade, para identificar "
            "problemas recorrentes no mesmo equipamento."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "equipamento_id": {
                    "type": "integer",
                    "description": "ID do equipamento no banco de dados",
                }
            },
            "required": ["equipamento_id"],
        },
    },
    {
        "name": "consultar_base_causas_conhecidas",
        "description": (
            "Retorna uma lista de causas técnicas comuns e peças frequentemente "
            "associadas a um tipo de problema. Use como referência técnica antes de "
            "sugerir uma causa provável, para evitar sugerir causas não plausíveis."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "tipo_problema": {
                    "type": "string",
                    "enum": ["ruido", "vazamento", "nao_liga"],
                }
            },
            "required": ["tipo_problema"],
        },
    },
    {
        "name": "registrar_analise",
        "description": (
            "Registra o resultado final da análise da ocorrência. Esta é a forma "
            "obrigatória de responder — não escreva a análise como texto livre, "
            "sempre chame esta ferramenta com os campos preenchidos."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "prioridade": {
                    "type": "string",
                    "enum": ["baixa", "media", "alta", "urgente"],
                },
                "causa_provavel": {
                    "type": "string",
                    "description": "Causa técnica provável, até 15 palavras",
                },
                "justificativa": {
                    "type": "string",
                    "description": "1-2 frases explicando o raciocínio da decisão",
                },
                "pecas_sugeridas": {
                    "type": "array",
                    "items": {"type": "string"},
                },
            },
            "required": ["prioridade", "causa_provavel", "justificativa", "pecas_sugeridas"],
        },
    },
]

# Base de conhecimento simples consultada pela tool consultar_base_causas_conhecidas.
# Em uma versão futura mais robusta, isso poderia vir de um banco de dados próprio
# ou até de uma busca vetorial (RAG) sobre manuais técnicos reais — aqui mantido
# como tabela estática por ser suficiente para o escopo do projeto.
BASE_CAUSAS_CONHECIDAS = {
    "ruido": {
        "causas_comuns": [
            "desalinhamento de eixo",
            "desgaste de rolamento",
            "folga em acoplamento mecânico",
            "falta de lubrificação",
        ],
        "pecas_tipicas": ["rolamento", "acoplamento", "correia"],
    },
    "vazamento": {
        "causas_comuns": [
            "ruptura de vedação/retentor",
            "mangueira ou conexão danificada",
            "trinca em reservatório",
        ],
        "pecas_tipicas": ["retentor", "mangueira hidráulica", "junta"],
    },
    "nao_liga": {
        "causas_comuns": [
            "falha elétrica no painel",
            "fusível ou disjuntor rompido",
            "bateria/fonte de alimentação descarregada",
            "motor de partida com defeito",
        ],
        "pecas_tipicas": ["fusível", "disjuntor", "bateria", "motor de partida"],
    },
}

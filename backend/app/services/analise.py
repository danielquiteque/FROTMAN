"""
Análise SIMULADA de ocorrências.

IMPORTANTE: este módulo NÃO utiliza nenhum modelo de IA, LLM ou serviço externo
(OpenAI, Claude, Gemini, Hugging Face, Ollama, LangChain, etc.). A "análise" é
inteiramente baseada em regras condicionais e correspondência de palavras-chave,
como texto mockado para simular como um sistema de IA real se comportaria no futuro.
"""

CAUSAS_MOCK = {
    "ruido": "Possível desalinhamento mecânico ou desgaste de rolamento — recomenda-se inspeção da parte móvel.",
    "vazamento": "Possível ruptura de vedação ou mangueira — recomenda-se verificação do circuito hidráulico/pneumático.",
    "nao_liga": "Possível falha elétrica ou queda de fusível — recomenda-se checagem do painel de alimentação.",
    "outro": "Causa não identificada automaticamente — recomenda-se inspeção presencial detalhada.",
}

PALAVRAS_URGENTES = ["fogo", "fumaça", "faísca", "explosão", "choque", "vazando muito", "parou de vez", "cheiro de queimado"]
PALAVRAS_ALTA = ["quebrado", "parado", "não funciona", "muito forte", "grave", "piorando"]


def analisar_ocorrencia(tipo_problema: str, severidade: int, descricao: str | None) -> dict:
    """
    Retorna prioridade e causa provável SIMULADAS, com base em:
    - severidade reportada pelo operador (1 a 5)
    - correspondência de palavras-chave na descrição livre

    Este é um placeholder explícito para uma futura integração com LLM real
    (ver seção 'Próximos Passos' do README).
    """
    descricao_lower = (descricao or "").lower()

    prioridade = "baixa"
    if severidade >= 4:
        prioridade = "alta"
    elif severidade >= 2:
        prioridade = "media"

    if any(p in descricao_lower for p in PALAVRAS_URGENTES):
        prioridade = "urgente"
    elif any(p in descricao_lower for p in PALAVRAS_ALTA) and prioridade != "urgente":
        prioridade = "alta"

    causa_provavel = CAUSAS_MOCK.get(tipo_problema, CAUSAS_MOCK["outro"])

    return {"prioridade": prioridade, "causa_provavel": causa_provavel}

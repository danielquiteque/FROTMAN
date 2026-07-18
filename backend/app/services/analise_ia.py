"""
Análise de ocorrências via LLM real (Claude, API da Anthropic).

Este módulo substitui o `analise.py` (baseado em regras) como fonte principal de
análise. Mantém `analise.py` como FALLBACK explícito: se a chamada à API falhar
(sem chave configurada, erro de rede, timeout), o sistema não quebra — volta a usar
as regras simples, e marca o resultado com `fonte_analise = "fallback_regras"` para
transparência total no frontend e no README.

Arquitetura:
- SDK oficial da Anthropic (sem LangChain) — ver justificativa no README.
- Tool use para: (1) buscar contexto (histórico do equipamento, base de causas
  conhecidas) e (2) forçar saída estruturada via a tool `registrar_analise`.
- Loop de até MAX_TURNOS_TOOL interações modelo↔ferramentas antes de desistir e
  cair no fallback — evita loop infinito caso o modelo não convirja.
"""
import json
import os
import sys
from typing import Optional

from sqlalchemy.orm import Session

# Torna o diretório raiz do projeto (onde ficam prompts/ e tools/) importável,
# independente de onde o processo Python foi iniciado.
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from tools.tools_definitions import TOOLS, BASE_CAUSAS_CONHECIDAS  # noqa: E402
from .analise import analisar_ocorrencia as analisar_ocorrencia_fallback  # noqa: E402

MODELO = "claude-sonnet-4-5"
TEMPERATURA = 0.25  # baixa: tarefa de classificação técnica precisa de consistência, não criatividade
MAX_TOKENS = 700
MAX_TURNOS_TOOL = 4

_SYSTEM_PROMPT_PATH = os.path.join(_PROJECT_ROOT, "prompts", "system_prompt.txt")


def _carregar_system_prompt() -> str:
    with open(_SYSTEM_PROMPT_PATH, "r", encoding="utf-8") as f:
        return f.read()


def _executar_tool_local(nome: str, entrada: dict, db: Session, equipamento_id: int) -> dict:
    """Executa localmente uma tool de CONTEXTO chamada pelo modelo (não a de saída final)."""
    if nome == "buscar_historico_equipamento":
        from .. import models  # import tardio para evitar ciclo

        eq_id = entrada.get("equipamento_id", equipamento_id)
        ordens = (
            db.query(models.OrdemServico)
            .join(models.Ocorrencia)
            .filter(models.Ocorrencia.equipamento_id == eq_id)
            .order_by(models.OrdemServico.criado_em.desc())
            .limit(10)
            .all()
        )
        return {
            "total_ocorrencias_anteriores": len(ordens),
            "ocorrencias": [
                {
                    "tipo_problema": o.ocorrencia.tipo_problema,
                    "prioridade_atribuida": o.prioridade,
                    "data": o.criado_em.isoformat(),
                }
                for o in ordens
            ],
        }

    if nome == "consultar_base_causas_conhecidas":
        tipo = entrada.get("tipo_problema")
        return BASE_CAUSAS_CONHECIDAS.get(tipo, {"causas_comuns": [], "pecas_tipicas": []})

    return {"erro": f"ferramenta desconhecida: {nome}"}


def analisar_ocorrencia_com_ia(
    tipo_problema: str,
    severidade: int,
    descricao: Optional[str],
    equipamento_id: int,
    db: Session,
) -> dict:
    """
    Chama o Claude com tool use para analisar a ocorrência. Em qualquer falha
    (sem API key, erro de rede, resposta malformada, não convergência), cai no
    fallback baseado em regras e sinaliza isso no campo `fonte_analise`.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        resultado = analisar_ocorrencia_fallback(tipo_problema, severidade, descricao)
        return {**resultado, "justificativa": None, "pecas_sugeridas": [], "fonte_analise": "fallback_regras_sem_chave"}

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=api_key)
        mensagens = [
            {
                "role": "user",
                "content": (
                    f"<ocorrencia>\n"
                    f"<tipo_problema>{tipo_problema}</tipo_problema>\n"
                    f"<severidade>{severidade}</severidade>\n"
                    f"<descricao>{descricao or '(sem descrição fornecida)'}</descricao>\n"
                    f"<equipamento_id>{equipamento_id}</equipamento_id>\n"
                    f"</ocorrencia>\n\n"
                    f"Analise esta ocorrência e registre o resultado usando a ferramenta registrar_analise."
                ),
            }
        ]

        for _ in range(MAX_TURNOS_TOOL):
            resposta = client.messages.create(
                model=MODELO,
                max_tokens=MAX_TOKENS,
                temperature=TEMPERATURA,
                system=_carregar_system_prompt(),
                tools=TOOLS,
                messages=mensagens,
            )

            blocos_tool = [b for b in resposta.content if b.type == "tool_use"]
            if not blocos_tool:
                break  # modelo não usou nenhuma tool nesta rodada — encerra e cai no fallback

            mensagens.append({"role": "assistant", "content": resposta.content})
            resultados_tool = []
            resposta_final = None

            for bloco in blocos_tool:
                if bloco.name == "registrar_analise":
                    resposta_final = bloco.input
                    continue
                resultado_local = _executar_tool_local(bloco.name, bloco.input, db, equipamento_id)
                resultados_tool.append(
                    {"type": "tool_result", "tool_use_id": bloco.id, "content": json.dumps(resultado_local, ensure_ascii=False)}
                )

            if resposta_final is not None:
                return {
                    "prioridade": resposta_final["prioridade"],
                    "causa_provavel": resposta_final["causa_provavel"],
                    "justificativa": resposta_final.get("justificativa"),
                    "pecas_sugeridas": resposta_final.get("pecas_sugeridas", []),
                    "fonte_analise": "ia_claude",
                }

            if resultados_tool:
                mensagens.append({"role": "user", "content": resultados_tool})
            else:
                break

        # Não convergiu em MAX_TURNOS_TOOL rodadas — cai no fallback
        raise RuntimeError("Modelo não convergiu para registrar_analise dentro do limite de turnos")

    except Exception as erro:  # noqa: BLE001 — captura ampla e deliberada: qualquer falha de IA cai no fallback
        resultado = analisar_ocorrencia_fallback(tipo_problema, severidade, descricao)
        return {
            **resultado,
            "justificativa": f"[fallback acionado — erro na IA: {erro}]",
            "pecas_sugeridas": [],
            "fonte_analise": "fallback_regras_erro",
        }

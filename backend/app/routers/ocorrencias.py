from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from .. import models, schemas
from ..database import get_db
from ..services.analise_ia import analisar_ocorrencia_com_ia

router = APIRouter(prefix="/ocorrencias", tags=["ocorrencias"])


@router.get("", response_model=list[schemas.OcorrenciaOut])
def listar_ocorrencias(equipamento_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(models.Ocorrencia)
    if equipamento_id:
        query = query.filter(models.Ocorrencia.equipamento_id == equipamento_id)
    return query.order_by(models.Ocorrencia.criado_em.desc()).all()


@router.post("", response_model=schemas.AnaliseOut, status_code=201)
def criar_ocorrencia(payload: schemas.OcorrenciaCreate, db: Session = Depends(get_db)):
    """
    Cria a ocorrência, roda a análise SIMULADA (regras/palavras-chave — sem IA real)
    e gera automaticamente a Ordem de Serviço correspondente, já com o primeiro
    registro no histórico de status.
    """
    equipamento = db.get(models.Equipamento, payload.equipamento_id)
    if not equipamento:
        raise HTTPException(status_code=404, detail="Equipamento não encontrado")

    ocorrencia = models.Ocorrencia(**payload.model_dump())
    db.add(ocorrencia)
    db.commit()
    db.refresh(ocorrencia)

    resultado = analisar_ocorrencia_com_ia(
        tipo_problema=ocorrencia.tipo_problema,
        severidade=ocorrencia.severidade,
        descricao=ocorrencia.descricao,
        equipamento_id=ocorrencia.equipamento_id,
        db=db,
    )

    ordem = models.OrdemServico(
        ocorrencia_id=ocorrencia.id,
        prioridade=resultado["prioridade"],
        causa_provavel=resultado["causa_provavel"],
        justificativa=resultado.get("justificativa"),
        pecas_sugeridas=json.dumps(resultado.get("pecas_sugeridas") or [], ensure_ascii=False),
        fonte_analise=resultado["fonte_analise"],
        status="aberta",
    )
    db.add(ordem)
    db.commit()
    db.refresh(ordem)

    db.add(models.HistoricoStatus(ordem_servico_id=ordem.id, status="aberta", observacao="OS gerada automaticamente"))
    db.commit()

    return schemas.AnaliseOut(
        prioridade=ordem.prioridade,
        causa_provavel=ordem.causa_provavel,
        justificativa=ordem.justificativa,
        pecas_sugeridas=resultado.get("pecas_sugeridas") or [],
        fonte_analise=ordem.fonte_analise,
        ordem_servico_id=ordem.id,
        ocorrencia_id=ocorrencia.id,
    )

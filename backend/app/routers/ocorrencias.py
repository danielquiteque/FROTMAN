from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..services.analise import analisar_ocorrencia

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

    resultado = analisar_ocorrencia(
        tipo_problema=ocorrencia.tipo_problema,
        severidade=ocorrencia.severidade,
        descricao=ocorrencia.descricao,
    )

    ordem = models.OrdemServico(
        ocorrencia_id=ocorrencia.id,
        prioridade=resultado["prioridade"],
        causa_provavel=resultado["causa_provavel"],
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
        ordem_servico_id=ordem.id,
        ocorrencia_id=ocorrencia.id,
    )

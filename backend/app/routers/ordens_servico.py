import datetime as dt

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/ordens-servico", tags=["ordens_servico"])


def _to_detalhe(ordem: models.OrdemServico) -> schemas.OrdemServicoDetalheOut:
    ocorrencia = ordem.ocorrencia
    equipamento = ocorrencia.equipamento
    return schemas.OrdemServicoDetalheOut(
        id=ordem.id,
        ocorrencia_id=ordem.ocorrencia_id,
        prioridade=ordem.prioridade,
        causa_provavel=ordem.causa_provavel,
        justificativa=ordem.justificativa,
        pecas_sugeridas=ordem.pecas_sugeridas,
        fonte_analise=ordem.fonte_analise,
        status=ordem.status,
        observacoes_tecnico=ordem.observacoes_tecnico,
        tecnico_responsavel=ordem.tecnico_responsavel,
        criado_em=ordem.criado_em,
        atualizado_em=ordem.atualizado_em,
        equipamento_nome=equipamento.nome,
        tipo_problema=ocorrencia.tipo_problema,
        severidade=ocorrencia.severidade,
        descricao=ocorrencia.descricao,
        anexo_url=ocorrencia.anexo_url,
    )


@router.get("", response_model=list[schemas.OrdemServicoDetalheOut])
def listar_ordens(
    status: str | None = None,
    prioridade: str | None = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.OrdemServico)
        .options(joinedload(models.OrdemServico.ocorrencia).joinedload(models.Ocorrencia.equipamento))
    )
    if status:
        query = query.filter(models.OrdemServico.status == status)
    if prioridade:
        query = query.filter(models.OrdemServico.prioridade == prioridade)
    ordens = query.order_by(models.OrdemServico.criado_em.desc()).all()
    return [_to_detalhe(o) for o in ordens]


@router.get("/{ordem_id}", response_model=schemas.OrdemServicoDetalheOut)
def obter_ordem(ordem_id: int, db: Session = Depends(get_db)):
    ordem = db.get(models.OrdemServico, ordem_id)
    if not ordem:
        raise HTTPException(status_code=404, detail="Ordem de serviço não encontrada")
    return _to_detalhe(ordem)


@router.get("/{ordem_id}/historico", response_model=list[schemas.HistoricoStatusOut])
def historico_da_ordem(ordem_id: int, db: Session = Depends(get_db)):
    ordem = db.get(models.OrdemServico, ordem_id)
    if not ordem:
        raise HTTPException(status_code=404, detail="Ordem de serviço não encontrada")
    return sorted(ordem.historico, key=lambda h: h.criado_em)


@router.patch("/{ordem_id}", response_model=schemas.OrdemServicoDetalheOut)
def atualizar_ordem(ordem_id: int, payload: schemas.OrdemServicoUpdate, db: Session = Depends(get_db)):
    ordem = db.get(models.OrdemServico, ordem_id)
    if not ordem:
        raise HTTPException(status_code=404, detail="Ordem de serviço não encontrada")

    if payload.status and payload.status != ordem.status:
        ordem.status = payload.status
        db.add(models.HistoricoStatus(ordem_servico_id=ordem.id, status=payload.status, observacao=payload.observacoes_tecnico))

    if payload.observacoes_tecnico is not None:
        ordem.observacoes_tecnico = payload.observacoes_tecnico

    ordem.atualizado_em = dt.datetime.utcnow()
    db.commit()
    db.refresh(ordem)
    return _to_detalhe(ordem)

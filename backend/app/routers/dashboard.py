import datetime as dt
import calendar
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/kpis", response_model=schemas.DashboardKPIs)
def kpis(db: Session = Depends(get_db)):
    total_equipamentos = db.query(models.Equipamento).count()
    os_abertas = db.query(models.OrdemServico).filter(models.OrdemServico.status != "concluida").count()
    os_urgentes = db.query(models.OrdemServico).filter(
        models.OrdemServico.prioridade == "urgente", models.OrdemServico.status != "concluida"
    ).count()

    inicio_mes = dt.datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    os_concluidas_mes = db.query(models.OrdemServico).filter(
        models.OrdemServico.status == "concluida", models.OrdemServico.atualizado_em >= inicio_mes
    ).count()

    return schemas.DashboardKPIs(
        total_equipamentos=total_equipamentos,
        os_abertas=os_abertas,
        os_urgentes=os_urgentes,
        os_concluidas_mes=os_concluidas_mes,
    )


@router.get("/equipamentos/{equipamento_id}/historico", response_model=schemas.HistoricoEquipamentoOut)
def historico_equipamento(equipamento_id: int, db: Session = Depends(get_db)):
    equipamento = db.get(models.Equipamento, equipamento_id)
    if not equipamento:
        raise HTTPException(status_code=404, detail="Equipamento não encontrado")

    ordens = (
        db.query(models.OrdemServico)
        .join(models.Ocorrencia)
        .filter(models.Ocorrencia.equipamento_id == equipamento_id)
        .options(joinedload(models.OrdemServico.ocorrencia))
        .order_by(models.OrdemServico.criado_em.desc())
        .all()
    )

    datas = sorted(o.criado_em for o in ordens)
    tempo_medio = None
    if len(datas) >= 2:
        deltas = [(datas[i] - datas[i - 1]).days for i in range(1, len(datas))]
        tempo_medio = sum(deltas) / len(deltas)

    contagem_mes = Counter(f"{calendar.month_abbr[o.criado_em.month]}" for o in ordens)
    ocorrencias_por_mes = [{"mes": mes, "quantidade": qtd} for mes, qtd in contagem_mes.items()]

    return schemas.HistoricoEquipamentoOut(
        equipamento=equipamento,
        total_os=len(ordens),
        tempo_medio_entre_falhas_dias=tempo_medio,
        ultima_manutencao=datas[-1] if datas else None,
        ocorrencias_por_mes=ocorrencias_por_mes,
        ordens=ordens,
    )

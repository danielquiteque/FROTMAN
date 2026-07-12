from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/equipamentos", tags=["equipamentos"])


@router.get("", response_model=list[schemas.EquipamentoOut])
def listar_equipamentos(busca: str | None = Query(None), db: Session = Depends(get_db)):
    query = db.query(models.Equipamento)
    if busca:
        query = query.filter(models.Equipamento.nome.ilike(f"%{busca}%"))
    return query.order_by(models.Equipamento.criado_em.desc()).all()


@router.post("", response_model=schemas.EquipamentoOut, status_code=201)
def criar_equipamento(payload: schemas.EquipamentoCreate, db: Session = Depends(get_db)):
    equipamento = models.Equipamento(**payload.model_dump())
    db.add(equipamento)
    db.commit()
    db.refresh(equipamento)
    return equipamento


@router.get("/{equipamento_id}", response_model=schemas.EquipamentoOut)
def obter_equipamento(equipamento_id: int, db: Session = Depends(get_db)):
    equipamento = db.get(models.Equipamento, equipamento_id)
    if not equipamento:
        raise HTTPException(status_code=404, detail="Equipamento não encontrado")
    return equipamento


@router.patch("/{equipamento_id}/foto", response_model=schemas.EquipamentoOut)
def atualizar_foto(equipamento_id: int, foto_url: str, db: Session = Depends(get_db)):
    equipamento = db.get(models.Equipamento, equipamento_id)
    if not equipamento:
        raise HTTPException(status_code=404, detail="Equipamento não encontrado")
    equipamento.foto_url = foto_url
    db.commit()
    db.refresh(equipamento)
    return equipamento


@router.delete("/{equipamento_id}", status_code=204)
def remover_equipamento(equipamento_id: int, db: Session = Depends(get_db)):
    equipamento = db.get(models.Equipamento, equipamento_id)
    if not equipamento:
        raise HTTPException(status_code=404, detail="Equipamento não encontrado")
    db.delete(equipamento)
    db.commit()
    return None

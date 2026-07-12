"""Schemas Pydantic — contratos de request/response da API FROTMAN."""
import datetime as dt
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ---------- Equipamento ----------
class EquipamentoBase(BaseModel):
    nome: str
    tipo: str
    setor: Optional[str] = None
    data_aquisicao: Optional[dt.date] = None


class EquipamentoCreate(EquipamentoBase):
    pass


class EquipamentoOut(EquipamentoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    foto_url: Optional[str] = None
    criado_em: dt.datetime


# ---------- Ocorrencia ----------
class OcorrenciaCreate(BaseModel):
    equipamento_id: int
    tipo_problema: str
    severidade: int
    descricao: Optional[str] = None
    detalhes_json: Optional[str] = None
    anexo_url: Optional[str] = None


class OcorrenciaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    equipamento_id: int
    tipo_problema: str
    severidade: int
    descricao: Optional[str] = None
    anexo_url: Optional[str] = None
    criado_em: dt.datetime


# ---------- Ordem de Serviço ----------
class OrdemServicoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ocorrencia_id: int
    prioridade: str
    causa_provavel: Optional[str] = None
    status: str
    observacoes_tecnico: Optional[str] = None
    tecnico_responsavel: str
    criado_em: dt.datetime
    atualizado_em: dt.datetime


class OrdemServicoDetalheOut(OrdemServicoOut):
    """Inclui dados do equipamento e da ocorrência para a tela de detalhe."""
    equipamento_nome: str
    tipo_problema: str
    severidade: int
    descricao: Optional[str] = None
    anexo_url: Optional[str] = None


class OrdemServicoUpdate(BaseModel):
    status: Optional[str] = None
    observacoes_tecnico: Optional[str] = None


class HistoricoStatusOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    observacao: Optional[str] = None
    criado_em: dt.datetime


# ---------- Análise mockada ----------
class AnaliseOut(BaseModel):
    prioridade: str
    causa_provavel: str
    ordem_servico_id: int
    ocorrencia_id: int


# ---------- Dashboard ----------
class DashboardKPIs(BaseModel):
    total_equipamentos: int
    os_abertas: int
    os_urgentes: int
    os_concluidas_mes: int


# ---------- Histórico por equipamento ----------
class HistoricoEquipamentoOut(BaseModel):
    equipamento: EquipamentoOut
    total_os: int
    tempo_medio_entre_falhas_dias: Optional[float] = None
    ultima_manutencao: Optional[dt.datetime] = None
    ocorrencias_por_mes: list[dict]
    ordens: list[OrdemServicoOut]

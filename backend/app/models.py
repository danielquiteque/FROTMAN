"""Modelos SQLAlchemy — equipamentos, ocorrencias, ordens de serviço, anexos e histórico."""
import datetime as dt

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Date
)
from sqlalchemy.orm import relationship

from .database import Base


class Equipamento(Base):
    __tablename__ = "equipamentos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    tipo = Column(String, nullable=False)  # maquina_industrial | veiculo | ferramenta_eletrica
    setor = Column(String, nullable=True)
    data_aquisicao = Column(Date, nullable=True)
    foto_url = Column(String, nullable=True)
    criado_em = Column(DateTime, default=dt.datetime.utcnow)

    ocorrencias = relationship("Ocorrencia", back_populates="equipamento", cascade="all, delete-orphan")


class Ocorrencia(Base):
    __tablename__ = "ocorrencias"

    id = Column(Integer, primary_key=True, index=True)
    equipamento_id = Column(Integer, ForeignKey("equipamentos.id"), nullable=False)
    tipo_problema = Column(String, nullable=False)  # ruido | vazamento | nao_liga | outro
    severidade = Column(Integer, nullable=False)  # 1 a 5
    descricao = Column(Text, nullable=True)
    detalhes_json = Column(Text, nullable=True)  # respostas do formulário dinâmico (JSON serializado)
    anexo_url = Column(String, nullable=True)
    criado_em = Column(DateTime, default=dt.datetime.utcnow)

    equipamento = relationship("Equipamento", back_populates="ocorrencias")
    ordem_servico = relationship(
        "OrdemServico", back_populates="ocorrencia", uselist=False, cascade="all, delete-orphan"
    )


class OrdemServico(Base):
    __tablename__ = "ordens_servico"

    id = Column(Integer, primary_key=True, index=True)
    ocorrencia_id = Column(Integer, ForeignKey("ocorrencias.id"), nullable=False)
    prioridade = Column(String, nullable=False)  # baixa | media | alta | urgente
    causa_provavel = Column(Text, nullable=True)
    justificativa = Column(Text, nullable=True)  # raciocínio retornado pelo LLM (quando aplicável)
    pecas_sugeridas = Column(Text, nullable=True)  # lista JSON-encoded de peças sugeridas
    fonte_analise = Column(String, default="fallback_regras_sem_chave")  # ia_claude | fallback_regras_*
    status = Column(String, default="aberta")  # aberta | em_andamento | concluida
    observacoes_tecnico = Column(Text, nullable=True)
    tecnico_responsavel = Column(String, default="A definir")
    criado_em = Column(DateTime, default=dt.datetime.utcnow)
    atualizado_em = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)

    ocorrencia = relationship("Ocorrencia", back_populates="ordem_servico")
    historico = relationship("HistoricoStatus", back_populates="ordem_servico", cascade="all, delete-orphan")


class HistoricoStatus(Base):
    """Registra cada transição de status de uma OS — usado na linha do tempo."""
    __tablename__ = "historico_status"

    id = Column(Integer, primary_key=True, index=True)
    ordem_servico_id = Column(Integer, ForeignKey("ordens_servico.id"), nullable=False)
    status = Column(String, nullable=False)
    observacao = Column(Text, nullable=True)
    criado_em = Column(DateTime, default=dt.datetime.utcnow)

    ordem_servico = relationship("OrdemServico", back_populates="historico")

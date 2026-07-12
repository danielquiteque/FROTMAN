export type TipoEquipamento = "maquina_industrial" | "veiculo" | "ferramenta_eletrica";

export interface Equipamento {
  id: number;
  nome: string;
  tipo: TipoEquipamento;
  setor?: string | null;
  data_aquisicao?: string | null;
  foto_url?: string | null;
  criado_em: string;
}

export type TipoProblema = "ruido" | "vazamento" | "nao_liga" | "outro";
export type Prioridade = "baixa" | "media" | "alta" | "urgente";
export type StatusOS = "aberta" | "em_andamento" | "concluida";

export interface OrdemServico {
  id: number;
  ocorrencia_id: number;
  prioridade: Prioridade;
  causa_provavel?: string | null;
  status: StatusOS;
  observacoes_tecnico?: string | null;
  tecnico_responsavel: string;
  criado_em: string;
  atualizado_em: string;
  equipamento_nome: string;
  tipo_problema: TipoProblema;
  severidade: number;
  descricao?: string | null;
  anexo_url?: string | null;
}

export interface HistoricoStatusItem {
  id: number;
  status: StatusOS;
  observacao?: string | null;
  criado_em: string;
}

export interface DashboardKPIs {
  total_equipamentos: number;
  os_abertas: number;
  os_urgentes: number;
  os_concluidas_mes: number;
}

export interface HistoricoEquipamento {
  equipamento: Equipamento;
  total_os: number;
  tempo_medio_entre_falhas_dias?: number | null;
  ultima_manutencao?: string | null;
  ocorrencias_por_mes: { mes: string; quantidade: number }[];
  ordens: OrdemServico[];
}

export interface AnaliseResultado {
  prioridade: Prioridade;
  causa_provavel: string;
  ordem_servico_id: number;
  ocorrencia_id: number;
}

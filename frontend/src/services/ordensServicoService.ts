import { api } from "./api";
import type { DashboardKPIs, HistoricoEquipamento, HistoricoStatusItem, OrdemServico } from "../types";

export const ordensServicoService = {
  listar: (filtros?: { status?: string; prioridade?: string }) =>
    api.get<OrdemServico[]>("/ordens-servico", { params: filtros }).then((r) => r.data),

  obter: (id: number) => api.get<OrdemServico>(`/ordens-servico/${id}`).then((r) => r.data),

  historicoDaOrdem: (id: number) =>
    api.get<HistoricoStatusItem[]>(`/ordens-servico/${id}/historico`).then((r) => r.data),

  atualizarStatus: (id: number, status: string, observacoes_tecnico?: string) =>
    api.patch<OrdemServico>(`/ordens-servico/${id}`, { status, observacoes_tecnico }).then((r) => r.data),

  atualizarObservacoes: (id: number, observacoes_tecnico: string) =>
    api.patch<OrdemServico>(`/ordens-servico/${id}`, { observacoes_tecnico }).then((r) => r.data),
};

export const dashboardService = {
  kpis: () => api.get<DashboardKPIs>("/dashboard/kpis").then((r) => r.data),
};

export const historicoService = {
  porEquipamento: (equipamentoId: number) =>
    api.get<HistoricoEquipamento>(`/equipamentos/${equipamentoId}/historico`).then((r) => r.data),
};

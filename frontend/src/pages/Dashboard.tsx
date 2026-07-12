import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KpiCard } from "../components/KpiCard";
import { Badge } from "../components/Badge";
import { dashboardService, ordensServicoService } from "../services/ordensServicoService";
import type { DashboardKPIs, OrdemServico } from "../types";

export function Dashboard() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [status, setStatus] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    dashboardService.kpis().then(setKpis).catch(() => setKpis(null));
  }, []);

  useEffect(() => {
    setCarregando(true);
    ordensServicoService
      .listar({ status: status || undefined, prioridade: prioridade || undefined })
      .then(setOrdens)
      .finally(() => setCarregando(false));
  }, [status, prioridade]);

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1>Painel Geral</h1>
          <p>Visão consolidada de equipamentos e ordens de serviço</p>
        </div>
        <button className="btn" onClick={() => navigate("/app/ocorrencia/nova")}>
          + Nova Ocorrência
        </button>
      </div>

      <div className="kpi-row">
        <KpiCard label="Equipamentos" value={kpis?.total_equipamentos ?? 0} accentColor="var(--bic)" />
        <KpiCard label="OS Abertas" value={kpis?.os_abertas ?? 0} accentColor="var(--orange)" />
        <KpiCard label="Urgentes" value={kpis?.os_urgentes ?? 0} accentColor="var(--red)" />
        <KpiCard label="Concluídas (mês)" value={kpis?.os_concluidas_mes ?? 0} accentColor="var(--teal)" />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Ordens de Serviço Recentes</h3>
          <div className="filters">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos status</option>
              <option value="aberta">Aberta</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluida">Concluída</option>
            </select>
            <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)}>
              <option value="">Toda prioridade</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>OS</th>
              <th>Equipamento</th>
              <th>Problema</th>
              <th>Prioridade</th>
              <th>Status</th>
              <th>Atualizado</th>
            </tr>
          </thead>
          <tbody>
            {carregando ? (
              <tr>
                <td colSpan={6} className="empty">Carregando...</td>
              </tr>
            ) : ordens.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty">Nenhuma OS encontrada com esses filtros</td>
              </tr>
            ) : (
              ordens.map((o) => (
                <tr key={o.id} className="row-hover" onClick={() => navigate(`/app/ordens/${o.id}`)}>
                  <td className="mono">OS-{String(o.id).padStart(4, "0")}</td>
                  <td>{o.equipamento_nome}</td>
                  <td>{o.tipo_problema}</td>
                  <td><Badge tipo="prioridade" valor={o.prioridade} /></td>
                  <td><Badge tipo="status" valor={o.status} /></td>
                  <td className="mono" style={{ color: "var(--muted)" }}>
                    {new Date(o.atualizado_em).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

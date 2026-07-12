import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "../components/Badge";
import { KpiCard } from "../components/KpiCard";
import { historicoService } from "../services/ordensServicoService";
import type { HistoricoEquipamento } from "../types";

export function Historico() {
  const { equipamentoId } = useParams();
  const [dados, setDados] = useState<HistoricoEquipamento | null>(null);

  useEffect(() => {
    if (equipamentoId) {
      historicoService.porEquipamento(Number(equipamentoId)).then(setDados);
    }
  }, [equipamentoId]);

  if (!dados) {
    return (
      <div className="fade-in">
        <div className="page-head"><div><h1>Histórico</h1><p>Carregando...</p></div></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1>Histórico — {dados.equipamento.nome}</h1>
          <p>Ocorrências anteriores e frequência de falhas</p>
        </div>
      </div>

      <div className="kpi-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <KpiCard label="Total de OSs" value={dados.total_os} accentColor="var(--bic)" />
        <KpiCard
          label="Tempo médio entre falhas"
          value={Math.round(dados.tempo_medio_entre_falhas_dias ?? 0)}
          accentColor="var(--orange)"
          suffix="dias"
        />
        <div className="kpi" style={{ ["--kpi-accent" as string]: "var(--teal)" }}>
          <div className="kpi-label">Última manutenção</div>
          <div className="kpi-value" style={{ fontSize: 18 }}>
            {dados.ultima_manutencao ? new Date(dados.ultima_manutencao).toLocaleDateString("pt-BR") : "—"}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Ocorrências por mês</h3></div>
        <div style={{ height: 220, padding: "10px 12px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dados.ocorrencias_por_mes}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={{ stroke: "var(--line)" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={{ stroke: "var(--line)" }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--line)", fontSize: 12 }} />
              <Bar dataKey="quantidade" fill="var(--orange)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Ocorrências anteriores</h3></div>
        <table>
          <thead><tr><th>OS</th><th>Problema</th><th>Prioridade</th><th>Status</th><th>Data</th></tr></thead>
          <tbody>
            {dados.ordens.length === 0 ? (
              <tr><td colSpan={5} className="empty">Nenhuma ocorrência registrada para este equipamento</td></tr>
            ) : (
              dados.ordens.map((o) => (
                <tr key={o.id}>
                  <td className="mono">OS-{String(o.id).padStart(4, "0")}</td>
                  <td>{o.tipo_problema}</td>
                  <td><Badge tipo="prioridade" valor={o.prioridade} /></td>
                  <td><Badge tipo="status" valor={o.status} /></td>
                  <td className="mono" style={{ color: "var(--muted)" }}>{new Date(o.criado_em).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

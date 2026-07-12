import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "../components/Badge";
import { Toast } from "../components/Toast";
import { useToast } from "../hooks/useToast";
import { ordensServicoService } from "../services/ordensServicoService";
import { uploadService } from "../services/uploadService";
import type { OrdemServico, StatusOS } from "../types";

const PROXIMO_STATUS: Record<StatusOS, StatusOS | null> = {
  aberta: "em_andamento",
  em_andamento: "concluida",
  concluida: null,
};

export function OrdemServicoDetalhe() {
  const { id } = useParams();
  const ordemId = Number(id);
  const [ordem, setOrdem] = useState<OrdemServico | null>(null);
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const { message, showToast } = useToast();

  const carregar = () => {
    ordensServicoService.obter(ordemId).then((data) => {
      setOrdem(data);
      setObservacoes(data.observacoes_tecnico ?? "");
    });
  };

  useEffect(() => {
    if (ordemId) carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordemId]);

  if (!ordem) {
    return (
      <div className="fade-in">
        <div className="page-head"><div><h1>Ordem de Serviço</h1><p>Carregando...</p></div></div>
      </div>
    );
  }

  const proximo = PROXIMO_STATUS[ordem.status];

  const avancarStatus = async () => {
    if (!proximo) return;
    setSalvando(true);
    try {
      const atualizado = await ordensServicoService.atualizarStatus(ordem.id, proximo, observacoes);
      setOrdem(atualizado);
      showToast(`Status atualizado: ${proximo === "em_andamento" ? "Em andamento" : "Concluída"}`);
    } finally {
      setSalvando(false);
    }
  };

  const salvarObservacoes = async () => {
    setSalvando(true);
    try {
      const atualizado = await ordensServicoService.atualizarObservacoes(ordem.id, observacoes);
      setOrdem(atualizado);
      showToast("Observações salvas");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1>Ordem de Serviço</h1>
          <p>Detalhe, diagnóstico simulado e linha do tempo</p>
        </div>
      </div>

      <div className="os-stub">
        <div className="os-stub-top">
          <div>
            <div className="os-id">OS-{String(ordem.id).padStart(4, "0")}</div>
            <div className="os-title">{ordem.equipamento_nome} — {rotuloTipoProblema(ordem.tipo_problema)}</div>
          </div>
          <Badge tipo="prioridade" valor={ordem.prioridade} />
        </div>
        <div className="perforation" />

        <div className="timeline">
          {(["aberta", "em_andamento", "concluida"] as StatusOS[]).map((s, i) => {
            const ordemStatusIndex = ["aberta", "em_andamento", "concluida"].indexOf(ordem.status);
            const cls = i < ordemStatusIndex ? "past" : i === ordemStatusIndex ? "active" : "";
            return (
              <div key={s} className={`tl-step ${cls}`}>
                <div className="tl-dot" />
                <div className="tl-label">{s === "aberta" ? "Aberta" : s === "em_andamento" ? "Em andamento" : "Concluída"}</div>
              </div>
            );
          })}
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <div className="k">Causa provável (mock)</div>
            <div className="v">{ordem.causa_provavel}</div>
          </div>
          <div className="detail-item">
            <div className="k">Severidade reportada</div>
            <div className="v">{ordem.severidade} / 5</div>
          </div>
          <div className="detail-item">
            <div className="k">Aberta em</div>
            <div className="v mono">{new Date(ordem.criado_em).toLocaleString("pt-BR")}</div>
          </div>
          <div className="detail-item">
            <div className="k">Técnico responsável</div>
            <div className="v">{ordem.tecnico_responsavel}</div>
          </div>
          {ordem.descricao && (
            <div className="detail-item" style={{ gridColumn: "1 / -1" }}>
              <div className="k">Descrição do operador</div>
              <div className="v">{ordem.descricao}</div>
            </div>
          )}
          {ordem.anexo_url && (
            <div className="detail-item" style={{ gridColumn: "1 / -1" }}>
              <div className="k">Anexo enviado</div>
              <a className="v" href={uploadService.urlCompleta(ordem.anexo_url)} target="_blank" rel="noreferrer">
                Ver arquivo anexado →
              </a>
            </div>
          )}
          <div className="field full" style={{ gridColumn: "1 / -1" }}>
            <label>Observações do técnico</label>
            <textarea
              rows={3}
              placeholder="Adicionar observação..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              onBlur={salvarObservacoes}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "0 20px 20px 20px" }}>
          <button className="btn-ghost" onClick={avancarStatus} disabled={!proximo || salvando}>
            {proximo ? "Avançar status" : "OS concluída"}
          </button>
          <button className="btn" onClick={() => showToast("Relatório exportado (simulado)")}>
            Exportar relatório
          </button>
        </div>
      </div>
      <Toast message={message} />
    </div>
  );
}

function rotuloTipoProblema(tipo: string) {
  return { ruido: "Ruído anormal", vazamento: "Vazamento", nao_liga: "Não liga" }[tipo] ?? tipo;
}

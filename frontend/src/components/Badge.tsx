const LABELS: Record<string, string> = {
  urgente: "Urgente",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
  aberta: "Aberta",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};

interface BadgeProps {
  tipo: "prioridade" | "status";
  valor: string;
}

export function Badge({ tipo, valor }: BadgeProps) {
  const cssClass = tipo === "status" ? `status-${valor}` : valor;
  return <span className={`badge ${cssClass}`}>{LABELS[valor] ?? valor}</span>;
}

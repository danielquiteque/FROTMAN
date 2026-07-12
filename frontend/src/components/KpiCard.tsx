import { useCountUp } from "../hooks/useCountUp";

interface KpiCardProps {
  label: string;
  value: number;
  accentColor?: string;
  suffix?: string;
}

export function KpiCard({ label, value, accentColor = "var(--orange)", suffix }: KpiCardProps) {
  const animated = useCountUp(value);
  return (
    <div className="kpi" style={{ ["--kpi-accent" as string]: accentColor }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {animated}
        {suffix && <span>{suffix}</span>}
      </div>
    </div>
  );
}

type Props = { score: number; size?: number };

export function TrustGauge({ score, size = 180 }: Props) {
  const s = Math.max(0, Math.min(100, score));
  const r = size / 2 - 14;
  const c = 2 * Math.PI * r;
  const offset = c - (s / 100) * c;
  const color = s >= 80 ? "var(--success)" : s >= 60 ? "var(--leaf)" : s >= 40 ? "var(--warning)" : "var(--danger)";
  const label = s >= 80 ? "Low Risk" : s >= 60 ? "Moderate" : s >= 40 ? "High Risk" : "Needs Data";

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--muted)" strokeWidth={14} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={14} fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-4xl font-bold text-leaf">{s}</div>
        <div className="text-xs text-charcoal/60">of 100</div>
        <div className="mt-1 text-xs font-semibold" style={{ color }}>{label}</div>
      </div>
    </div>
  );
}

export function riskMeta(score: number) {
  if (score >= 80) return { label: "Low Risk", tone: "success" as const, color: "var(--success)" };
  if (score >= 60) return { label: "Moderate Risk", tone: "leaf" as const, color: "var(--leaf)" };
  if (score >= 40) return { label: "High Risk", tone: "warning" as const, color: "var(--warning)" };
  return { label: "Needs More Data", tone: "danger" as const, color: "var(--danger)" };
}

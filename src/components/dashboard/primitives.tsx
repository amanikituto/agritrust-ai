import type { ComponentType, ReactNode } from "react";
import { ArrowRight } from "lucide-react";

export type Tone = "emerald" | "sky" | "gold" | "rose" | "violet";

const toneText: Record<Tone, string> = {
  emerald: "text-emerald",
  sky: "text-sky",
  gold: "text-gold",
  rose: "text-rose",
  violet: "text-violet",
};
const toneBg: Record<Tone, string> = {
  emerald: "bg-emerald/10 text-emerald",
  sky: "bg-sky/10 text-sky",
  gold: "bg-gold/10 text-gold",
  rose: "bg-rose/10 text-rose",
  violet: "bg-violet/10 text-violet",
};

export function Card({
  title,
  icon: Icon,
  children,
  className = "",
  action,
}: {
  title?: string;
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div className={`rounded-2xl glass p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {Icon && <Icon className="h-4 w-4 text-emerald" />}
            {title}
          </div>
          {action ?? <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      )}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  tone = "emerald",
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className={`grid h-8 w-8 place-items-center rounded-lg bg-surface-elevated ${toneText[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function Tag({ label, tone = "emerald" }: { label: string; tone?: Tone }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${toneBg[tone]}`}
    >
      {label}
    </span>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  sub,
  right,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 truncate text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

/* ---------- Charts ---------- */

export function Sparkline({
  data,
  labels,
  color = "oklch(0.72 0.18 155)",
}: {
  data: number[];
  labels?: string[];
  color?: string;
}) {
  const w = 600;
  const h = 160;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${h - ((v - min) / (max - min || 1)) * (h - 20) - 10}`)
    .join(" ");
  const gradId = `spark-${color.replace(/\W/g, "")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,${h} ${points} ${w},${h}`} fill={`url(#${gradId})`} stroke="none" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {labels?.map((l, i) => (
        <text
          key={i}
          x={i * step}
          y={h + 16}
          textAnchor="middle"
          fontSize="10"
          fill="currentColor"
          className="text-muted-foreground"
        >
          {l}
        </text>
      ))}
    </svg>
  );
}

export function Bars({
  data,
  color = "oklch(0.78 0.13 230 / 0.85)",
}: {
  data: number[];
  color?: string;
}) {
  const w = 300;
  const h = 160;
  const max = Math.max(...data);
  const bw = (w - 10) / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {data.map((v, i) => {
        const bh = (v / max) * (h - 20);
        return (
          <rect key={i} x={i * bw + 4} y={h - bh} width={bw - 6} height={bh} rx="3" fill={color} />
        );
      })}
    </svg>
  );
}

export function Gauge({
  score,
  max = 850,
  label = "Trust score",
  size = 200,
}: {
  score: number;
  max?: number;
  label?: string;
  size?: number;
}) {
  const r = size / 2 - 14;
  const c = Math.PI * r; // half circle
  const pct = Math.max(0, Math.min(1, score / max));
  const color =
    pct >= 0.75 ? "oklch(0.72 0.18 155)" : pct >= 0.5 ? "oklch(0.83 0.15 85)" : "oklch(0.7 0.2 18)";
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 24} viewBox={`0 0 ${size} ${size / 2 + 24}`}>
        <path
          d={`M 14 ${size / 2} A ${r} ${r} 0 0 1 ${size - 14} ${size / 2}`}
          fill="none"
          stroke="oklch(1 0 0 / 0.08)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d={`M 14 ${size / 2} A ${r} ${r} 0 0 1 ${size - 14} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
        <text
          x={size / 2}
          y={size / 2 - 6}
          textAnchor="middle"
          fontSize="36"
          fontWeight="700"
          fill="currentColor"
          className="text-foreground"
        >
          {score}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 14}
          textAnchor="middle"
          fontSize="10"
          fill="currentColor"
          className="text-muted-foreground"
        >
          / {max}
        </text>
      </svg>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

export function Donut({
  segments,
  size = 160,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, v) => s + v.value, 0);
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="oklch(1 0 0 / 0.06)" strokeWidth="14" />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const off = c - len;
          const rot = (acc / total) * 360;
          acc += s.value;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${len} ${c}`}
              strokeDashoffset={off}
              strokeLinecap="butt"
              style={{ transform: `rotate(${rot}deg)`, transformOrigin: "center" }}
            />
          );
        })}
      </svg>
      <ul className="space-y-1.5 text-xs">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto font-semibold text-foreground">{s.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ShapBars({
  positive,
  negative,
}: {
  positive: { l: string; v: number }[];
  negative: { l: string; v: number }[];
}) {
  const max = Math.max(...positive.map((p) => p.v), ...negative.map((n) => Math.abs(n.v)));
  const row = (l: string, v: number, color: string) => {
    const w = (Math.abs(v) / max) * 100;
    return (
      <div key={l} className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{l}</span>
          <span className="font-mono text-foreground">{v > 0 ? "+" : ""}{v.toFixed(2)}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-elevated">
          <div className="h-full rounded-full" style={{ width: `${w}%`, background: color }} />
        </div>
      </div>
    );
  };
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald">
          Positive contributors
        </p>
        {positive.map((p) => row(p.l, p.v, "var(--emerald)"))}
      </div>
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-rose">
          Negative contributors
        </p>
        {negative.map((n) => row(n.l, n.v, "var(--rose)"))}
      </div>
    </div>
  );
}

export function StatusPill({
  status,
}: {
  status: "done" | "progress" | "attention";
}) {
  const map = {
    done: { l: "Complete", c: "bg-emerald/10 text-emerald" },
    progress: { l: "In progress", c: "bg-sky/10 text-sky" },
    attention: { l: "Needs attention", c: "bg-gold/10 text-gold" },
  }[status];
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${map.c}`}
    >
      {map.l}
    </span>
  );
}

const TYPE_COLOR: Record<string, string> = {
  Cooperative: "var(--emerald)",
  Lender: "var(--sky)",
  Bank: "var(--sky)",
  Market: "var(--gold)",
  Buyer: "var(--gold)",
  Supplier: "var(--violet)",
  Inputs: "var(--violet)",
  Climate: "var(--sky)",
  Weather: "var(--sky)",
  Officer: "var(--emerald)",
  Peer: "var(--rose)",
  Neighbor: "var(--rose)",
};

export function NetworkGraph({
  centerLabel = "Farmer",
  nodes,
}: {
  centerLabel?: string;
  nodes?: { label: string; type?: string }[];
}) {
  const items = (nodes && nodes.length ? nodes : [
    { label: "Cooperative", type: "Cooperative" },
    { label: "Bank", type: "Lender" },
    { label: "Buyer", type: "Market" },
    { label: "Inputs", type: "Supplier" },
    { label: "Weather", type: "Climate" },
    { label: "Officer", type: "Officer" },
    { label: "Market", type: "Market" },
    { label: "Neighbor", type: "Peer" },
  ]).slice(0, 12);
  const cx = 250;
  const cy = 200;
  const radius = 140;
  return (
    <svg viewBox="0 0 500 400" className="w-full">
      {items.map((n, i) => {
        const a = (i / items.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + radius * Math.cos(a);
        const y = cy + radius * Math.sin(a);
        const color = TYPE_COLOR[n.type ?? ""] ?? "var(--emerald)";
        return (
          <g key={`${n.label}-${i}`}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke={color} strokeOpacity="0.35" strokeWidth="1.2" strokeDasharray="4 4" />
            <circle cx={x} cy={y} r="22" fill={color} fillOpacity="0.18" stroke={color} strokeWidth="1.5" />
            <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fill="currentColor" className="text-foreground">
              {n.label.length > 14 ? n.label.slice(0, 13) + "…" : n.label}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="36" fill="oklch(0.72 0.18 155 / 0.25)" stroke="oklch(0.72 0.18 155)" strokeWidth="2" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor" className="text-foreground">
        {centerLabel.length > 12 ? centerLabel.slice(0, 11) + "…" : centerLabel}
      </text>
    </svg>
  );
}

type NodeType = "farmer" | "bank" | "coop" | "weather" | "market" | "input" | "neighbor";

type Node = {
  id: string;
  x: number;
  y: number;
  label: string;
  type: NodeType;
  size?: number;
};

// Hub-and-spoke: Farmer in the center, partners radiating outward.
const nodes: Node[] = [
  { id: "farmer", x: 50, y: 54, label: "Farmer", type: "farmer", size: 4.4 },
  { id: "inputs", x: 50, y: 14, label: "Inputs", type: "input", size: 2.2 },
  { id: "bank", x: 20, y: 26, label: "Bank", type: "bank", size: 2.6 },
  { id: "coop", x: 82, y: 26, label: "Cooperative", type: "coop", size: 2.4 },
  { id: "weather", x: 12, y: 60, label: "Weather", type: "weather", size: 2.2 },
  { id: "market", x: 88, y: 62, label: "Market", type: "market", size: 2.4 },
  { id: "n1", x: 28, y: 90, label: "Neighbor", type: "neighbor", size: 2.2 },
  { id: "n2", x: 72, y: 90, label: "Neighbor", type: "neighbor", size: 2.2 },
];

const edges: [string, string][] = [
  ["farmer", "inputs"],
  ["farmer", "bank"],
  ["farmer", "coop"],
  ["farmer", "weather"],
  ["farmer", "market"],
  ["farmer", "n1"],
  ["farmer", "n2"],
];

const colorFor = (t: NodeType) =>
  ({
    farmer: "var(--emerald)",
    bank: "var(--sky)",
    coop: "var(--gold)",
    weather: "var(--violet)",
    market: "var(--orange)",
    input: "var(--emerald-glow)",
    neighbor: "var(--emerald)",
  })[t];

export function GraphHero() {
  const find = (id: string) => nodes.find((n) => n.id === id)!;

  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.55" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="centerHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(0.72 0.18 155)" stopOpacity="0.45" />
          <stop offset="60%" stopColor="oklch(0.72 0.18 155)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="oklch(0.72 0.18 155)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft halo behind farmer */}
      <circle cx={50} cy={54} r={32} fill="url(#centerHalo)" />

      {/* Spokes: dashed lines radiating from Farmer */}
      {edges.map(([a, b], i) => {
        const na = find(a);
        const nb = find(b);
        return (
          <line
            key={i}
            x1={na.x}
            y1={na.y}
            x2={nb.x}
            y2={nb.y}
            stroke="oklch(0.72 0.18 155 / 0.55)"
            strokeWidth="0.25"
            strokeDasharray="1.2 1.4"
            strokeLinecap="round"
            style={{
              strokeDashoffset: 60,
              animation: `draw 1.8s ease-out ${0.2 + i * 0.1}s forwards`,
            }}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((n, i) => {
        const r = n.size ?? 2.2;
        const isFarmer = n.type === "farmer";
        return (
          <g
            key={n.id}
            style={{
              transformOrigin: `${n.x}px ${n.y}px`,
              animation: isFarmer
                ? undefined
                : `float-node 7s ease-in-out ${i * 0.4}s infinite`,
              ["--fx" as never]: `${(i % 2 ? 1 : -1) * 0.5}px`,
              ["--fy" as never]: `${(i % 3 ? -1 : 1) * 0.6}px`,
            }}
          >
            {/* Outer soft glow */}
            <circle cx={n.x} cy={n.y} r={r * 2.4} fill="url(#nodeGlow)" opacity="0.45" />
            {/* Ring */}
            <circle
              cx={n.x}
              cy={n.y}
              r={r * 1.15}
              fill="none"
              stroke={colorFor(n.type)}
              strokeOpacity="0.35"
              strokeWidth="0.25"
            />
            {/* Core dot */}
            <circle
              cx={n.x}
              cy={n.y}
              r={r}
              fill={colorFor(n.type)}
              stroke="white"
              strokeOpacity="0.4"
              strokeWidth="0.2"
            />
            {n.label && (
              <text
                x={n.x}
                y={n.y + r + 2.6}
                textAnchor="middle"
                fontSize="2.1"
                fill="oklch(0.97 0 0 / 0.85)"
                fontWeight="500"
                style={{ letterSpacing: "0.02em" }}
              >
                {n.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

type Node = {
  id: string;
  x: number;
  y: number;
  r: number;
  label: string;
  type: "farmer" | "bank" | "coop" | "weather" | "market" | "input";
};

const nodes: Node[] = [
  { id: "f1", x: 50, y: 50, r: 26, label: "Farmer", type: "farmer" },
  { id: "b1", x: 18, y: 22, r: 18, label: "Bank", type: "bank" },
  { id: "c1", x: 82, y: 24, r: 18, label: "Coop", type: "coop" },
  { id: "w1", x: 12, y: 70, r: 14, label: "Weather", type: "weather" },
  { id: "m1", x: 86, y: 72, r: 16, label: "Market", type: "market" },
  { id: "i1", x: 50, y: 88, r: 14, label: "Inputs", type: "input" },
  { id: "f2", x: 32, y: 80, r: 10, label: "", type: "farmer" },
  { id: "f3", x: 70, y: 82, r: 10, label: "", type: "farmer" },
  { id: "f4", x: 35, y: 12, r: 9, label: "", type: "farmer" },
  { id: "f5", x: 66, y: 10, r: 9, label: "", type: "farmer" },
];

const edges: [string, string][] = [
  ["f1", "b1"], ["f1", "c1"], ["f1", "w1"], ["f1", "m1"], ["f1", "i1"],
  ["c1", "f3"], ["c1", "f5"], ["b1", "f4"], ["b1", "f2"], ["m1", "f3"],
  ["w1", "f2"], ["i1", "f3"], ["i1", "f2"],
];

const colorFor = (t: Node["type"]) =>
  ({
    farmer: "var(--emerald)",
    bank: "var(--sky)",
    coop: "var(--gold)",
    weather: "var(--violet)",
    market: "var(--orange)",
    input: "var(--emerald-glow)",
  })[t];

export function GraphHero() {
  const find = (id: string) => nodes.find((n) => n.id === id)!;

  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.5" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="edgeGrad" x1="0" x2="1">
          <stop offset="0%" stopColor="oklch(0.72 0.18 155)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="oklch(0.78 0.13 230)" stopOpacity="0.7" />
        </linearGradient>
      </defs>

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
            stroke="url(#edgeGrad)"
            strokeWidth="0.18"
            strokeDasharray="100"
            strokeDashoffset="100"
            style={{
              animation: `draw 2s ease-out ${i * 0.12}s forwards`,
            }}
          />
        );
      })}

      {nodes.map((n, i) => (
        <g
          key={n.id}
          style={{
            transformOrigin: `${n.x}px ${n.y}px`,
            animation: `float-node 6s ease-in-out ${i * 0.3}s infinite`,
            ["--fx" as never]: `${(i % 2 ? 1 : -1) * 0.4}px`,
            ["--fy" as never]: `${(i % 3 ? -1 : 1) * 0.5}px`,
          }}
        >
          <circle cx={n.x} cy={n.y} r={n.r / 8} fill="url(#nodeGlow)" opacity="0.6" />
          <circle
            cx={n.x}
            cy={n.y}
            r={n.r / 18}
            fill={colorFor(n.type)}
            stroke="white"
            strokeOpacity="0.3"
            strokeWidth="0.15"
          />
          {n.label && (
            <text
              x={n.x}
              y={n.y + n.r / 10}
              textAnchor="middle"
              fontSize="1.2"
              fill="oklch(0.97 0 0 / 0.85)"
              fontWeight="600"
              style={{ paintOrder: "stroke", letterSpacing: "0.02em" }}
            >
              {n.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

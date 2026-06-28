import type { GraphData } from "@/lib/graph.functions";

const COLORS: Record<string, string> = {
  Farmer: "#1F5A3D",
  Cooperative: "#2E8B57",
  Lender: "#7A5230",
  Buyer: "#F4B942",
  InputSupplier: "#A8D5BA",
  ClimateEvent: "#C0392B",
  ExtensionOfficer: "#3577B2",
  SavingsGroup: "#9C6644",
  Training: "#7A5230",
  Loan: "#7A5230",
  Crop: "#5A8A4D",
  Node: "#6B6457",
};

export function RelationshipGraph({ data, size = 520 }: { data: GraphData; size?: number }) {
  const r = size / 2 - 70;
  const cx = size / 2;
  const cy = size / 2;
  const nodes = data.nodes;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full max-w-[560px]">
      {nodes.map((n, i) => {
        const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        return (
          <g key={n.id + i}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="#A8D5BA" strokeWidth={1.5} strokeDasharray="4 4" />
            <text x={(cx + x) / 2} y={(cy + y) / 2 - 4} fontSize={9} fill="#6B6457" textAnchor="middle">
              {data.links[i]?.rel ?? ""}
            </text>
            <circle cx={x} cy={y} r={26} fill="white" stroke={COLORS[n.type] ?? "#6B6457"} strokeWidth={2} />
            <text x={x} y={y - 1} fontSize={10} fontWeight={600} fill={COLORS[n.type] ?? "#2B2B2B"} textAnchor="middle">
              {n.label.slice(0, 10)}
            </text>
            <text x={x} y={y + 10} fontSize={8} fill="#6B6457" textAnchor="middle">{n.type}</text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={42} fill="#1F5A3D" />
      <text x={cx} y={cy - 2} fontSize={12} fontWeight={700} fill="white" textAnchor="middle">{data.center.label.slice(0, 12)}</text>
      <text x={cx} y={cy + 12} fontSize={9} fill="#A8D5BA" textAnchor="middle">Farmer</text>
    </svg>
  );
}

export default function GrowthChart({ amount, rate, months }) {
  if (!amount || !rate || !months) return null;

  const width = 220;
  const height = 56;
  const pad = 8;
  const steps = Math.min(months, 12);

  const points = Array.from({ length: steps + 1 }, (_, index) => {
    const month = (index / steps) * months;
    return amount * Math.pow(1 + rate / 100 / 12, month);
  });

  const min = amount * 0.995;
  const max = points[points.length - 1];
  const coords = points.map((value, index) => ({
    x: pad + (index / steps) * (width - pad * 2),
    y: height - pad - ((value - min) / (max - min || 1)) * (height - pad * 2),
  }));

  const linePath = coords
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const fillPath = `${linePath} L ${coords[coords.length - 1].x} ${height - pad} L ${pad} ${height - pad} Z`;

  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="gFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#gFill)" />
      <path
        d={linePath}
        fill="none"
        stroke="#10b981"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="3.5" fill="#10b981" />
    </svg>
  );
}

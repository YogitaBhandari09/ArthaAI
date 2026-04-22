import { getLangCopy } from "../i18n/copy";

function statusColor(status) {
  if (status === "ok" || status === "up") return "#10b981";
  if (status === "degraded" || status === "unknown") return "#f59e0b";
  return "#ef4444";
}

function statusLabel(status, copy) {
  if (status === "ok" || status === "up") return copy.live;
  if (status === "degraded") return copy.degraded;
  if (status === "unknown") return copy.unknown;
  return copy.offline;
}

export default function SystemStatusBar({ status, lang = "hi-IN" }) {
  const labels = getLangCopy(lang).status;
  const backend = status?.backend?.status || "down";
  const ml = status?.ml?.status || "down";
  const overall = status?.status || "down";
  const aiConfigured = Boolean(status?.ai?.configured);

  return (
    <div
      style={{
        margin: "8px 14px 0",
        padding: "8px 10px",
        borderRadius: "10px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: statusColor(overall),
            boxShadow: `0 0 10px ${statusColor(overall)}`,
          }}
        />
        <span style={{ color: "#d1d5db", fontSize: "12px", fontWeight: 600 }}>
          {labels.system} {statusLabel(overall, labels)}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "#9ca3af" }}>
        <span style={{ color: statusColor(backend) }}>
          {labels.backend} {statusLabel(backend, labels)}
        </span>
        <span style={{ color: statusColor(ml) }}>
          {labels.ml} {statusLabel(ml, labels)}
        </span>
        <span style={{ color: aiConfigured ? "#10b981" : "#f59e0b" }}>
          {labels.ai} {aiConfigured ? labels.aiSet : labels.aiMissing}
        </span>
      </div>
    </div>
  );
}

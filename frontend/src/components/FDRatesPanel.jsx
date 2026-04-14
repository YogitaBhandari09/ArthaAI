import { X } from "lucide-react";
import { FD_RATES } from "../utils/fdCalculator";

export default function FDRatesPanel({ onClose }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        animation: "fadeUp 0.2s ease",
      }}
    >
      <div
        style={{
          width: "100%",
          background: "#0d1526",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px 20px 0 0",
          padding: "20px 16px 24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#e8eaf0" }}>📈 आज की FD दरें</div>
            <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>April 2026 · 12 महीने की FD</div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "30px",
              height: "30px",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "50%",
              color: "#8b92a5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {FD_RATES.map((rateItem, index) => (
          <div
            key={rateItem.name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 12px",
              background: index === 0 ? "rgba(16,185,129,0.07)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${
                index === 0 ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)"
              }`,
              borderRadius: "10px",
              marginBottom: "6px",
            }}
          >
            <div>
              <div style={{ fontSize: "13px", color: "#e8eaf0", fontWeight: index === 0 ? 600 : 400 }}>
                {rateItem.name}
              </div>
              {rateItem.badge && <div style={{ fontSize: "10px", color: rateItem.color, marginTop: "2px" }}>★ {rateItem.badge}</div>}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, color: rateItem.color }}>{rateItem.rate}</span>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>%</span>
            </div>
          </div>
        ))}

        <div style={{ fontSize: "11px", color: "#374151", textAlign: "center", marginTop: "10px" }}>
          * DICGC के तहत ₹5 लाख तक बीमित
        </div>
      </div>
    </div>
  );
}

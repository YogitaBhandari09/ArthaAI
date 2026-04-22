import { useState } from "react";
import { Calculator, RotateCcw, X } from "lucide-react";
import { calculateFD } from "../services/api";
import { getLangCopy } from "../i18n/copy";

const TENURE_OPTIONS = [6, 9, 12, 18, 24, 36];

export default function WhatIfPanel({ onClose, defaultAmount = 10000, lang = "hi-IN" }) {
  const copy = getLangCopy(lang).whatIf;
  const [amount, setAmount] = useState(String(defaultAmount));
  const [rate, setRate] = useState("8.5");
  const [months, setMonths] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const runSimulation = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await calculateFD(Number(amount), Number(rate), Number(months));
      if (!response.ok) {
        setResult(null);
        setError(copy.simError);
        return;
      }
      setResult(response.data);
    } catch {
      setResult(null);
      setError(copy.simError);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAmount(String(defaultAmount));
    setRate("8.5");
    setMonths(12);
    setResult(null);
    setError("");
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 220,
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
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#e8eaf0" }}>{copy.title}</div>
            <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{copy.subtitle}</div>
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

        <div style={{ display: "grid", gap: "10px", marginBottom: "12px" }}>
          <label style={{ display: "grid", gap: "4px" }}>
            <span style={{ fontSize: "11px", color: "#9ca3af" }}>{copy.amount}</span>
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))}
              placeholder="10000"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                padding: "10px 12px",
                color: "#e8eaf0",
                fontSize: "14px",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: "4px" }}>
            <span style={{ fontSize: "11px", color: "#9ca3af" }}>{copy.annualRate}</span>
            <input
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              placeholder="8.5"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                padding: "10px 12px",
                color: "#e8eaf0",
                fontSize: "14px",
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "14px" }}>
          <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "7px" }}>{copy.tenure}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {TENURE_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => setMonths(option)}
                style={{
                  padding: "7px 10px",
                  borderRadius: "999px",
                  border: "1px solid rgba(240,165,0,0.25)",
                  background: months === option ? "rgba(240,165,0,0.16)" : "rgba(240,165,0,0.06)",
                  color: months === option ? "#f0a500" : "#d2aa52",
                  fontSize: "12px",
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={runSimulation}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #f0a500, #c07800)",
              color: "#111827",
              fontSize: "13px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              opacity: loading ? 0.75 : 1,
            }}
          >
            <Calculator size={14} />
            {loading ? copy.calculating : copy.run}
          </button>
          <button
            onClick={reset}
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#9ca3af",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <RotateCcw size={14} />
            {copy.reset}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: "10px",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1px solid rgba(239,68,68,0.35)",
              background: "rgba(127,29,29,0.25)",
              color: "#fca5a5",
              fontSize: "12px",
            }}
          >
            {error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: "14px", display: "grid", gap: "8px" }}>
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid rgba(16,185,129,0.25)",
                background: "rgba(16,185,129,0.08)",
              }}
            >
              <div style={{ fontSize: "11px", color: "#9ca3af" }}>{copy.estimated}</div>
              <div style={{ fontSize: "22px", color: "#10b981", fontWeight: 800 }}>
                Rs {Number(result.maturity || 0).toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: "12px", color: "#6ee7b7" }}>
                {copy.profit}: Rs {Number(result.profit || 0).toLocaleString("en-IN")}
              </div>
            </div>

            {Array.isArray(result.comparison) && result.comparison.length > 0 && (
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                {result.comparison.map((item) => (
                  <div
                    key={item.bank}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 10px",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div>
                      <div style={{ color: "#e5e7eb", fontSize: "12px" }}>{item.bank}</div>
                      <div style={{ color: "#9ca3af", fontSize: "11px" }}>
                        {item.rate}% {copy.perAnnum}
                      </div>
                    </div>
                    <div style={{ color: "#10b981", fontSize: "13px", fontWeight: 700 }}>
                      Rs {Number(item.maturity || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

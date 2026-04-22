import { useMemo, useState } from "react";
import { Calculator, ChevronDown } from "lucide-react";
import GrowthChart from "./GrowthChart";
import { calculateFDMaturity } from "../utils/fdCalculator";
import { getLangCopy } from "../i18n/copy";

export default function AdviceCard({ card, lang = "hi-IN" }) {
  const copy = getLangCopy(lang).advice;
  const [open, setOpen] = useState(false);
  const [myAmount, setMyAmount] = useState("");

  const myResult = useMemo(() => {
    if (!myAmount) return null;
    const calc = calculateFDMaturity(Number(myAmount), card.rate, card.months);
    return calc.maturity > 0 ? calc.maturity : null;
  }, [card.months, card.rate, myAmount]);

  if (!card || card.product === "None") return null;
  const profit = Number(card.returns || 0) - Number(card.amount || 0);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(240,165,0,0.18)",
        borderLeft: "3px solid #f0a500",
        borderRadius: "12px",
        padding: "14px",
        marginTop: "10px",
        animation: "fadeUp 0.4s ease both",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "10px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "10px",
              color: "#f0a500",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "3px",
            }}
          >
            {card.product === "FD" ? "Fixed Deposit" : card.product}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#e8eaf0" }}>
            {card.bank || copy.bestRateBank}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#10b981", lineHeight: 1 }}>
            {card.rate}%
          </div>
          <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px" }}>
            {copy.pa} · {card.months} {copy.monthsLabel}
          </div>
        </div>
      </div>

      {card.amount > 0 && card.returns > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(16,185,129,0.07)",
            border: "1px solid rgba(16,185,129,0.15)",
            borderRadius: "10px",
            padding: "10px 12px",
            marginBottom: "10px",
          }}
        >
          <div>
            <div style={{ fontSize: "10px", color: "#6b7280" }}>{copy.yourMoney}</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#e8eaf0" }}>
              Rs {Number(card.amount).toLocaleString("en-IN")}
            </div>
          </div>
          <div style={{ flex: 1, height: "1px", background: "rgba(16,185,129,0.3)" }} />
          <div style={{ fontSize: "18px", color: "#10b981" }}>→</div>
          <div style={{ flex: 1, height: "1px", background: "rgba(16,185,129,0.3)" }} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", color: "#6b7280" }}>{copy.afterMonths(card.months)}</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#10b981" }}>
              Rs {Number(card.returns).toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}

      {card.amount > 0 && (
        <div style={{ marginBottom: "8px" }}>
          <GrowthChart amount={Number(card.amount)} rate={Number(card.rate)} months={Number(card.months)} />
        </div>
      )}

      {profit > 0 && (
        <div style={{ fontSize: "12px", color: "#10b981", marginBottom: "6px" }}>
          {copy.gain(card.months, profit)}
        </div>
      )}

      {card.tip && (
        <div style={{ fontSize: "12px", color: "#8b92a5", fontStyle: "italic", marginBottom: "10px" }}>
          💡 {card.tip}
        </div>
      )}

      <button
        onClick={() => setOpen((previous) => !previous)}
        style={{
          width: "100%",
          padding: "8px 12px",
          background: "rgba(240,165,0,0.07)",
          border: "1px solid rgba(240,165,0,0.18)",
          borderRadius: "8px",
          color: "#f0a500",
          fontSize: "13px",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}
      >
        <Calculator size={13} />
        {copy.calcWithAmount}
        <ChevronDown size={13} style={{ transform: open ? "rotate(180deg)" : "none", transition: "0.2s" }} />
      </button>

      {open && (
        <div style={{ marginTop: "10px", animation: "fadeUp 0.25s ease" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ color: "#6b7280", fontSize: "15px" }}>Rs</span>
            <input
              value={myAmount}
              onChange={(event) => setMyAmount(event.target.value.replace(/\D/g, ""))}
              placeholder={copy.amountPlaceholder}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "8px 12px",
                color: "#e8eaf0",
                fontSize: "14px",
              }}
            />
          </div>

          {myResult && (
            <div
              style={{
                marginTop: "8px",
                padding: "10px 12px",
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.15)",
                borderRadius: "8px",
                animation: "fadeUp 0.2s ease",
              }}
            >
              <span style={{ color: "#6b7280", fontSize: "12px" }}>{copy.afterMonths(card.months)}: </span>
              <span style={{ color: "#10b981", fontWeight: 700, fontSize: "16px" }}>
                Rs {myResult.toLocaleString("en-IN")}
              </span>
              <span style={{ color: "#6b7280", fontSize: "12px" }}>
                {" "}
                (+Rs {(myResult - Number(myAmount)).toLocaleString("en-IN")})
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

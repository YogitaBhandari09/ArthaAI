import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, TrendingUp, X, Calculator, ChevronDown, Volume2 } from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Artha (अर्थ), a warm and friendly AI financial advisor for rural and semi-urban India. You are like a trusted older sibling who helps with money.

ALWAYS respond with ONLY valid JSON — no markdown, no backticks, no extra text:
{
  "reply": "Your warm, simple Hindi response in Devanagari script",
  "product": "FD" or "RD" or "SavingsAccount" or "MutualFund" or "None",
  "bank": "best bank name for this product, or empty string",
  "rate": interest rate as a number (e.g. 8.5), or 0,
  "amount": amount extracted from query as number, or 0,
  "months": tenure in months as number, or 0,
  "returns": calculated maturity amount as number, or 0,
  "tip": "one short helpful Hindi tip, or empty string"
}

Rules:
- Always respond in simple, warm conversational Hindi (Devanagari). Like talking to a close friend.
- Never use financial jargon without explaining. FD = "बैंक में पैसा रखकर ब्याज कमाना"
- Keep replies concise — 2-3 sentences max.
- For FD maturity: amount × (1 + rate/100/12)^months
- Best FD rates today (April 2025): Unity SFB 9.0%, Suryoday SFB 8.5%, ESAF SFB 8.25%, Utkarsh SFB 8.0%, SBI 6.8%
- If not a financial query, still respond warmly in Hindi and set product to "None"`;

const FD_RATES = [
  { name: "Unity Small Finance Bank", rate: 9.0, badge: "सबसे अच्छा", color: "#10b981" },
  { name: "Suryoday Small Finance Bank", rate: 8.5, badge: "", color: "#10b981" },
  { name: "ESAF Small Finance Bank", rate: 8.25, badge: "", color: "#10b981" },
  { name: "Utkarsh Small Finance Bank", rate: 8.0, badge: "", color: "#f59e0b" },
  { name: "AU Small Finance Bank", rate: 7.75, badge: "", color: "#f59e0b" },
  { name: "State Bank of India", rate: 6.8, badge: "सबसे सुरक्षित", color: "#6b7280" },
];

const LANGS = [
  { code: "hi-IN", short: "हि", label: "Hindi" },
  { code: "bn-IN", short: "বাং", label: "Bengali" },
  { code: "ta-IN", short: "தமி", label: "Tamil" },
];

const QUICK_CHIPS = [
  "मेरे पास ₹10,000 हैं, क्या करूँ?",
  "FD क्या होती है?",
  "₹25,000 को 12 महीने के लिए कहाँ रखूँ?",
  "SBI और Suryoday FD में क्या फ़र्क है?",
];

// ── CSS Animations ─────────────────────────────────────────────────

const KEYFRAMES = `
  @keyframes pulseRing {
    0%   { transform: scale(1); opacity: 0.5; }
    100% { transform: scale(2.6); opacity: 0; }
  }
  @keyframes slideRight {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideLeft {
    from { opacity: 0; transform: translateX(-20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes dotBounce {
    0%, 80%, 100% { transform: translateY(0);  opacity: 1;   }
    40%           { transform: translateY(-6px); opacity: 0.7; }
  }
  @keyframes spinLoad {
    to { transform: rotate(360deg); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1e2740; border-radius: 2px; }
  input { outline: none; }
  button { cursor: pointer; border: none; background: none; }
`;

// ── GrowthChart ────────────────────────────────────────────────────

function GrowthChart({ amount, rate, months }) {
  if (!amount || !rate || !months) return null;
  const W = 220, H = 56, PAD = 8;
  const steps = Math.min(months, 12);
  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const m = (i / steps) * months;
    return amount * Math.pow(1 + rate / 100 / 12, m);
  });
  const min = amount * 0.995, max = pts[pts.length - 1];
  const coords = pts.map((v, i) => ({
    x: PAD + (i / steps) * (W - PAD * 2),
    y: H - PAD - ((v - min) / (max - min)) * (H - PAD * 2),
  }));
  const linePath = coords.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const fillPath = linePath + ` L ${coords[coords.length - 1].x} ${H - PAD} L ${PAD} ${H - PAD} Z`;

  return (
    <svg width={W} height={H} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="gFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#gFill)" />
      <path d={linePath} fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="3.5" fill="#10b981" />
    </svg>
  );
}

// ── AdviceCard ─────────────────────────────────────────────────────

function AdviceCard({ card }) {
  const [open, setOpen] = useState(false);
  const [myAmt, setMyAmt] = useState("");
  const [myRes, setMyRes] = useState(null);

  if (!card || card.product === "None") return null;
  const profit = card.returns - card.amount;

  const calc = (a) => {
    if (!a || !card.rate || !card.months) return 0;
    return Math.round(Number(a) * Math.pow(1 + card.rate / 100 / 12, card.months));
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(240,165,0,0.18)",
      borderLeft: "3px solid #f0a500",
      borderRadius: "12px",
      padding: "14px",
      marginTop: "10px",
      animation: "fadeUp 0.4s ease both",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div>
          <div style={{ fontSize: "10px", color: "#f0a500", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "3px" }}>
            {card.product === "FD" ? "Fixed Deposit" : card.product}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#e8eaf0" }}>
            {card.bank || "बेस्ट रेट बैंक"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#10b981", lineHeight: 1 }}>{card.rate}%</div>
          <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px" }}>p.a. · {card.months} महीने</div>
        </div>
      </div>

      {/* Amount → Returns */}
      {card.amount > 0 && card.returns > 0 && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(16,185,129,0.07)",
          border: "1px solid rgba(16,185,129,0.15)",
          borderRadius: "10px",
          padding: "10px 12px",
          marginBottom: "10px",
        }}>
          <div>
            <div style={{ fontSize: "10px", color: "#6b7280" }}>आपका पैसा</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#e8eaf0" }}>₹{card.amount.toLocaleString("en-IN")}</div>
          </div>
          <div style={{ flex: 1, height: "1px", background: "rgba(16,185,129,0.3)" }} />
          <div style={{ fontSize: "18px", color: "#10b981" }}>→</div>
          <div style={{ flex: 1, height: "1px", background: "rgba(16,185,129,0.3)" }} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", color: "#6b7280" }}>{card.months} महीने बाद</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#10b981" }}>₹{card.returns.toLocaleString("en-IN")}</div>
          </div>
        </div>
      )}

      {/* Mini chart */}
      {card.amount > 0 && (
        <div style={{ marginBottom: "8px" }}>
          <GrowthChart amount={card.amount} rate={card.rate} months={card.months} />
        </div>
      )}

      {/* Profit */}
      {profit > 0 && (
        <div style={{ fontSize: "12px", color: "#10b981", marginBottom: "6px" }}>
          ✓ {card.months} महीने में ₹{profit.toLocaleString("en-IN")} का फ़ायदा
        </div>
      )}

      {/* Tip */}
      {card.tip && (
        <div style={{ fontSize: "12px", color: "#8b92a5", fontStyle: "italic", marginBottom: "10px" }}>
          💡 {card.tip}
        </div>
      )}

      {/* Calculator toggle */}
      <button
        onClick={() => setOpen(!open)}
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
        अपनी राशि से हिसाब लगाएँ
        <ChevronDown size={13} style={{ transform: open ? "rotate(180deg)" : "none", transition: "0.2s" }} />
      </button>

      {/* Inline calculator */}
      {open && (
        <div style={{ marginTop: "10px", animation: "fadeUp 0.25s ease" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ color: "#6b7280", fontSize: "15px" }}>₹</span>
            <input
              value={myAmt}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, "");
                setMyAmt(v);
                setMyRes(v ? calc(v) : null);
              }}
              placeholder="राशि लिखें"
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
          {myRes && (
            <div style={{
              marginTop: "8px",
              padding: "10px 12px",
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.15)",
              borderRadius: "8px",
              animation: "fadeUp 0.2s ease",
            }}>
              <span style={{ color: "#6b7280", fontSize: "12px" }}>{card.months} महीने बाद: </span>
              <span style={{ color: "#10b981", fontWeight: 700, fontSize: "16px" }}>₹{myRes.toLocaleString("en-IN")}</span>
              <span style={{ color: "#6b7280", fontSize: "12px" }}> (+₹{(myRes - Number(myAmt)).toLocaleString("en-IN")})</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── MessageBubble ──────────────────────────────────────────────────

function MessageBubble({ msg }) {
  if (msg.type === "thinking") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "14px", animation: "slideLeft 0.3s ease" }}>
        <div style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "4px 14px 14px 14px",
          padding: "12px 16px",
          display: "flex",
          gap: "5px",
          alignItems: "center",
        }}>
          {[0, 0.15, 0.3].map((d, i) => (
            <div key={i} style={{
              width: "7px", height: "7px",
              background: "#f0a500",
              borderRadius: "50%",
              animation: `dotBounce 1.2s ease-in-out ${d}s infinite`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  const isUser = msg.type === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "16px",
      animation: `${isUser ? "slideRight" : "slideLeft"} 0.3s ease`,
    }}>
      <div style={{ maxWidth: "83%", minWidth: "60px" }}>
        {!isUser && (
          <div style={{
            width: "26px", height: "26px",
            background: "linear-gradient(135deg, #f0a500, #c07800)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", fontWeight: 800, color: "#000",
            marginBottom: "5px",
          }}>अ</div>
        )}
        <div style={{
          background: isUser
            ? "linear-gradient(135deg, #1c3a5e 0%, #162d4a 100%)"
            : "rgba(255,255,255,0.05)",
          border: isUser
            ? "1px solid rgba(59,130,246,0.25)"
            : "1px solid rgba(255,255,255,0.07)",
          borderRadius: isUser ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
          padding: "11px 14px",
        }}>
          <p style={{
            color: "#e8eaf0",
            fontSize: "14px",
            lineHeight: "1.65",
            whiteSpace: "pre-wrap",
          }}>{msg.text}</p>
          {msg.card && <AdviceCard card={msg.card} />}
        </div>
        <div style={{
          fontSize: "11px",
          color: "#374151",
          marginTop: "4px",
          textAlign: isUser ? "right" : "left",
        }}>{msg.time}</div>
      </div>
    </div>
  );
}

// ── FDRatesPanel ───────────────────────────────────────────────────

function FDRatesPanel({ onClose }) {
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      background: "rgba(0,0,0,0.75)",
      backdropFilter: "blur(6px)",
      zIndex: 200,
      display: "flex",
      alignItems: "flex-end",
      animation: "fadeUp 0.2s ease",
    }}>
      <div style={{
        width: "100%",
        background: "#0d1526",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px 20px 0 0",
        padding: "20px 16px 24px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#e8eaf0" }}>📈 आज की FD दरें</div>
            <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>April 2025 · 12 महीने की FD</div>
          </div>
          <button onClick={onClose} style={{
            width: "30px", height: "30px",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "50%",
            color: "#8b92a5",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={15} />
          </button>
        </div>
        {FD_RATES.map((r, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 12px",
            background: i === 0 ? "rgba(16,185,129,0.07)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${i === 0 ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)"}`,
            borderRadius: "10px",
            marginBottom: "6px",
          }}>
            <div>
              <div style={{ fontSize: "13px", color: "#e8eaf0", fontWeight: i === 0 ? 600 : 400 }}>{r.name}</div>
              {r.badge && <div style={{ fontSize: "10px", color: r.color, marginTop: "2px" }}>★ {r.badge}</div>}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, color: r.color }}>{r.rate}</span>
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

// ── Main App ───────────────────────────────────────────────────────

export default function ArthaAI() {
  const now = () => new Date().toLocaleTimeString("hi-IN", { hour: "2-digit", minute: "2-digit" });

  const [messages, setMessages] = useState([{
    id: 1,
    type: "ai",
    text: "नमस्ते! मैं अर्थ हूँ — आपका अपना पैसों का दोस्त। 🙏\n\nहिंदी में बोलें या टाइप करें। मैं बताऊँगा कि आपके पैसों के लिए सबसे सही क्या है।",
    card: null,
    time: now(),
  }]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState(LANGS[0]);
  const [showRates, setShowRates] = useState(false);

  const chatEndRef = useRef(null);
  const waveRef = useRef(null);
  const waveAnimRef = useRef(null);
  const recogRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Waveform animation
  useEffect(() => {
    if (!listening || !waveRef.current) return;
    const canvas = waveRef.current;
    const ctx = canvas.getContext("2d");
    let frame = 0;

    const drawBar = (x, y, w, h) => {
      const r = Math.min(w / 2, 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
    };

    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 30;
      const bw = 5, gap = canvas.width / bars;

      for (let i = 0; i < bars; i++) {
        const h = Math.abs(Math.sin(frame * 0.07 + i * 0.38)) * 18
                + Math.abs(Math.sin(frame * 0.11 + i * 0.62)) * 10
                + Math.abs(Math.sin(frame * 0.05 + i * 0.22)) * 6 + 4;
        const x = i * gap + (gap - bw) / 2;
        const y = (canvas.height - h) / 2;
        const alpha = 0.35 + (h / 34) * 0.65;
        ctx.fillStyle = `rgba(240, 165, 0, ${alpha})`;
        drawBar(x, y, bw, h);
      }
      waveAnimRef.current = requestAnimationFrame(animate);
    };

    waveAnimRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(waveAnimRef.current);
  }, [listening]);

  const toggleMic = () => {
    if (listening) { recogRef.current?.stop(); setListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("इस browser में voice support नहीं है। कृपया टाइप करें।"); return; }
    const r = new SR();
    r.lang = lang.code;
    r.onstart = () => setListening(true);
    r.onresult = e => { setInput(e.results[0][0].transcript); setListening(false); };
    r.onerror = r.onend = () => setListening(false);
    recogRef.current = r;
    r.start();
  };

  const send = async (text) => {
    if (!text?.trim() || loading) return;
    const t = now();
    const uid = Date.now();
    setMessages(p => [...p, { id: uid, type: "user", text: text.trim(), time: t }]);
    setInput("");
    setLoading(true);
    const tid = uid + 1;
    setMessages(p => [...p, { id: tid, type: "thinking" }]);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 800,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: text.trim() }],
        }),
      });
      const data = await res.json();
      const raw = data.content?.map(c => c.text || "").join("") || "{}";

      let p = {};
      try { p = JSON.parse(raw.replace(/```json\n?|```\n?/g, "").trim()); }
      catch { p = { reply: raw, product: "None" }; }

      const aiMsg = {
        id: tid, type: "ai",
        text: p.reply || "माफ़ करें, कुछ गड़बड़ हुई।",
        card: p.product && p.product !== "None" ? {
          product: p.product, bank: p.bank || "",
          rate: Number(p.rate) || 0, amount: Number(p.amount) || 0,
          months: Number(p.months) || 0, returns: Number(p.returns) || 0,
          tip: p.tip || "",
        } : null,
        time: t,
      };
      setMessages(prev => prev.map(m => m.id === tid ? aiMsg : m));

      if (p.reply && window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(p.reply.slice(0, 200));
        u.lang = lang.code; u.rate = 0.85;
        window.speechSynthesis.speak(u);
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === tid
        ? { id: tid, type: "ai", text: "माफ़ करें, अभी दिक्क़त है। दोबारा कोशिश करें।", card: null, time: t }
        : m
      ));
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      background: "#080c18",
      color: "#e8eaf0",
      fontFamily: "-apple-system, 'Segoe UI', system-ui, sans-serif",
      minHeight: "100vh",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
      maxWidth: "480px",
      margin: "0 auto",
    }}>
      <style>{KEYFRAMES}</style>

      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: "-120px", right: "-80px",
        width: "320px", height: "320px",
        background: "radial-gradient(circle, rgba(240,165,0,0.05) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "60px", left: "-80px",
        width: "260px", height: "260px",
        background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* ── Header ── */}
      <div style={{
        padding: "11px 16px",
        background: "rgba(8,12,24,0.97)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px", height: "36px",
            background: "linear-gradient(135deg, #f0a500, #c07800)",
            borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "17px", fontWeight: 900, color: "#000",
            flexShrink: 0,
          }}>₹</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "15px", lineHeight: "1.15", letterSpacing: "-0.01em" }}>अर्थ AI</div>
            <div style={{ fontSize: "11px", color: "#4b5563" }}>आपका पैसों का दोस्त</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setShowRates(true)}
            style={{
              padding: "5px 10px",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.18)",
              borderRadius: "8px",
              color: "#10b981",
              fontSize: "12px",
              fontWeight: 500,
              display: "flex", alignItems: "center", gap: "4px",
            }}
          >
            <TrendingUp size={12} /> FD Rates
          </button>

          <div style={{
            display: "flex",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "8px",
            overflow: "hidden",
          }}>
            {LANGS.map(l => (
              <button key={l.code}
                onClick={() => setLang(l)}
                style={{
                  padding: "4px 8px",
                  background: lang.code === l.code ? "rgba(240,165,0,0.15)" : "transparent",
                  color: lang.code === l.code ? "#f0a500" : "#6b7280",
                  fontSize: "11px",
                  fontWeight: lang.code === l.code ? 700 : 400,
                  transition: "all 0.2s",
                }}
              >{l.short}</button>
            ))}
          </div>
        </div>
      </div>

      {/* FD Rates overlay */}
      {showRates && <FDRatesPanel onClose={() => setShowRates(false)} />}

      {/* ── Chat Area ── */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px 14px",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Quick chips — only at start */}
        {messages.length === 1 && (
          <div style={{ marginBottom: "20px", animation: "fadeUp 0.5s ease" }}>
            <div style={{ fontSize: "11px", color: "#374151", marginBottom: "8px" }}>ये पूछ सकते हैं:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
              {QUICK_CHIPS.map((c, i) => (
                <button key={i}
                  onClick={() => send(c)}
                  style={{
                    padding: "7px 12px",
                    background: "rgba(240,165,0,0.06)",
                    border: "1px solid rgba(240,165,0,0.14)",
                    borderRadius: "20px",
                    color: "#c8a040",
                    fontSize: "12px",
                    fontWeight: 500,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.target.style.background = "rgba(240,165,0,0.12)"; }}
                  onMouseLeave={e => { e.target.style.background = "rgba(240,165,0,0.06)"; }}
                >{c}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        <div ref={chatEndRef} />
      </div>

      {/* ── Input Area ── */}
      <div style={{
        padding: "10px 14px 16px",
        background: "rgba(8,12,24,0.98)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        flexShrink: 0,
      }}>
        {/* Waveform */}
        {listening && (
          <div style={{ textAlign: "center", marginBottom: "10px", animation: "fadeUp 0.2s ease" }}>
            <canvas ref={waveRef} width={260} height={40} style={{ display: "inline-block" }} />
            <div style={{
              fontSize: "12px", color: "#f0a500", marginTop: "3px",
              animation: "dotBounce 1s infinite",
            }}>
              सुन रहा हूँ...
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "9px", alignItems: "center" }}>
          {/* Mic button */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            {listening && (
              <>
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: "rgba(240,165,0,0.35)",
                  animation: "pulseRing 1s ease-out infinite",
                }} />
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: "rgba(240,165,0,0.2)",
                  animation: "pulseRing 1s ease-out 0.35s infinite",
                }} />
              </>
            )}
            <button
              onClick={toggleMic}
              style={{
                width: "44px", height: "44px",
                borderRadius: "50%",
                background: listening
                  ? "linear-gradient(135deg, #f0a500, #c07800)"
                  : "rgba(240,165,0,0.08)",
                border: `2px solid ${listening ? "#f0a500" : "rgba(240,165,0,0.25)"}`,
                color: listening ? "#000" : "#f0a500",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
                position: "relative", zIndex: 1,
              }}
            >
              {listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          </div>

          {/* Text input */}
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send(input)}
            placeholder={listening ? "सुन रहा हूँ..." : "हिंदी में लिखें..."}
            disabled={listening}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "22px",
              padding: "10px 16px",
              color: "#e8eaf0",
              fontSize: "14px",
              transition: "border-color 0.2s",
            }}
            onFocus={e => { e.target.style.borderColor = "rgba(240,165,0,0.3)"; }}
            onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.09)"; }}
          />

          {/* Send button */}
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            style={{
              width: "44px", height: "44px",
              borderRadius: "50%",
              background: input.trim() && !loading
                ? "linear-gradient(135deg, #f0a500, #c07800)"
                : "rgba(255,255,255,0.05)",
              border: "none",
              color: input.trim() && !loading ? "#000" : "#374151",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            {loading
              ? <div style={{
                  width: "16px", height: "16px",
                  border: "2px solid #374151",
                  borderTopColor: "#f0a500",
                  borderRadius: "50%",
                  animation: "spinLoad 0.6s linear infinite",
                }} />
              : <Send size={16} />
            }
          </button>
        </div>

        <div style={{ textAlign: "center", fontSize: "11px", color: "#1f2937", marginTop: "8px" }}>
          🎤 माइक दबाएँ और {lang.label} में बोलें
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Calculator, Send, TrendingUp, Volume2, VolumeX } from "lucide-react";
import AdviceCard from "./AdviceCard";
import FDRatesPanel from "./FDRatesPanel";
import SystemStatusBar from "./SystemStatusBar";
import VoiceButton from "./VoiceButton";
import OnboardingFlow from "./OnboardingFlow";
import WhatIfPanel from "./WhatIfPanel";
import useVoice from "../hooks/useVoice";
import useSpeech from "../hooks/useSpeech";
import useProfile from "../hooks/useProfile";
import { getSystemStatus, sendChat } from "../services/api";
import { getLangCopy } from "../i18n/copy";

const LANGS = [
  { code: "hi-IN", short: "हि", label: "Hindi" },
  { code: "bn-IN", short: "বাং", label: "Bengali" },
  { code: "ta-IN", short: "தமி", label: "Tamil" },
];

const VOICE_ASSIST_KEY = "artha_voice_assist_v1";
const TTS_WARNING = {
  "hi-IN": "इस डिवाइस में चुनी हुई भाषा की voice उपलब्ध नहीं है, इसलिए आवाज़ अंग्रेज़ी जैसी लग सकती है।",
  "bn-IN": "এই ডিভাইসে নির্বাচিত ভাষার voice নেই, তাই উচ্চারণ ইংরেজির মতো শোনাতে পারে।",
  "ta-IN": "இந்த சாதனத்தில் தேர்ந்தெடுத்த மொழிக்கான voice இல்லை, அதனால் ஆங்கில உச்சரிப்பு போல கேட்கலாம்.",
};

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
    0%, 80%, 100% { transform: translateY(0); opacity: 1; }
    40%           { transform: translateY(-6px); opacity: 0.7; }
  }
  @keyframes spinLoad {
    to { transform: rotate(360deg); }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1e2740; border-radius: 2px; }
  input { outline: none; }
  button { cursor: pointer; border: none; background: none; }
`;

const now = (locale) =>
  new Date().toLocaleTimeString(locale || "hi-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const buildWelcomeText = (name, copy) => (name ? copy.app.welcomeNamed(name) : copy.app.welcomeAnon);

const buildInitialMessages = (name, copy, locale) => [
  {
    id: 1,
    type: "ai",
    text: buildWelcomeText(name, copy),
    card: null,
    time: now(locale),
  },
];

function MessageBubble({ message, langCode, fallbackLabel }) {
  if (message.type === "thinking") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "14px", animation: "slideLeft 0.3s ease" }}>
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "4px 14px 14px 14px",
            padding: "12px 16px",
            display: "flex",
            gap: "5px",
            alignItems: "center",
          }}
        >
          {[0, 0.15, 0.3].map((delay, index) => (
            <div
              key={index}
              style={{
                width: "7px",
                height: "7px",
                background: "#f0a500",
                borderRadius: "50%",
                animation: `dotBounce 1.2s ease-in-out ${delay}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  const isUser = message.type === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "16px",
        animation: `${isUser ? "slideRight" : "slideLeft"} 0.3s ease`,
      }}
    >
      <div style={{ maxWidth: "83%", minWidth: "60px" }}>
        {!isUser && (
          <div
            style={{
              width: "26px",
              height: "26px",
              background: "linear-gradient(135deg, #f0a500, #c07800)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 800,
              color: "#000",
              marginBottom: "5px",
            }}
          >
            ₹
          </div>
        )}
        <div
          style={{
            background: isUser ? "linear-gradient(135deg, #1c3a5e 0%, #162d4a 100%)" : "rgba(255,255,255,0.05)",
            border: isUser ? "1px solid rgba(59,130,246,0.25)" : "1px solid rgba(255,255,255,0.07)",
            borderRadius: isUser ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
            padding: "11px 14px",
          }}
        >
          <p style={{ color: "#e8eaf0", fontSize: "14px", lineHeight: "1.65", whiteSpace: "pre-wrap" }}>{message.text}</p>
          {!isUser && message.fallback && (
            <div
              style={{
                marginTop: "7px",
                fontSize: "11px",
                color: "#f59e0b",
                padding: "4px 8px",
                borderRadius: "999px",
                display: "inline-block",
                border: "1px solid rgba(245,158,11,0.3)",
                background: "rgba(245,158,11,0.08)",
              }}
            >
              {fallbackLabel}
            </div>
          )}
          {message.card && <AdviceCard card={message.card} lang={langCode} />}
        </div>
        <div style={{ fontSize: "11px", color: "#374151", marginTop: "4px", textAlign: isUser ? "right" : "left" }}>{message.time}</div>
      </div>
    </div>
  );
}

export default function ArthaChat() {
  const [lang, setLang] = useState(LANGS[0]);
  const copy = useMemo(() => getLangCopy(lang.code), [lang.code]);

  const [messages, setMessages] = useState(() => buildInitialMessages("", copy, lang.code));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRates, setShowRates] = useState(false);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [voiceAssist, setVoiceAssist] = useState(true);
  const [systemStatus, setSystemStatus] = useState({
    status: "unknown",
    backend: { status: "unknown" },
    ml: { status: "unknown" },
    ai: { configured: false },
  });

  const { profile, updateProfile, isComplete } = useProfile();
  const { listening, transcript, startListening, stopListening, supported } = useVoice(lang.code);
  const { speak, stop, hasLanguageVoice } = useSpeech(lang.code);
  const chatEndRef = useRef(null);
  const lastSpokenMessageId = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (transcript?.trim()) setInput(transcript.trim());
  }, [transcript]);

  useEffect(() => {
    const saved = window.localStorage.getItem(VOICE_ASSIST_KEY);
    if (saved === "off") {
      setVoiceAssist(false);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(VOICE_ASSIST_KEY, voiceAssist ? "on" : "off");
    if (!voiceAssist) stop();
  }, [stop, voiceAssist]);

  useEffect(() => {
    if (isComplete) {
      const nextMessages = buildInitialMessages(profile.name, getLangCopy(lang.code), lang.code);
      setMessages(nextMessages);
      lastSpokenMessageId.current = null;
    }
  }, [isComplete, profile.name]);

  useEffect(() => {
    if (!voiceAssist) return;
    const latest = messages[messages.length - 1];
    if (!latest || latest.type !== "ai") return;
    if (lastSpokenMessageId.current === latest.id) return;

    lastSpokenMessageId.current = latest.id;
    speak(latest.text);
  }, [messages, speak, voiceAssist]);

  useEffect(() => {
    let active = true;

    const checkStatus = async () => {
      const response = await getSystemStatus();
      if (!active) return;

      if (response.ok && response.data) {
        setSystemStatus(response.data);
        return;
      }

      setSystemStatus({
        status: "down",
        backend: { status: "down" },
        ml: { status: "down" },
        ai: { configured: false },
      });
    };

    checkStatus();
    const timer = setInterval(checkStatus, 45000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const toggleMic = () => {
    if (!supported) return;
    if (listening) {
      stopListening();
      return;
    }
    startListening();
  };

  const profileContext = useMemo(
    () => ({
      age: Number(profile.age) || 0,
      income: Number(profile.income) || 0,
      savings: Number(profile.savings) || 0,
      goal: profile.goal || "",
      risk: profile.risk || "low",
      name: profile.name || "",
      language: lang.code,
    }),
    [profile, lang.code]
  );

  const sendMessage = async (text) => {
    const clean = text?.trim();
    if (!clean || loading) return;

    stopListening();
    stop();

    const timestamp = now(lang.code);
    const userId = Date.now();
    const thinkingId = userId + 1;

    setMessages((previous) => [...previous, { id: userId, type: "user", text: clean, time: timestamp }, { id: thinkingId, type: "thinking" }]);
    setInput("");
    setLoading(true);

    try {
      const response = await sendChat(clean, profileContext);

      if (!response.ok) {
        const backendError = String(response.error || "");
        const quotaError = response.status === 429 || backendError.toLowerCase().includes("quota");
        const errorText = quotaError
          ? copy.errors.quota
          : response.status === 0
            ? copy.errors.network
            : copy.errors.generic;

        const failMessage = { id: thinkingId, type: "ai", text: errorText, card: null, fallback: true, time: timestamp };
        setMessages((previous) => previous.map((item) => (item.id === thinkingId ? failMessage : item)));
        return;
      }

      const payload = response.data || {};
      const aiText = payload.reply || copy.errors.unknown;
      const card =
        payload.product && payload.product !== "None"
          ? {
              product: payload.product,
              bank: payload.bank || "",
              rate: Number(payload.rate) || 0,
              amount: Number(payload.amount) || 0,
              months: Number(payload.months) || 0,
              returns: Number(payload.returns) || 0,
              tip: payload.tip || "",
            }
          : null;

      const aiMessage = {
        id: thinkingId,
        type: "ai",
        text: aiText,
        card,
        fallback: Boolean(payload.fallback),
        time: timestamp,
      };
      setMessages((previous) => previous.map((item) => (item.id === thinkingId ? aiMessage : item)));
    } catch {
      const failMessage = {
        id: thinkingId,
        type: "ai",
        text: copy.errors.generic,
        card: null,
        fallback: true,
        time: timestamp,
      };
      setMessages((previous) => previous.map((item) => (item.id === thinkingId ? failMessage : item)));
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = (data) => {
    updateProfile(data);
  };

  const handleOnboardingSkip = () => {
    updateProfile({
      name: copy.app.skipName,
      age: 30,
      income: 15000,
      savings: 0,
      goal: "emergency",
      risk: "low",
    });
  };

  if (!isComplete) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} lang={lang.code} />;
  }

  return (
    <div
      style={{
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
      }}
    >
      <style>{KEYFRAMES}</style>

      <div
        style={{
          position: "absolute",
          top: "-120px",
          right: "-80px",
          width: "320px",
          height: "320px",
          background: "radial-gradient(circle, rgba(240,165,0,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "60px",
          left: "-80px",
          width: "260px",
          height: "260px",
          background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          padding: "11px 16px",
          background: "rgba(8,12,24,0.97)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, #f0a500, #c07800)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "17px",
              fontWeight: 900,
              color: "#000",
              flexShrink: 0,
            }}
          >
            ₹
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "15px", lineHeight: "1.15", letterSpacing: "-0.01em" }}>{copy.app.title}</div>
            <div style={{ fontSize: "11px", color: "#4b5563" }}>{copy.app.subtitle}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", flexWrap: "wrap" }}>
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
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <TrendingUp size={12} /> {copy.app.fdRates}
          </button>
          <button
            onClick={() => setShowWhatIf(true)}
            style={{
              padding: "5px 10px",
              background: "rgba(240,165,0,0.08)",
              border: "1px solid rgba(240,165,0,0.2)",
              borderRadius: "8px",
              color: "#f0a500",
              fontSize: "12px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Calculator size={12} /> {copy.app.whatIf}
          </button>
          <button
            onClick={() => setVoiceAssist((prev) => !prev)}
            style={{
              padding: "5px 10px",
              background: voiceAssist ? "rgba(59,130,246,0.16)" : "rgba(107,114,128,0.12)",
              border: `1px solid ${voiceAssist ? "rgba(59,130,246,0.3)" : "rgba(107,114,128,0.3)"}`,
              borderRadius: "8px",
              color: voiceAssist ? "#93c5fd" : "#9ca3af",
              fontSize: "12px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {voiceAssist ? <Volume2 size={12} /> : <VolumeX size={12} />}
            {voiceAssist ? copy.app.voiceAssistOn : copy.app.voiceAssistOff}
          </button>

          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            {LANGS.map((language) => (
              <button
                key={language.code}
                onClick={() => setLang(language)}
                style={{
                  padding: "4px 8px",
                  background: lang.code === language.code ? "rgba(240,165,0,0.15)" : "transparent",
                  color: lang.code === language.code ? "#f0a500" : "#6b7280",
                  fontSize: "11px",
                  fontWeight: lang.code === language.code ? 700 : 400,
                  transition: "all 0.2s",
                }}
              >
                {language.short}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showRates && <FDRatesPanel onClose={() => setShowRates(false)} lang={lang.code} />}
      {showWhatIf && (
        <WhatIfPanel
          onClose={() => setShowWhatIf(false)}
          defaultAmount={Number(profile.savings) > 0 ? Number(profile.savings) : 10000}
          lang={lang.code}
        />
      )}
      <SystemStatusBar status={systemStatus} lang={lang.code} />

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column" }}>
        {messages.length === 1 && (
          <div style={{ marginBottom: "20px", animation: "fadeUp 0.5s ease" }}>
            <div style={{ fontSize: "11px", color: "#374151", marginBottom: "8px" }}>{copy.app.quickAsk}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
              {copy.app.quickChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
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
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            langCode={lang.code}
            fallbackLabel={copy.app.fallbackBadge}
          />
        ))}
        <div ref={chatEndRef} />
      </div>

      <div
        style={{
          padding: "10px 14px 16px",
          background: "rgba(8,12,24,0.98)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        <VoiceButton
          listening={listening}
          supported={supported}
          onToggle={toggleMic}
          showWaveform
          showButton={false}
          listeningText={copy.voiceButton.listening}
        />

        <div style={{ display: "flex", gap: "9px", alignItems: "center" }}>
          {supported && (
            <VoiceButton
              listening={listening}
              supported={supported}
              onToggle={toggleMic}
              showWaveform={false}
              showButton
              listeningText={copy.voiceButton.listening}
            />
          )}
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && sendMessage(input)}
            placeholder={listening ? copy.app.listeningPlaceholder : copy.app.typingPlaceholder}
            disabled={loading}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "22px",
              padding: "10px 16px",
              color: "#e8eaf0",
              fontSize: "14px",
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: input.trim() && !loading ? "linear-gradient(135deg, #f0a500, #c07800)" : "rgba(255,255,255,0.05)",
              border: "none",
              color: input.trim() && !loading ? "#000" : "#374151",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            {loading ? (
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid #374151",
                  borderTopColor: "#f0a500",
                  borderRadius: "50%",
                  animation: "spinLoad 0.6s linear infinite",
                }}
              />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>

        {!supported ? (
          <div style={{ textAlign: "center", fontSize: "11px", color: "#f59e0b", marginTop: "8px" }}>
            {copy.app.noVoice}
          </div>
        ) : (
          <div style={{ textAlign: "center", fontSize: "11px", color: "#1f2937", marginTop: "8px" }}>
            {copy.app.micHint}
          </div>
        )}
        {supported && !hasLanguageVoice && (
          <div style={{ textAlign: "center", fontSize: "11px", color: "#f59e0b", marginTop: "6px" }}>
            {TTS_WARNING[lang.code] || TTS_WARNING["hi-IN"]}
          </div>
        )}
      </div>
    </div>
  );
}

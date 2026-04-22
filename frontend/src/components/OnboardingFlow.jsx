import { useEffect, useMemo, useState } from "react";
import { Mic, MicOff, SkipForward } from "lucide-react";
import useVoice from "../hooks/useVoice";
import useSpeech from "../hooks/useSpeech";
import { getLangCopy } from "../i18n/copy";

const parseNumeric = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? Number(digits) : 0;
};

export default function OnboardingFlow({ onComplete, onSkip, lang = "hi-IN" }) {
  const copy = getLangCopy(lang);
  const steps = copy.onboarding.steps;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    name: "",
    age: "",
    income: "",
    goal: "",
  });
  const [input, setInput] = useState("");

  const { listening, transcript, startListening, stopListening, supported } = useVoice(lang);
  const { speak, stop } = useSpeech(lang);

  const current = steps[step];

  useEffect(() => {
    setInput(answers[current.key] || "");
    speak(current.question);
    return () => stop();
  }, [answers, current, speak, stop]);

  useEffect(() => {
    if (!transcript) return;
    if (current.key === "age" || current.key === "income") {
      const numeric = parseNumeric(transcript);
      setInput(numeric ? String(numeric) : "");
      return;
    }
    setInput(transcript);
  }, [current.key, transcript]);

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step, steps.length]);

  const canContinue = useMemo(() => {
    if (current.key === "goal") return Boolean(answers.goal || input);
    return Boolean(input.trim());
  }, [answers.goal, current.key, input]);

  const commitCurrentAnswer = () => {
    const value = input.trim();
    if (current.key === "age" || current.key === "income") {
      const numeric = parseNumeric(value);
      return numeric > 0 ? numeric : "";
    }
    return value;
  };

  const next = () => {
    const value = commitCurrentAnswer();
    const updated = {
      ...answers,
      [current.key]: current.key === "goal" ? answers.goal || value : value,
    };
    setAnswers(updated);

    if (step < steps.length - 1) {
      setStep((previous) => previous + 1);
      return;
    }

    const income = Number(updated.income) || 0;
    onComplete({
      name: String(updated.name || "").trim(),
      age: Number(updated.age) || 0,
      income,
      savings: Math.round(income * 0.15),
      goal: updated.goal || "emergency",
      risk: "low",
    });
  };

  const selectGoal = (goal) => {
    setAnswers((previous) => ({ ...previous, goal }));
    setInput(goal);
  };

  const toggleListening = () => {
    if (listening) {
      stopListening();
      return;
    }
    startListening();
  };

  return (
    <div
      style={{
        background: "#080c18",
        color: "#e8eaf0",
        minHeight: "100vh",
        height: "100vh",
        maxWidth: "480px",
        margin: "0 auto",
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{ marginBottom: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ fontWeight: 700, fontSize: "15px" }}>
            {copy.onboarding.profileSetup} ({step + 1}/{steps.length})
          </div>
          <button
            onClick={onSkip}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "12px",
              color: "#6b7280",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "999px",
              padding: "6px 10px",
            }}
          >
            <SkipForward size={12} />
            {copy.onboarding.skip}
          </button>
        </div>
        <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "999px", overflow: "hidden" }}>
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "linear-gradient(90deg, #f0a500, #10b981)",
              transition: "width 0.25s ease",
            }}
          />
        </div>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: "16px",
          padding: "18px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          animation: "fadeUp 0.25s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              background: "linear-gradient(135deg, #f0a500, #c07800)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#000",
              fontWeight: 800,
            }}
          >
            ₹
          </div>
          <p style={{ fontSize: "15px", lineHeight: 1.5 }}>{current.question}</p>
        </div>

        {current.key !== "goal" && (
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && canContinue) next();
            }}
            placeholder={current.placeholder}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              padding: "11px 12px",
              color: "#e8eaf0",
              fontSize: "15px",
            }}
          />
        )}

        {current.key === "goal" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {current.chips.map((chip) => (
              <button
                key={chip.value}
                onClick={() => selectGoal(chip.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "999px",
                  border: "1px solid rgba(240,165,0,0.25)",
                  background: answers.goal === chip.value ? "rgba(240,165,0,0.17)" : "rgba(240,165,0,0.07)",
                  color: answers.goal === chip.value ? "#f0a500" : "#dfb760",
                  fontSize: "13px",
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {supported && (
            <button
              onClick={toggleListening}
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                border: `2px solid ${listening ? "#f0a500" : "rgba(240,165,0,0.25)"}`,
                background: listening ? "linear-gradient(135deg, #f0a500, #c07800)" : "rgba(240,165,0,0.08)",
                color: listening ? "#000" : "#f0a500",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}

          <button
            onClick={next}
            disabled={!canContinue}
            style={{
              flex: 1,
              padding: "11px 12px",
              borderRadius: "12px",
              background: canContinue ? "linear-gradient(135deg, #f0a500, #c07800)" : "rgba(255,255,255,0.08)",
              color: canContinue ? "#000" : "#4b5563",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            {step === steps.length - 1 ? copy.onboarding.start : copy.onboarding.next}
          </button>
        </div>

        {!supported && <p style={{ fontSize: "12px", color: "#f59e0b" }}>{copy.onboarding.noVoice}</p>}
      </div>
    </div>
  );
}

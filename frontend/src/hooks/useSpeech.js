import { useCallback, useEffect, useMemo, useState } from "react";

const SUPPORTED_LANGS = new Set(["hi-IN", "bn-IN", "ta-IN"]);

function normalizeLang(lang = "hi-IN") {
  const value = String(lang || "").toLowerCase();
  if (value.startsWith("bn")) return "bn-IN";
  if (value.startsWith("ta")) return "ta-IN";
  return "hi-IN";
}

function cleanSpeechText(text, lang) {
  let output = String(text || "").trim();
  const replacementsByLang = {
    "hi-IN": [
      [/\bRs\b/gi, "रुपये"],
      [/\bFD\b/gi, "एफ डी"],
      [/\bRD\b/gi, "आर डी"],
      [/%/g, " प्रतिशत "],
    ],
    "bn-IN": [
      [/\bRs\b/gi, "টাকা"],
      [/\bFD\b/gi, "এফ ডি"],
      [/\bRD\b/gi, "আর ডি"],
      [/%/g, " শতাংশ "],
    ],
    "ta-IN": [
      [/\bRs\b/gi, "ரூபாய்"],
      [/\bFD\b/gi, "எஃப் டி"],
      [/\bRD\b/gi, "ஆர் டி"],
      [/%/g, " சதவீதம் "],
    ],
  };

  const rules = replacementsByLang[normalizeLang(lang)] || [];
  for (const [pattern, replacement] of rules) {
    output = output.replace(pattern, replacement);
  }
  return output.replace(/\s+/g, " ").trim();
}

function pickVoice(voices, lang) {
  const normalized = normalizeLang(lang).toLowerCase();
  const base = normalized.split("-")[0];

  const exact = voices.find((voice) => String(voice.lang || "").toLowerCase() === normalized);
  if (exact) return exact;

  const regional = voices.find((voice) => String(voice.lang || "").toLowerCase().startsWith(`${base}-`));
  if (regional) return regional;

  const loose = voices.find((voice) => String(voice.lang || "").toLowerCase().includes(base));
  return loose || null;
}

export function useSpeech(lang = "hi-IN") {
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);

  const supported = useMemo(
    () => typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window,
    []
  );

  const normalizedLang = useMemo(
    () => (SUPPORTED_LANGS.has(normalizeLang(lang)) ? normalizeLang(lang) : "hi-IN"),
    [lang]
  );

  useEffect(() => {
    if (!supported) return undefined;

    const synth = window.speechSynthesis;
    const updateVoices = () => {
      setVoices(synth.getVoices() || []);
    };

    updateVoices();
    synth.addEventListener?.("voiceschanged", updateVoices);

    return () => {
      synth.removeEventListener?.("voiceschanged", updateVoices);
    };
  }, [supported]);

  const activeVoice = useMemo(() => pickVoice(voices, normalizedLang), [voices, normalizedLang]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text) => {
      if (!supported || !text?.trim()) return;

      stop();

      const utterance = new SpeechSynthesisUtterance(cleanSpeechText(text, normalizedLang));
      utterance.lang = activeVoice?.lang || normalizedLang;
      if (activeVoice) {
        utterance.voice = activeVoice;
      }
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [activeVoice, normalizedLang, stop, supported]
  );

  useEffect(() => () => stop(), [stop]);

  return {
    speak,
    stop,
    speaking,
    hasLanguageVoice: Boolean(activeVoice),
    activeVoiceName: activeVoice?.name || "",
  };
}

export default useSpeech;

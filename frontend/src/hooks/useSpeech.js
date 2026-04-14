import { useCallback, useEffect, useMemo, useState } from "react";

const SUPPORTED_LANGS = new Set(["hi-IN", "bn-IN", "ta-IN"]);

export function useSpeech(lang = "hi-IN") {
  const [speaking, setSpeaking] = useState(false);

  const supported = useMemo(
    () => typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window,
    []
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text) => {
      if (!supported || !text?.trim()) return;

      stop();

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.lang = SUPPORTED_LANGS.has(lang) ? lang : "hi-IN";
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [lang, stop, supported]
  );

  useEffect(() => () => stop(), [stop]);

  return { speak, stop, speaking };
}

export default useSpeech;

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SILENCE_MS = 2200;

export function useVoice(lang = "hi-IN") {
  const recognitionRef = useRef(null);
  const silenceRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const supported = useMemo(
    () => typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    []
  );

  const clearSilenceTimer = useCallback(() => {
    if (silenceRef.current) {
      clearTimeout(silenceRef.current);
      silenceRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors from inactive sessions.
      }
    }
    setListening(false);
  }, [clearSilenceTimer]);

  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceRef.current = setTimeout(() => {
      stopListening();
    }, SILENCE_MS);
  }, [clearSilenceTimer, stopListening]);

  const startListening = useCallback(() => {
    if (!supported) return false;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setTranscript("");
      setListening(true);
      resetSilenceTimer();
    };

    recognition.onresult = (event) => {
      const fullTranscript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();

      setTranscript(fullTranscript);
      resetSilenceTimer();
    };

    recognition.onerror = () => {
      setListening(false);
      clearSilenceTimer();
    };

    recognition.onend = () => {
      setListening(false);
      clearSilenceTimer();
    };

    recognitionRef.current = recognition;
    recognition.start();
    return true;
  }, [clearSilenceTimer, lang, resetSilenceTimer, supported]);

  useEffect(() => () => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // no-op
      }
    }
  }, [clearSilenceTimer]);

  return { listening, transcript, startListening, stopListening, supported };
}

export default useVoice;

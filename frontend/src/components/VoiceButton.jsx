import { useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";

export default function VoiceButton({
  listening,
  onToggle,
  supported,
  showWaveform = true,
  showButton = true,
}) {
  const waveRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    if (!listening || !waveRef.current) return undefined;

    const canvas = waveRef.current;
    const context = canvas.getContext("2d");
    let frame = 0;

    const drawBar = (x, y, width, height) => {
      const radius = Math.min(width / 2, 2);
      context.beginPath();
      context.moveTo(x + radius, y);
      context.lineTo(x + width - radius, y);
      context.quadraticCurveTo(x + width, y, x + width, y + radius);
      context.lineTo(x + width, y + height - radius);
      context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      context.lineTo(x + radius, y + height);
      context.quadraticCurveTo(x, y + height, x, y + height - radius);
      context.lineTo(x, y + radius);
      context.quadraticCurveTo(x, y, x + radius, y);
      context.closePath();
      context.fill();
    };

    const animate = () => {
      frame += 1;
      context.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 30;
      const barWidth = 5;
      const gap = canvas.width / bars;

      for (let index = 0; index < bars; index += 1) {
        const height =
          Math.abs(Math.sin(frame * 0.07 + index * 0.38)) * 18 +
          Math.abs(Math.sin(frame * 0.11 + index * 0.62)) * 10 +
          Math.abs(Math.sin(frame * 0.05 + index * 0.22)) * 6 +
          4;
        const x = index * gap + (gap - barWidth) / 2;
        const y = (canvas.height - height) / 2;
        const alpha = 0.35 + (height / 34) * 0.65;
        context.fillStyle = `rgba(240, 165, 0, ${alpha})`;
        drawBar(x, y, barWidth, height);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [listening]);

  if (!supported) return null;

  return (
    <>
      {showWaveform && listening && (
        <div style={{ textAlign: "center", marginBottom: "10px", animation: "fadeUp 0.2s ease" }}>
          <canvas ref={waveRef} width={260} height={40} style={{ display: "inline-block" }} />
          <div style={{ fontSize: "12px", color: "#f0a500", marginTop: "3px", animation: "dotBounce 1s infinite" }}>
            सुन रहा हूँ...
          </div>
        </div>
      )}

      {showButton && (
        <div style={{ position: "relative", flexShrink: 0 }}>
          {listening && (
            <>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "rgba(240,165,0,0.35)",
                  animation: "pulseRing 1s ease-out infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "rgba(240,165,0,0.2)",
                  animation: "pulseRing 1s ease-out 0.35s infinite",
                }}
              />
            </>
          )}

          <button
            onClick={onToggle}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: listening ? "linear-gradient(135deg, #f0a500, #c07800)" : "rgba(240,165,0,0.08)",
              border: `2px solid ${listening ? "#f0a500" : "rgba(240,165,0,0.25)"}`,
              color: listening ? "#000" : "#f0a500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              position: "relative",
              zIndex: 1,
            }}
          >
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        </div>
      )}
    </>
  );
}

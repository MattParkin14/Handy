import { useState, useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";

type Phase = "recording" | "transcribing";

export default function OverlayApp() {
  const [levels, setLevels] = useState<number[]>(new Array(16).fill(0));
  const [phase, setPhase] = useState<Phase>("recording");
  // Smooth the incoming levels so bars don't jitter
  const smoothedRef = useRef<number[]>(new Array(16).fill(0));

  useEffect(() => {
    // Transparent body for this window
    document.body.style.background = "transparent";
    document.documentElement.style.background = "transparent";

    const unlisteners: Array<() => void> = [];

    listen<number[]>("audio-levels", (e) => {
      const raw = e.payload;
      // Decay-based smoothing: fast rise, slow fall
      smoothedRef.current = smoothedRef.current.map((prev, i) => {
        const next = raw[i] ?? 0;
        return next > prev ? prev * 0.3 + next * 0.7 : prev * 0.75 + next * 0.25;
      });
      setLevels([...smoothedRef.current]);
    }).then((u) => unlisteners.push(u));

    listen<void>("recording-started", () => {
      setPhase("recording");
      smoothedRef.current = new Array(16).fill(0);
      setLevels(new Array(16).fill(0));
    }).then((u) => unlisteners.push(u));

    listen<void>("recording-stopped", () => {
      setPhase("transcribing");
      smoothedRef.current = new Array(16).fill(0);
      setLevels(new Array(16).fill(0));
    }).then((u) => unlisteners.push(u));

    return () => unlisteners.forEach((u) => u());
  }, []);

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div
        className="flex flex-col items-center justify-center gap-2 px-5 py-3 rounded-2xl"
        style={{
          background: "rgba(10, 10, 10, 0.88)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
          minWidth: "220px",
        }}
      >
        {phase === "recording" ? (
          <>
            {/* Frequency-band waveform */}
            <div className="flex items-end gap-[3px]" style={{ height: "40px" }}>
              {levels.map((level, i) => (
                <div
                  key={i}
                  style={{
                    width: "8px",
                    height: `${Math.max(3, level * 100)}%`,
                    background:
                      level > 0.6
                        ? "#FF6B1A"
                        : level > 0.25
                        ? "#FF8A47"
                        : "#7A2E0A",
                    borderRadius: "3px",
                    transition: "height 60ms linear, background 80ms ease",
                  }}
                />
              ))}
            </div>

            {/* Recording label */}
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: "#d1d5db" }}
              >
                Listening…
              </span>
            </div>
          </>
        ) : (
          /* Transcribing state */
          <div className="flex items-center gap-2 py-1">
            <div
              className="w-4 h-4 rounded-full animate-spin"
              style={{ border: "2px solid #FFD23F", borderTopColor: "transparent" }}
            />
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "#d1d5db" }}
            >
              Transcribing…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

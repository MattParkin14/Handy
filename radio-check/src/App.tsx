import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { useSettingsStore } from "./stores/settingsStore";
import { api } from "./api";
import StatusHeader from "./components/StatusHeader";
import SettingsPanel from "./components/SettingsPanel";
import ModelPanel from "./components/ModelPanel";
import SetupGuide from "./components/SetupGuide";
import AboutPanel from "./components/AboutPanel";

type Tab = "status" | "settings" | "model" | "about";

export default function App() {
  const { loadSettings, settings, setStatus, setLastTranscription, setError } =
    useSettingsStore();
  const [tab, setTab] = useState<Tab>("status");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadSettings();
      try {
        await api.initEnigo();
        await api.initShortcuts();
      } catch (e) {
        console.error("Initialization error:", e);
      }
      setInitialized(true);
    };
    init();
  }, []);

  useEffect(() => {
    const unlisteners: Array<() => void> = [];

    listen<string>("transcription-complete", (e) => {
      setLastTranscription(e.payload);
      setStatus("idle");
    }).then((u) => unlisteners.push(u));

    listen<void>("recording-started", () => setStatus("recording")).then((u) =>
      unlisteners.push(u)
    );

    listen<void>("recording-stopped", () => setStatus("transcribing")).then(
      (u) => unlisteners.push(u)
    );

    listen<string>("chat-inject-error", (e) => {
      setError(`Chat injection failed: ${e.payload}`);
      setStatus("idle");
    }).then((u) => unlisteners.push(u));

    return () => unlisteners.forEach((u) => u());
  }, []);

  if (!initialized || !settings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400 text-sm">Loading RadioCheck...</div>
      </div>
    );
  }

  const hasModel = settings.selectedModel !== "";

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f] text-gray-100">
      {/* Header */}
      <StatusHeader />

      {/* Tab bar */}
      <div className="flex border-b border-gray-800">
        {(["status", "settings", "model", "about"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
              tab === t
                ? "text-green-400 border-b-2 border-green-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!hasModel && tab !== "model" && tab !== "about" && <SetupGuide onGoToModel={() => setTab("model")} />}
        {tab === "status" && <StatusView />}
        {tab === "settings" && <SettingsPanel />}
        {tab === "model" && <ModelPanel />}
        {tab === "about" && <AboutPanel />}
      </div>
    </div>
  );
}

function StatusView() {
  const { status, lastTranscription, error } = useSettingsStore();
  const { settings } = useSettingsStore();

  const hotkey = settings?.bindings?.["transcribe"]?.hotkey ?? "F1";

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 h-full">
      {/* Status indicator */}
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
          status === "recording"
            ? "bg-red-600 animate-pulse"
            : status === "transcribing"
            ? "bg-yellow-600 animate-pulse"
            : "bg-gray-800"
        }`}
      >
        <span className="text-3xl">
          {status === "recording" ? "🎙️" : status === "transcribing" ? "⚙️" : "📻"}
        </span>
      </div>

      {/* Status text */}
      <div className="text-center">
        <div className="text-lg font-medium">
          {status === "recording"
            ? "Recording…"
            : status === "transcribing"
            ? "Transcribing…"
            : "Ready"}
        </div>
        {status === "idle" && (
          <div className="text-sm text-gray-500 mt-1">
            Hold <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">{hotkey}</kbd>{" "}
            to dictate into sim chat
          </div>
        )}
      </div>

      {/* Last transcription */}
      {lastTranscription && (
        <div className="bg-gray-800/60 rounded-lg p-3 max-w-sm w-full text-center">
          <div className="text-xs text-gray-500 mb-1">Last message</div>
          <div className="text-sm text-gray-200">"{lastTranscription}"</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/40 border border-red-800 rounded-lg p-3 max-w-sm w-full text-center">
          <div className="text-xs text-red-400">{error}</div>
        </div>
      )}
    </div>
  );
}

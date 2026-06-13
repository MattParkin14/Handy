import { useState, useEffect } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { api } from "../api";
import type { AudioDevice, SimPreset } from "../types";

export default function SettingsPanel() {
  const { settings, updateSettings } = useSettingsStore();
  const [mics, setMics] = useState<AudioDevice[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    api.getMicrophones().then(setMics).catch(console.error);
  }, []);

  if (!settings) return null;

  const presetOptions: { value: SimPreset; label: string; key: string }[] = [
    { value: "iracing", label: "iRacing", key: "Enter" },
    { value: "acc", label: "ACC / Assetto Corsa", key: "T" },
    { value: "generic", label: "Generic", key: settings.chatOpenKey },
  ];

  const handlePresetChange = (preset: SimPreset) => {
    const found = presetOptions.find((p) => p.value === preset);
    if (!found) return;
    const chatOpenKey =
      preset !== "generic" ? found.key : settings.chatOpenKey;
    updateSettings({ simPreset: preset, chatOpenKey });
  };

  const handleHotkeyKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const parts: string[] = [];
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");
    const key = e.key;
    if (!["Control", "Alt", "Shift", "Meta"].includes(key)) {
      parts.push(key.length === 1 ? key.toUpperCase() : key);
    }
    if (parts.length > 0) {
      updateSettings({
        bindings: { transcribe: { hotkey: parts.join("+") } },
      });
      setIsCapturing(false);
    }
  };

  const hotkey = settings.bindings?.["transcribe"]?.hotkey ?? "F1";
  const isGeneric = settings.simPreset === "generic";

  return (
    <div className="p-4 space-y-5">
      <Section title="Simulator">
        <div className="grid grid-cols-3 gap-2">
          {presetOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handlePresetChange(opt.value)}
              className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                settings.simPreset === opt.value
                  ? "bg-brand text-black"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Chat Injection">
        <SettingRow
          label="Chat open key"
          description={
            isGeneric
              ? "Key that opens the chat box"
              : `Fixed for ${settings.simPreset === "iracing" ? "iRacing" : "ACC"}`
          }
        >
          <input
            type="text"
            value={settings.chatOpenKey}
            disabled={!isGeneric}
            onChange={(e) => updateSettings({ chatOpenKey: e.target.value })}
            className={`bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs w-24 text-center font-mono ${
              !isGeneric ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
        </SettingRow>
        <SettingRow
          label="Open delay (ms)"
          description="Wait time for chat UI to appear"
        >
          <input
            type="number"
            value={settings.chatOpenDelayMs}
            min={50}
            max={2000}
            step={50}
            onChange={(e) =>
              updateSettings({
                chatOpenDelayMs: Math.max(50, parseInt(e.target.value) || 200),
              })
            }
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs w-24 text-center font-mono"
          />
        </SettingRow>
        <SettingRow
          label="Auto-send"
          description="Press Enter after pasting text"
        >
          <Toggle
            checked={settings.autoSend}
            onChange={(v) => updateSettings({ autoSend: v })}
          />
        </SettingRow>
      </Section>

      <Section title="Recording">
        <SettingRow label="Hotkey" description="Keyboard shortcut to trigger dictation">
          <button
            onKeyDown={isCapturing ? handleHotkeyKeyDown : undefined}
            onClick={() => setIsCapturing(true)}
            onBlur={() => setIsCapturing(false)}
            className={`px-3 py-1.5 rounded text-xs font-mono border transition-colors ${
              isCapturing
                ? "bg-brand-dark/20 border-brand text-brand-light animate-pulse"
                : "bg-gray-800 border-gray-700 text-gray-200 hover:border-gray-500"
            }`}
          >
            {isCapturing ? "Press a key…" : hotkey}
          </button>
        </SettingRow>
        <SettingRow
          label="Push-to-talk"
          description="Hold to record; release to transcribe"
        >
          <Toggle
            checked={settings.pushToTalk}
            onChange={(v) => updateSettings({ pushToTalk: v })}
          />
        </SettingRow>
      </Section>

      <Section title="Audio">
        <SettingRow label="Microphone" description="Input device for recording">
          <select
            value={settings.selectedMicrophone ?? ""}
            onChange={(e) =>
              updateSettings({
                selectedMicrophone: e.target.value || null,
              })
            }
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs max-w-[180px]"
          >
            <option value="">Default</option>
            {mics.map((m) => (
              <option key={m.index} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </SettingRow>
        <SettingRow
          label="Audio feedback"
          description="Play sounds on record start/stop"
        >
          <Toggle
            checked={settings.audioFeedback}
            onChange={(v) => updateSettings({ audioFeedback: v })}
          />
        </SettingRow>
      </Section>

      <CustomWordsSection />

      <div className="pt-2 border-t border-gray-800">
        <button
          onClick={() => api.testChatInject()}
          className="w-full py-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
        >
          Test chat injection
        </button>
      </div>
    </div>
  );
}

function CustomWordsSection() {
  const { settings, updateSettings } = useSettingsStore();
  const [input, setInput] = useState("");

  if (!settings) return null;

  const words = settings.customWords ?? [];

  const addWord = () => {
    const trimmed = input.trim();
    if (!trimmed || words.includes(trimmed)) {
      setInput("");
      return;
    }
    updateSettings({ customWords: [...words, trimmed] });
    setInput("");
  };

  const removeWord = (w: string) =>
    updateSettings({ customWords: words.filter((x) => x !== w) });

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Racing vocabulary
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        Words Whisper will prioritise. Pre-loaded with common racing terms —
        add driver names, team names, or any phrase you use often.
      </p>

      {/* Tag cloud */}
      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
        {words.map((w) => (
          <span
            key={w}
            className="flex items-center gap-1 bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded-full"
          >
            {w}
            <button
              onClick={() => removeWord(w)}
              className="text-gray-500 hover:text-red-400 transition-colors leading-none"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Add input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addWord()}
          placeholder="Add a word or phrase…"
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500"
        />
        <button
          onClick={addWord}
          disabled={!input.trim()}
          className="px-3 py-1 text-xs bg-brand-dark hover:bg-brand disabled:opacity-40 text-white rounded transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="text-sm text-gray-200">{label}</div>
        {description && (
          <div className="text-xs text-gray-500 leading-tight">{description}</div>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${
        checked ? "bg-brand" : "bg-gray-700"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

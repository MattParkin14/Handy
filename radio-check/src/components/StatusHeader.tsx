import { useSettingsStore } from "../stores/settingsStore";

export default function StatusHeader() {
  const { status } = useSettingsStore();

  const dotColor =
    status === "recording"
      ? "bg-red-500"
      : status === "transcribing"
        ? "bg-yellow-500"
        : "bg-green-500";

  const statusLabel =
    status === "recording"
      ? "Recording"
      : status === "transcribing"
        ? "Processing"
        : "Ready";

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
      <span className="text-sm font-bold text-white tracking-wide">
        📻 RadioCheck
      </span>
      <div className="flex items-center gap-1.5">
        <div
          className={`w-2 h-2 rounded-full ${dotColor} ${status !== "idle" ? "animate-pulse" : ""}`}
        />
        <span className="text-xs text-gray-400">{statusLabel}</span>
      </div>
    </div>
  );
}

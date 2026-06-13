import { useSettingsStore } from "../stores/settingsStore";
import voxboxIcon from "../assets/voxbox-icon.png";

export default function StatusHeader() {
  const { status } = useSettingsStore();

  const dotColor =
    status === "recording"
      ? "bg-red-500"
      : status === "transcribing"
        ? "bg-board"
        : "bg-brand";

  const statusLabel =
    status === "recording"
      ? "Listening"
      : status === "transcribing"
        ? "Transcribing"
        : "Ready";

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
      <div className="flex items-center gap-2">
        <img src={voxboxIcon} alt="" className="w-5 h-5 rounded" />
        <span className="text-sm font-bold tracking-wide">
          <span className="text-chalk">Vox</span>
          <span className="text-brand">Box</span>
          <span className="ml-1 text-[9px] font-semibold text-gray-500 uppercase tracking-[0.2em] align-middle">
            Racing
          </span>
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <div
          className={`w-2 h-2 rounded-full ${dotColor} ${status !== "idle" ? "animate-pulse" : ""}`}
        />
        <span className="text-xs text-gray-400">{statusLabel}</span>
      </div>
    </div>
  );
}

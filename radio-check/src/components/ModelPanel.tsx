import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { api } from "../api";
import { useSettingsStore } from "../stores/settingsStore";
import type { ModelInfo } from "../types";

export default function ModelPanel() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { settings, updateSettings } = useSettingsStore();

  useEffect(() => {
    api
      .getAvailableModels()
      .then((m) => {
        setModels(m);
        setIsLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setIsLoading(false);
      });

    const unlisteners: Array<() => void> = [];

    listen<{ modelId: string; percentage: number }>(
      "model-download-progress",
      (e) => {
        setDownloading(e.payload.modelId);
        setProgress(e.payload.percentage);
      }
    ).then((u) => unlisteners.push(u));

    listen<string>("model-download-complete", (e) => {
      const modelId = e.payload;
      setDownloading(null);
      setProgress(0);
      setModels((prev) =>
        prev.map((m) => (m.id === modelId ? { ...m, is_downloaded: true } : m))
      );
      updateSettings({ selectedModel: modelId });
      api.setActiveModel(modelId).catch(console.error);
    }).then((u) => unlisteners.push(u));

    listen<string>("model-download-failed", (e) => {
      console.error("Download error:", e.payload);
      setDownloading(null);
      setProgress(0);
    }).then((u) => unlisteners.push(u));

    return () => unlisteners.forEach((u) => u());
  }, []);

  const handleDownload = async (modelId: string) => {
    setDownloading(modelId);
    setProgress(0);
    try {
      await api.downloadModel(modelId);
    } catch (e) {
      console.error(e);
      setDownloading(null);
    }
  };

  const handleSelect = async (modelId: string) => {
    await api.setActiveModel(modelId);
    await updateSettings({ selectedModel: modelId });
  };

  const handleDelete = async (modelId: string) => {
    if (!confirm("Delete this model? You will need to download it again."))
      return;
    await api.deleteModel(modelId);
    setModels((prev) =>
      prev.map((m) => (m.id === modelId ? { ...m, is_downloaded: false } : m))
    );
    if (settings?.selectedModel === modelId) {
      await updateSettings({ selectedModel: "" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-400 text-sm">Loading models…</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-gray-500">
        Download a Whisper model for local speech recognition. Larger models are
        more accurate but slower to load.
      </p>
      {models.map((model) => (
        <ModelRow
          key={model.id}
          model={model}
          isActive={settings?.selectedModel === model.id}
          isDownloading={downloading === model.id}
          progress={downloading === model.id ? progress : 0}
          onDownload={() => handleDownload(model.id)}
          onSelect={() => handleSelect(model.id)}
          onDelete={() => handleDelete(model.id)}
        />
      ))}
    </div>
  );
}

interface ModelRowProps {
  model: ModelInfo;
  isActive: boolean;
  isDownloading: boolean;
  progress: number;
  onDownload: () => void;
  onSelect: () => void;
  onDelete: () => void;
}

function ModelRow({
  model,
  isActive,
  isDownloading,
  progress,
  onDownload,
  onSelect,
  onDelete,
}: ModelRowProps) {
  return (
    <div
      className={`rounded-lg p-3 border transition-colors ${
        isActive
          ? "border-brand/50 bg-brand-dark/20"
          : "border-gray-800 bg-gray-900/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-100">
              {model.name}
            </span>
            {isActive && (
              <span className="text-xs bg-brand/20 text-brand px-1.5 py-0.5 rounded">
                Active
              </span>
            )}
            <span className="text-xs text-gray-500">{model.size_mb} MB</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            {model.description}
          </p>
        </div>
        <div className="flex-shrink-0">
          {model.is_downloaded ? (
            <div className="flex gap-1">
              {!isActive && (
                <button
                  onClick={onSelect}
                  className="px-2.5 py-1 text-xs bg-brand hover:bg-brand-light text-white rounded transition-colors"
                >
                  Use
                </button>
              )}
              <button
                onClick={onDelete}
                className="px-2.5 py-1 text-xs bg-gray-800 hover:bg-red-900/50 hover:text-red-400 text-gray-400 rounded transition-colors"
              >
                Del
              </button>
            </div>
          ) : isDownloading ? (
            <button
              onClick={() => api.cancelDownload()}
              className="px-2.5 py-1 text-xs bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 rounded transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={onDownload}
              className="px-2.5 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
            >
              Download
            </button>
          )}
        </div>
      </div>
      {isDownloading && (
        <div className="mt-2">
          <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {Math.round(progress)}%
          </div>
        </div>
      )}
    </div>
  );
}

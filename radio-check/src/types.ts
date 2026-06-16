export type SimPreset = "iracing" | "acc" | "generic";

export type WhisperAcceleratorSetting = "Auto" | "Cpu" | "Gpu";
export type OrtAcceleratorSetting = "Auto" | "Cpu" | "Cuda" | "DirectMl" | "Rocm";
export type ModelUnloadTimeout = "never" | "1m" | "5m" | "15m" | "immediately";

export interface ShortcutBinding {
  hotkey: string;
}

export interface RadioCheckSettings {
  bindings: Record<string, ShortcutBinding>;
  pushToTalk: boolean;
  simPreset: SimPreset;
  chatOpenKey: string;
  autoSend: boolean;
  chatOpenDelayMs: number;
  selectedMicrophone: string | null;
  selectedOutputDevice: string | null;
  alwaysOnMicrophone: boolean;
  muteWhileRecording: boolean;
  audioFeedback: boolean;
  audioFeedbackVolume: number;
  soundTheme: "marimba" | "pop" | "custom";
  selectedModel: string;
  modelUnloadTimeout: ModelUnloadTimeout;
  whisperAccelerator: WhisperAcceleratorSetting;
  ortAccelerator: OrtAcceleratorSetting;
  whisperGpuDevice: number;
  selectedLanguage: string;
  translateToEnglish: boolean;
  customWords: string[];
  debugMode: boolean;
  updateChecksEnabled: boolean;
}

export interface AudioDevice {
  index: string;
  name: string;
  isDefault: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  filename: string;
  size_mb: number;
  is_downloaded: boolean;
  is_downloading: boolean;
  is_recommended: boolean;
  accuracy_score: number;
  speed_score: number;
  supported_languages: string[];
  supports_translation: boolean;
  is_custom: boolean;
}

export type AppStatus = "idle" | "recording" | "transcribing" | "error";

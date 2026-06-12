import { invoke } from "@tauri-apps/api/core";
import type { RadioCheckSettings, AudioDevice, ModelInfo } from "./types";

export const api = {
  getSettings: () => invoke<RadioCheckSettings>("get_app_settings"),
  setSettings: (settings: RadioCheckSettings) =>
    invoke<void>("set_app_settings", { settings }),
  getDefaultSettings: () => invoke<RadioCheckSettings>("get_default_settings"),

  initEnigo: () => invoke<void>("initialize_enigo"),
  initShortcuts: () => invoke<void>("initialize_shortcuts"),

  cancelOperation: () => invoke<void>("cancel_operation"),
  testChatInject: () => invoke<void>("test_chat_inject"),

  getMicrophones: () => invoke<AudioDevice[]>("get_available_microphones"),
  getOutputDevices: () => invoke<AudioDevice[]>("get_available_output_devices"),
  setMicrophone: (deviceName: string) =>
    invoke<void>("set_selected_microphone", { deviceName }),
  setOutputDevice: (deviceName: string) =>
    invoke<void>("set_selected_output_device", { deviceName }),
  getMicrophoneMode: () => invoke<string>("get_microphone_mode"),
  isRecording: () => invoke<boolean>("is_recording"),

  getAvailableModels: () => invoke<ModelInfo[]>("get_available_models"),
  getModelInfo: (modelId: string) =>
    invoke<ModelInfo | null>("get_model_info", { modelId }),
  downloadModel: (modelId: string) =>
    invoke<void>("download_model", { modelId }),
  deleteModel: (modelId: string) => invoke<void>("delete_model", { modelId }),
  cancelDownload: (modelId?: string) =>
    invoke<void>("cancel_download", { modelId: modelId ?? "" }),
  setActiveModel: (modelId: string) =>
    invoke<void>("set_active_model", { modelId }),
  getCurrentModel: () => invoke<string>("get_current_model"),
  hasAnyModels: () => invoke<boolean>("has_any_models_available"),

  getModelLoadStatus: () =>
    invoke<{ isLoaded: boolean; isLoading: boolean }>("get_model_load_status"),
  unloadModel: () => invoke<void>("unload_model_manually"),

  getWindowsMicrophonePermissionStatus: () =>
    invoke<{
      supported: boolean;
      overallAccess: string;
    }>("get_windows_microphone_permission_status"),
  openMicrophonePrivacySettings: () =>
    invoke<void>("open_microphone_privacy_settings"),
};

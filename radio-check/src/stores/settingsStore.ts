import { create } from "zustand";
import type { RadioCheckSettings, AppStatus } from "../types";
import { api } from "../api";

interface SettingsStore {
  settings: RadioCheckSettings | null;
  status: AppStatus;
  lastTranscription: string;
  isLoading: boolean;
  error: string | null;

  loadSettings: () => Promise<void>;
  updateSettings: (patch: Partial<RadioCheckSettings>) => Promise<void>;
  setStatus: (status: AppStatus) => void;
  setLastTranscription: (text: string) => void;
  setError: (error: string | null) => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  status: "idle",
  lastTranscription: "",
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await api.getSettings();
      set({ settings, isLoading: false });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  updateSettings: async (patch) => {
    const current = get().settings;
    if (!current) return;
    const updated = { ...current, ...patch };
    set({ settings: updated });
    try {
      await api.setSettings(updated);
    } catch (e) {
      set({ error: String(e) });
    }
  },

  setStatus: (status) => set({ status }),
  setLastTranscription: (text) => set({ lastTranscription: text }),
  setError: (error) => set({ error }),
}));

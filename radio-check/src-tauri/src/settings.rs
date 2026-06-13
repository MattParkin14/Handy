use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreExt;

const STORE_PATH: &str = "voxbox-settings.json";

// ─── Racing-specific types ────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum SimPreset {
    #[serde(rename = "iracing")]
    IRacing,
    #[serde(rename = "acc")]
    AssettoCorsaACC,
    #[serde(rename = "generic")]
    Generic,
}

// ─── Enums needed by copied Handy modules ────────────────────────────────────

#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SoundTheme {
    Marimba,
    Pop,
    Custom,
}

impl Default for SoundTheme {
    fn default() -> Self {
        SoundTheme::Marimba
    }
}

impl SoundTheme {
    fn as_str(self) -> &'static str {
        match self {
            SoundTheme::Marimba => "marimba",
            SoundTheme::Pop => "pop",
            SoundTheme::Custom => "custom",
        }
    }

    pub fn to_start_path(self) -> String {
        format!("resources/{}_start.wav", self.as_str())
    }

    pub fn to_stop_path(self) -> String {
        format!("resources/{}_stop.wav", self.as_str())
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum WhisperAcceleratorSetting {
    Auto,
    Cpu,
    Gpu,
}

impl Default for WhisperAcceleratorSetting {
    fn default() -> Self {
        WhisperAcceleratorSetting::Auto
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum OrtAcceleratorSetting {
    Auto,
    Cpu,
    Cuda,
    DirectMl,
    Rocm,
}

impl Default for OrtAcceleratorSetting {
    fn default() -> Self {
        OrtAcceleratorSetting::Auto
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, specta::Type, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum ModelUnloadTimeout {
    #[serde(rename = "never")]
    Never,
    #[serde(rename = "1m")]
    OneMinute,
    #[serde(rename = "5m")]
    FiveMinutes,
    #[serde(rename = "15m")]
    FifteenMinutes,
    /// Unload immediately after each transcription.
    #[serde(rename = "immediately")]
    Immediately,
}

impl Default for ModelUnloadTimeout {
    fn default() -> Self {
        ModelUnloadTimeout::FiveMinutes
    }
}

impl From<ModelUnloadTimeout> for Option<std::time::Duration> {
    fn from(t: ModelUnloadTimeout) -> Self {
        match t {
            ModelUnloadTimeout::Never => None,
            ModelUnloadTimeout::OneMinute => Some(std::time::Duration::from_secs(60)),
            ModelUnloadTimeout::FiveMinutes => Some(std::time::Duration::from_secs(5 * 60)),
            ModelUnloadTimeout::FifteenMinutes => Some(std::time::Duration::from_secs(15 * 60)),
            ModelUnloadTimeout::Immediately => Some(std::time::Duration::ZERO),
        }
    }
}

// ─── ShortcutBinding ─────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct ShortcutBinding {
    pub hotkey: String,
}

// ─── Main Settings ────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct RadioCheckSettings {
    // ── Hotkeys
    pub bindings: HashMap<String, ShortcutBinding>,
    pub push_to_talk: bool,

    // ── Racing sim chat injection
    pub sim_preset: SimPreset,
    /// Key that opens the chat box (used for Generic preset).
    pub chat_open_key: String,
    /// Press Enter automatically after pasting to send the message.
    pub auto_send: bool,
    /// Delay (ms) between pressing the chat-open key and pasting.
    pub chat_open_delay_ms: u64,

    // ── Audio
    pub selected_microphone: Option<String>,
    pub selected_output_device: Option<String>,
    pub always_on_microphone: bool,
    pub mute_while_recording: bool,
    pub audio_feedback: bool,
    pub audio_feedback_volume: f32,
    pub sound_theme: SoundTheme,

    // ── Model
    /// Empty string = no model selected.
    pub selected_model: String,
    pub model_unload_timeout: ModelUnloadTimeout,
    pub whisper_accelerator: WhisperAcceleratorSetting,
    pub ort_accelerator: OrtAcceleratorSetting,
    pub whisper_gpu_device: i32,

    // ── Transcription
    pub selected_language: String,
    pub translate_to_english: bool,
    pub custom_words: Vec<String>,
    pub custom_filler_words: Vec<String>,
    pub word_correction_threshold: f64,
    pub app_language: String,
    pub extra_recording_buffer_ms: u64,

    // ── Clamshell (macOS — always None on Windows)
    pub clamshell_microphone: Option<String>,

    // ── Misc
    pub debug_mode: bool,
    pub update_checks_enabled: bool,
}

impl Default for RadioCheckSettings {
    fn default() -> Self {
        let mut bindings = HashMap::new();
        bindings.insert(
            "transcribe".to_string(),
            ShortcutBinding {
                hotkey: "F1".to_string(),
            },
        );
        bindings.insert(
            "cancel".to_string(),
            ShortcutBinding {
                hotkey: "Escape".to_string(),
            },
        );

        Self {
            bindings,
            push_to_talk: true,
            sim_preset: SimPreset::IRacing,
            chat_open_key: "enter".to_string(),
            auto_send: true,
            chat_open_delay_ms: 150,
            selected_microphone: None,
            selected_output_device: None,
            always_on_microphone: false,
            mute_while_recording: false,
            audio_feedback: true,
            audio_feedback_volume: 0.5,
            sound_theme: SoundTheme::Marimba,
            selected_model: String::new(),
            model_unload_timeout: ModelUnloadTimeout::FiveMinutes,
            whisper_accelerator: WhisperAcceleratorSetting::Auto,
            ort_accelerator: OrtAcceleratorSetting::Auto,
            whisper_gpu_device: -1,
            selected_language: "en".to_string(),
            translate_to_english: false,
            custom_words: vec![
                // Sim-specific commands & phrases
                "box".into(), "box box".into(), "push push".into(),
                "affirm".into(), "copy".into(), "check copy".into(),
                "understood".into(), "radio check".into(),
                // Racing positions & situations
                "DRS".into(), "safety car".into(), "VSC".into(),
                "pit lane".into(), "pit window".into(), "pit exit".into(),
                "undercut".into(), "overcut".into(), "fuel load".into(),
                "out lap".into(), "in lap".into(), "warm up".into(),
                "outlap".into(), "inlap".into(),
                // iRacing-specific
                "iRating".into(), "SoF".into(), "caution".into(),
                "yellow flag".into(), "black flag".into(), "checkered".into(),
                "incident".into(), "protest".into(),
                // ACC / Assetto Corsa
                "Balance of Performance".into(), "BoP".into(),
                "TC".into(), "ABS".into(), "brake bias".into(),
                // Common sims/tracks
                "Spa".into(), "Monza".into(), "Suzuka".into(),
                "Nurburgring".into(), "Silverstone".into(), "Le Mans".into(),
                "Zandvoort".into(), "Imola".into(), "Bahrain".into(),
                "Interlagos".into(), "Hungaroring".into(), "Portimao".into(),
            ],
            custom_filler_words: Vec::new(),
            word_correction_threshold: 0.8,
            app_language: "en".to_string(),
            extra_recording_buffer_ms: 0,
            clamshell_microphone: None,
            debug_mode: false,
            update_checks_enabled: true,
        }
    }
}

// ─── Persistence ──────────────────────────────────────────────────────────────

pub fn get_settings(app: &AppHandle) -> RadioCheckSettings {
    let store = match app.store(STORE_PATH) {
        Ok(s) => s,
        Err(_) => return RadioCheckSettings::default(),
    };
    match store.get("settings") {
        Some(v) => serde_json::from_value(v).unwrap_or_default(),
        None => RadioCheckSettings::default(),
    }
}

pub fn save_settings(app: &AppHandle, settings: &RadioCheckSettings) -> Result<(), String> {
    let store = app
        .store(STORE_PATH)
        .map_err(|e| format!("Failed to open store: {}", e))?;
    let json =
        serde_json::to_value(settings).map_err(|e| format!("Serialization error: {}", e))?;
    store.set("settings", json);
    store
        .save()
        .map_err(|e| format!("Failed to save store: {}", e))?;
    Ok(())
}

// ─── Compatibility shims for copied Handy modules ─────────────────────────────

/// Type alias so copied Handy code compiles unchanged.
pub type AppSettings = RadioCheckSettings;

/// Persistence helper matching Handy's API surface.
pub fn write_settings(app: &AppHandle, settings: RadioCheckSettings) {
    let _ = save_settings(app, &settings);
}

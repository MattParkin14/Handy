use crate::input::EnigoState;
use crate::settings::{get_settings, SimPreset};
use enigo::{Direction, Key, Keyboard};
use log::{debug, error};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};

/// Maps a human-readable key name to an enigo Key.
fn parse_key(key_str: &str) -> Key {
    match key_str.to_lowercase().as_str() {
        "enter" | "return" => Key::Return,
        "tab" => Key::Tab,
        "space" => Key::Space,
        "escape" | "esc" => Key::Escape,
        "t" => Key::Unicode('t'),
        "y" => Key::Unicode('y'),
        "m" => Key::Unicode('m'),
        "c" => Key::Unicode('c'),
        "f1" => Key::F1,
        "f2" => Key::F2,
        "f3" => Key::F3,
        "f4" => Key::F4,
        "f5" => Key::F5,
        "f6" => Key::F6,
        "f7" => Key::F7,
        "f8" => Key::F8,
        "f9" => Key::F9,
        "f10" => Key::F10,
        "f11" => Key::F11,
        "f12" => Key::F12,
        other if other.len() == 1 => {
            Key::Unicode(other.chars().next().unwrap())
        }
        _ => {
            debug!("Unknown chat key '{}', defaulting to Enter", key_str);
            Key::Return
        }
    }
}

/// Injects transcribed text into the racing sim chat box.
///
/// Flow:
///   1. Press the sim-specific key to open the chat input
///   2. Wait for the chat UI to appear
///   3. Copy text to clipboard then Ctrl+V to paste
///   4. Optionally press Enter to send
pub fn inject_into_sim_chat(text: &str, app_handle: &AppHandle) -> Result<(), String> {
    if text.is_empty() {
        return Ok(());
    }

    let settings = get_settings(app_handle);

    let enigo_state = app_handle
        .try_state::<EnigoState>()
        .ok_or_else(|| "Enigo not initialized — call initialize_enigo first".to_string())?;

    let mut enigo = enigo_state
        .0
        .lock()
        .map_err(|e| format!("Enigo lock poisoned: {}", e))?;

    // Determine which key opens the chat box
    let chat_open_key = match &settings.sim_preset {
        SimPreset::IRacing => Key::Return,
        SimPreset::AssettoCorsaACC => Key::Unicode('t'),
        SimPreset::Generic => parse_key(&settings.chat_open_key),
    };

    debug!(
        "Injecting '{}' into sim chat (preset: {:?}, delay: {}ms, auto_send: {})",
        text, settings.sim_preset, settings.chat_open_delay_ms, settings.auto_send
    );

    // 1. Press the chat-open key
    enigo
        .key(chat_open_key, Direction::Click)
        .map_err(|e| format!("Failed to press chat-open key: {}", e))?;

    // 2. Wait for the chat UI to open
    let delay = settings.chat_open_delay_ms.clamp(50, 2000);
    thread::sleep(Duration::from_millis(delay));

    // 3. Copy text to clipboard
    {
        let mut clipboard =
            arboard::Clipboard::new().map_err(|e| format!("Clipboard unavailable: {}", e))?;
        clipboard
            .set_text(text)
            .map_err(|e| format!("Failed to set clipboard: {}", e))?;
    }

    // Small pause to ensure clipboard is ready
    thread::sleep(Duration::from_millis(30));

    // 4. Paste via Ctrl+V (Windows VK_V = 0x56)
    #[cfg(target_os = "windows")]
    {
        enigo
            .key(Key::Control, Direction::Press)
            .map_err(|e| format!("Failed to press Ctrl: {}", e))?;
        enigo
            .key(Key::Other(0x56), Direction::Click)
            .map_err(|e| format!("Failed to click V: {}", e))?;
        thread::sleep(Duration::from_millis(50));
        enigo
            .key(Key::Control, Direction::Release)
            .map_err(|e| format!("Failed to release Ctrl: {}", e))?;
    }
    #[cfg(not(target_os = "windows"))]
    {
        enigo
            .key(Key::Control, Direction::Press)
            .map_err(|e| format!("Failed to press Ctrl: {}", e))?;
        enigo
            .key(Key::Unicode('v'), Direction::Click)
            .map_err(|e| format!("Failed to click v: {}", e))?;
        thread::sleep(Duration::from_millis(50));
        enigo
            .key(Key::Control, Direction::Release)
            .map_err(|e| format!("Failed to release Ctrl: {}", e))?;
    }

    // 5. Auto-send: press Enter to submit the chat message
    if settings.auto_send {
        thread::sleep(Duration::from_millis(50));
        enigo
            .key(Key::Return, Direction::Click)
            .map_err(|e| format!("Failed to press Enter to send: {}", e))?;
    }

    debug!("Chat injection complete");
    Ok(())
}

/// Test the injection pipeline with a dummy message (useful for settings UI preview).
pub fn test_inject(app_handle: &AppHandle) -> Result<(), String> {
    inject_into_sim_chat("RadioCheck test message", app_handle)
}

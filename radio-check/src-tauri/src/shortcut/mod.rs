mod handler;
pub mod handy_keys;

use crate::settings::get_settings;
use log::{error, warn};
use tauri::AppHandle;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

/// Initialize all persistent shortcuts from settings (called at startup or after settings change).
pub fn initialize_shortcuts(app: &AppHandle) -> Result<(), String> {
    let settings = get_settings(app);
    for (id, binding) in &settings.bindings {
        if id == "cancel" {
            // Registered dynamically when recording starts
            continue;
        }
        if let Err(e) = register_binding(app, id.clone(), binding.hotkey.clone()) {
            error!("Failed to register shortcut '{}' ({}): {}", id, binding.hotkey, e);
        }
    }
    Ok(())
}

/// Re-register all shortcuts after settings change.
pub fn reinitialize_shortcuts(app: &AppHandle) {
    let _ = app.global_shortcut().unregister_all();
    if let Err(e) = initialize_shortcuts(app) {
        error!("reinitialize_shortcuts: {}", e);
    }
}

/// Register the cancel shortcut — called when recording starts.
pub fn register_cancel_shortcut(app: &AppHandle) {
    let settings = get_settings(app);
    if let Some(binding) = settings.bindings.get("cancel") {
        if let Err(e) = register_binding(app, "cancel".to_string(), binding.hotkey.clone()) {
            warn!("Failed to register cancel shortcut: {}", e);
        }
    }
}

/// Unregister the cancel shortcut — called when recording stops.
pub fn unregister_cancel_shortcut(app: &AppHandle) {
    let settings = get_settings(app);
    if let Some(binding) = settings.bindings.get("cancel") {
        if let Ok(shortcut) = binding.hotkey.parse::<Shortcut>() {
            let _ = app.global_shortcut().unregister(shortcut);
        }
    }
}

fn register_binding(app: &AppHandle, id: String, hotkey: String) -> Result<(), String> {
    let shortcut = hotkey
        .parse::<Shortcut>()
        .map_err(|e| format!("Invalid shortcut '{}': {}", hotkey, e))?;

    if app.global_shortcut().is_registered(shortcut) {
        return Ok(()); // Already registered
    }

    let hotkey_clone = hotkey.clone();
    app.global_shortcut()
        .on_shortcut(shortcut, move |app, _shortcut, event| {
            let is_pressed = matches!(event.state(), ShortcutState::Pressed);
            handler::handle_shortcut_event(app, &id, &hotkey_clone, is_pressed);
        })
        .map_err(|e| format!("Failed to register '{}': {}", hotkey, e))
}

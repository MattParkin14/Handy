pub mod audio;
pub mod chat;
pub mod models;
pub mod transcription;

use crate::settings::{get_settings, save_settings, RadioCheckSettings};
use crate::utils::cancel_current_operation;
use tauri::AppHandle;

#[tauri::command]
#[specta::specta]
pub fn cancel_operation(app: AppHandle) {
    cancel_current_operation(&app);
}

#[tauri::command]
#[specta::specta]
pub fn is_portable() -> bool {
    crate::portable::is_portable()
}

#[tauri::command]
#[specta::specta]
pub fn get_app_dir_path(app: AppHandle) -> Result<String, String> {
    let app_data_dir = crate::portable::app_data_dir(&app)
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    Ok(app_data_dir.to_string_lossy().to_string())
}

#[tauri::command]
#[specta::specta]
pub fn get_app_settings(app: AppHandle) -> Result<RadioCheckSettings, String> {
    Ok(get_settings(&app))
}

#[tauri::command]
#[specta::specta]
pub fn get_default_settings() -> Result<RadioCheckSettings, String> {
    Ok(RadioCheckSettings::default())
}

#[tauri::command]
#[specta::specta]
pub fn set_app_settings(app: AppHandle, settings: RadioCheckSettings) -> Result<(), String> {
    save_settings(&app, &settings)?;

    // Re-apply shortcut bindings immediately
    crate::shortcut::reinitialize_shortcuts(&app);

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn initialize_enigo(app: AppHandle) -> Result<(), String> {
    use crate::input::EnigoState;
    use tauri::Manager;
    if app.try_state::<EnigoState>().is_none() {
        let enigo_state = EnigoState::new()?;
        app.manage(enigo_state);
    }
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub fn initialize_shortcuts(app: AppHandle) -> Result<(), String> {
    crate::shortcut::initialize_shortcuts(&app)
        .map_err(|e| format!("Failed to initialize shortcuts: {}", e))
}

// Stub: RadioCheck uses Tauri global shortcuts only.
// These commands are provided for API compatibility but return errors since
// handy-keys is not the active keyboard implementation.
use tauri::AppHandle;

#[tauri::command]
#[specta::specta]
pub fn start_handy_keys_recording(_app: AppHandle, _binding_id: String) -> Result<(), String> {
    Err("handy-keys not available in RadioCheck; change hotkeys via the settings text field".into())
}

#[tauri::command]
#[specta::specta]
pub fn stop_handy_keys_recording(_app: AppHandle) -> Result<(), String> {
    Err("handy-keys not available in RadioCheck".into())
}

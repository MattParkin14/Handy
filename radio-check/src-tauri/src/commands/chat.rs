use crate::chat_inject;
use tauri::AppHandle;

/// Fire a test injection to verify the sim chat pipeline is working.
/// Sends "RadioCheck test" into whatever window is currently focused.
#[tauri::command]
#[specta::specta]
pub fn test_chat_inject(app: AppHandle) -> Result<(), String> {
    chat_inject::test_inject(&app)
}

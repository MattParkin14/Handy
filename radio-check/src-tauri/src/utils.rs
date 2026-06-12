use crate::managers::audio::AudioRecordingManager;
use crate::managers::transcription::TranscriptionManager;
use crate::shortcut;
use crate::tray::{change_tray_icon, TrayIconState};
use crate::TranscriptionCoordinator;
use log::info;
use std::sync::Arc;
use tauri::{AppHandle, Manager};

pub use crate::tray::*;

/// No-op stubs — RadioCheck has no floating overlay window.
pub fn show_recording_overlay(_app: &AppHandle) {}
pub fn show_transcribing_overlay(_app: &AppHandle) {}
pub fn hide_recording_overlay(_app: &AppHandle) {}
pub fn show_processing_overlay(_app: &AppHandle) {}

pub fn cancel_current_operation(app: &AppHandle) {
    info!("Cancelling operation...");
    shortcut::unregister_cancel_shortcut(app);

    let audio_manager = app.state::<Arc<AudioRecordingManager>>();
    let recording_was_active = audio_manager.is_recording();
    audio_manager.cancel_recording();

    change_tray_icon(app, TrayIconState::Idle);

    let tm = app.state::<Arc<TranscriptionManager>>();
    tm.maybe_unload_immediately("cancellation");

    if let Some(coordinator) = app.try_state::<TranscriptionCoordinator>() {
        coordinator.notify_cancel(recording_was_active);
    }

    info!("Cancellation complete");
}

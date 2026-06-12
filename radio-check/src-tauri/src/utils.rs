use crate::managers::audio::AudioRecordingManager;
use crate::managers::transcription::TranscriptionManager;
use crate::shortcut;
use crate::tray::{change_tray_icon, TrayIconState};
use crate::TranscriptionCoordinator;
use log::info;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, LogicalPosition, Manager};

pub use crate::tray::*;

/// No-op stubs for platforms / modes where there is no floating overlay.
pub fn show_transcribing_overlay(_app: &AppHandle) {}
pub fn show_processing_overlay(_app: &AppHandle) {}

/// Emit raw audio-level buckets to all windows (picked up by overlay waveform).
pub fn emit_levels(app: &AppHandle, levels: &[f32]) {
    let _ = app.emit("audio-levels", levels);
}

/// Show the recording overlay, positioned at the bottom-centre of the screen.
pub fn show_recording_overlay(app: &AppHandle) {
    if let Some(overlay) = app.get_webview_window("overlay") {
        // Position: horizontal centre, 80 px from bottom edge.
        if let Ok(Some(monitor)) = overlay.primary_monitor() {
            let scale = monitor.scale_factor();
            let lw = monitor.size().width as f64 / scale;
            let lh = monitor.size().height as f64 / scale;
            let ow = 280.0_f64;
            let oh = 95.0_f64;
            let _ = overlay.set_position(LogicalPosition::new(
                (lw - ow) / 2.0,
                lh - oh - 80.0,
            ));
        }
        let _ = overlay.set_always_on_top(true);
        let _ = overlay.show();
    }
}

/// Hide the recording overlay.
pub fn hide_recording_overlay(app: &AppHandle) {
    if let Some(overlay) = app.get_webview_window("overlay") {
        let _ = overlay.hide();
    }
}

pub fn cancel_current_operation(app: &AppHandle) {
    info!("Cancelling operation...");
    shortcut::unregister_cancel_shortcut(app);

    let audio_manager = app.state::<Arc<AudioRecordingManager>>();
    let recording_was_active = audio_manager.is_recording();
    audio_manager.cancel_recording();

    change_tray_icon(app, TrayIconState::Idle);
    hide_recording_overlay(app);

    let tm = app.state::<Arc<TranscriptionManager>>();
    tm.maybe_unload_immediately("cancellation");

    if let Some(coordinator) = app.try_state::<TranscriptionCoordinator>() {
        coordinator.notify_cancel(recording_was_active);
    }

    info!("Cancellation complete");
}

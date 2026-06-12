mod actions;
mod audio_feedback;
pub mod audio_toolkit;
mod chat_inject;
mod commands;
mod helpers;
mod input;
mod managers;
pub mod portable;
mod settings;
mod shortcut;
mod signal_handle;
mod transcription_coordinator;
mod tray;
mod utils;

pub use transcription_coordinator::TranscriptionCoordinator;

#[cfg(debug_assertions)]
use specta_typescript::{BigIntExportBehavior, Typescript};
use tauri_specta::{collect_commands, Builder};

use env_filter::Builder as EnvFilterBuilder;
use managers::audio::AudioRecordingManager;
use managers::model::ModelManager;
use managers::transcription::TranscriptionManager;
use std::sync::atomic::{AtomicU8, Ordering};
use std::sync::Arc;
use tauri::image::Image;
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Manager};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_log::{Builder as LogBuilder, RotationStrategy, Target, TargetKind};

use crate::settings::get_settings;

pub static FILE_LOG_LEVEL: AtomicU8 = AtomicU8::new(log::LevelFilter::Debug as u8);

fn level_filter_from_u8(value: u8) -> log::LevelFilter {
    match value {
        0 => log::LevelFilter::Off,
        1 => log::LevelFilter::Error,
        2 => log::LevelFilter::Warn,
        3 => log::LevelFilter::Info,
        4 => log::LevelFilter::Debug,
        _ => log::LevelFilter::Trace,
    }
}

fn build_console_filter() -> env_filter::Filter {
    let mut builder = EnvFilterBuilder::new();
    match std::env::var("RUST_LOG") {
        Ok(spec) if !spec.trim().is_empty() => {
            if builder.try_parse(&spec).is_err() {
                builder.filter_level(log::LevelFilter::Info);
            }
        }
        _ => {
            builder.filter_level(log::LevelFilter::Info);
        }
    }
    builder.build()
}

fn show_main_window(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.unminimize();
        let _ = win.show();
        let _ = win.set_focus();
    }
}

fn initialize_core_logic(app_handle: &AppHandle) {
    let recording_manager = Arc::new(
        AudioRecordingManager::new(app_handle).expect("Failed to init recording manager"),
    );
    let model_manager =
        Arc::new(ModelManager::new(app_handle).expect("Failed to init model manager"));
    let transcription_manager = Arc::new(
        TranscriptionManager::new(app_handle, model_manager.clone())
            .expect("Failed to init transcription manager"),
    );

    managers::transcription::apply_accelerator_settings(app_handle);

    app_handle.manage(recording_manager);
    app_handle.manage(model_manager);
    app_handle.manage(transcription_manager);

    // Build tray icon
    let icon_path = tray::get_icon_path(tray::get_current_theme(app_handle), tray::TrayIconState::Idle);
    let tray_icon = TrayIconBuilder::new()
        .icon(
            Image::from_path(
                app_handle
                    .path()
                    .resolve(icon_path, tauri::path::BaseDirectory::Resource)
                    .unwrap(),
            )
            .unwrap(),
        )
        .tooltip("RadioCheck")
        .show_menu_on_left_click(true)
        .icon_as_template(true)
        .on_menu_event(|app, event| {
            let id = event.id.as_ref();
            if let Some(model_id) = id.strip_prefix("model_select:") {
                let model_id = model_id.to_string();
                let app = app.clone();
                std::thread::spawn(move || {
                    let _ = crate::commands::models::switch_active_model(&app, &model_id);
                    tray::update_tray_menu(&app, &tray::TrayIconState::Idle, None);
                });
                return;
            }
            match id {
                "settings" => show_main_window(app),
                "cancel" => crate::utils::cancel_current_operation(app),
                "unload_model" => {
                    let tm = app.state::<Arc<TranscriptionManager>>();
                    let _ = tm.unload_model();
                }
                "quit" => app.exit(0),
                _ => {}
            }
        })
        .build(app_handle)
        .unwrap();
    app_handle.manage(tray_icon);

    tray::update_tray_menu(app_handle, &tray::TrayIconState::Idle, None);

    // Autostart
    let settings = get_settings(app_handle);
    let autostart = app_handle.autolaunch();
    if settings.always_on_microphone {
        let _ = autostart.enable();
    } else {
        let _ = autostart.disable();
    }
}

pub fn run() {
    portable::init();
    let console_filter = build_console_filter();

    let specta_builder = Builder::<tauri::Wry>::new().commands(collect_commands![
        commands::cancel_operation,
        commands::is_portable,
        commands::get_app_dir_path,
        commands::get_app_settings,
        commands::get_default_settings,
        commands::set_app_settings,
        commands::initialize_enigo,
        commands::initialize_shortcuts,
        commands::chat::test_chat_inject,
        commands::models::get_available_models,
        commands::models::get_model_info,
        commands::models::download_model,
        commands::models::delete_model,
        commands::models::cancel_download,
        commands::models::set_active_model,
        commands::models::get_current_model,
        commands::models::get_transcription_model_status,
        commands::models::is_model_loading,
        commands::models::has_any_models_available,
        commands::models::has_any_models_or_downloads,
        commands::audio::update_microphone_mode,
        commands::audio::get_microphone_mode,
        commands::audio::get_windows_microphone_permission_status,
        commands::audio::open_microphone_privacy_settings,
        commands::audio::get_available_microphones,
        commands::audio::set_selected_microphone,
        commands::audio::get_selected_microphone,
        commands::audio::get_available_output_devices,
        commands::audio::set_selected_output_device,
        commands::audio::get_selected_output_device,
        commands::audio::play_test_sound,
        commands::audio::check_custom_sounds,
        commands::audio::is_recording,
        commands::transcription::set_model_unload_timeout,
        commands::transcription::get_model_load_status,
        commands::transcription::unload_model_manually,
    ]);

    #[cfg(debug_assertions)]
    specta_builder
        .export(
            Typescript::default().bigint(BigIntExportBehavior::Number),
            "../src/bindings.ts",
        )
        .expect("Failed to export typescript bindings");

    let invoke_handler = specta_builder.invoke_handler();

    tauri::Builder::default()
        .device_event_filter(tauri::DeviceEventFilter::Always)
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            LogBuilder::new()
                .level(log::LevelFilter::Trace)
                .max_file_size(500_000)
                .rotation_strategy(RotationStrategy::KeepOne)
                .clear_targets()
                .targets([
                    Target::new(TargetKind::Stdout).filter({
                        let console_filter = console_filter.clone();
                        move |metadata| console_filter.enabled(metadata)
                    }),
                    Target::new(if let Some(data_dir) = portable::data_dir() {
                        TargetKind::Folder {
                            path: data_dir.join("logs"),
                            file_name: Some("radiocheck".into()),
                        }
                    } else {
                        TargetKind::LogDir {
                            file_name: Some("radiocheck".into()),
                        }
                    })
                    .filter(|metadata| {
                        let level = FILE_LOG_LEVEL.load(Ordering::Relaxed);
                        metadata.level() <= level_filter_from_u8(level)
                    }),
                ])
                .build(),
        )
        .plugin(tauri_plugin_single_instance::init(|app, args, _| {
            if args.iter().any(|a| a == "--toggle-transcription") {
                signal_handle::send_transcription_input(app, "transcribe", "CLI");
            } else if args.iter().any(|a| a == "--cancel") {
                crate::utils::cancel_current_operation(app);
            } else {
                show_main_window(app);
            }
        }))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .invoke_handler(invoke_handler)
        .setup(move |app| {
            let app_handle = app.handle().clone();
            app.manage(TranscriptionCoordinator::new(app_handle.clone()));
            initialize_core_logic(&app_handle);

            let settings = get_settings(&app_handle);
            if settings.debug_mode {
                FILE_LOG_LEVEL.store(
                    log::LevelFilter::Trace as u8,
                    Ordering::Relaxed,
                );
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running RadioCheck");
}

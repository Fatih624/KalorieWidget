use crate::Result;
use tauri::{Emitter, Manager};

pub const BADGE: f64 = 128.0;
pub const PANEL_WIDTH: f64 = 416.0;
pub const PANEL_HEIGHT: f64 = 788.0;

// All window coordinates below are physical pixels. Logical sizes are converted
// once using the badge monitor, including monitors left/above the primary one.
fn placement(bx: f64, by: f64, left: f64, top: f64, width: f64, height: f64, scale: f64) -> (i32, i32, f64, f64) {
    let panel_width = PANEL_WIDTH.min((width / scale).max(1.0));
    let panel_height = PANEL_HEIGHT.min((height / scale).max(1.0));
    let pw = panel_width * scale;
    let ph = panel_height * scale;
    let gap = 10.0 * scale;
    let right = bx + BADGE * scale + gap;
    let x = if right + pw <= left + width { right } else { bx - pw - gap };
    (x.max(left).min((left + width - pw).max(left)).round() as i32,
     by.max(top).min((top + height - ph).max(top)).round() as i32,
     panel_width, panel_height)
}

fn dock_axis(value:i32, start:i32, extent:u32, size:f64, scale:f64)->i32 {
    let end=(start as f64+extent as f64-size*scale).max(start as f64);
    let value=(value as f64).clamp(start as f64,end);
    let threshold=14.0*scale;
    if value-start as f64<=threshold {start}
    else if end-value<=threshold {end.round() as i32}
    else {value.round() as i32}
}

#[tauri::command]
pub fn widget_dock(app:tauri::AppHandle)->Result<bool> {
    // A pause during dragging is not a release. Defer docking until the mouse
    // button is released, including when a native move loop owns the pointer.
    #[cfg(windows)]
    if unsafe { windows_sys::Win32::UI::Input::KeyboardAndMouse::GetAsyncKeyState(1) } < 0 {return Ok(false);}
    let badge=app.get_webview_window("badge").ok_or("Das Symbol ist nicht verfügbar.")?;
    let monitor=badge.current_monitor().map_err(|_|"Der Bildschirm ist nicht verfügbar.")?
        .or(badge.primary_monitor().map_err(|_|"Der Bildschirm ist nicht verfügbar.")?)
        .ok_or("Der Bildschirm ist nicht verfügbar.")?;
    let p=badge.outer_position().map_err(|_|"Die Symbolposition ist nicht verfügbar.")?;
    let area=monitor.work_area();
    let x=dock_axis(p.x,area.position.x,area.size.width,BADGE,monitor.scale_factor());
    let y=dock_axis(p.y,area.position.y,area.size.height,BADGE,monitor.scale_factor());
    if p.x!=x||p.y!=y {badge.set_position(tauri::PhysicalPosition::new(x,y)).map_err(|_|"Das Symbol konnte nicht am Bildschirm ausgerichtet werden.")?;}
    if app.get_webview_window("main").is_some_and(|w|w.is_visible().unwrap_or(false)) {position_panel(&app)?;}
    Ok(true)
}

fn shape(window:&tauri::WebviewWindow) {
    #[cfg(windows)] {
        use windows_sys::Win32::Graphics::Gdi::{CreateEllipticRgn,CreateRoundRectRgn,SetWindowRgn,DeleteObject};
        if let (Ok(hwnd),Ok(size),Ok(scale))=(window.hwnd(),window.inner_size(),window.scale_factor()) {
            // The native region encloses the CSS edge. It never clips its
            // antialiased border; it only removes empty, clickable corners.
            unsafe {
                let r=if window.label()=="badge" {CreateEllipticRgn(0,0,size.width as i32+1,size.height as i32+1)}
                else {CreateRoundRectRgn(0,0,size.width as i32+1,size.height as i32+1,(40.0*scale).round() as i32,(40.0*scale).round() as i32)};
                if !r.is_null()&&SetWindowRgn(hwnd.0,r,1)==0 {DeleteObject(r);}
            }
        }
    }
}

pub fn position_panel(app: &tauri::AppHandle) -> Result<()> {
    let badge = app.get_webview_window("badge").ok_or("Das Symbol ist nicht verfügbar.")?;
    let panel = app.get_webview_window("main").ok_or("Das Panel ist nicht verfügbar.")?;
    let monitor = badge.current_monitor().map_err(|_| "Der Bildschirm ist nicht verfügbar.")?
        .ok_or("Der Bildschirm ist nicht verfügbar.")?;
    let area = monitor.work_area();
    let p = badge.outer_position().map_err(|_| "Die Fensterposition ist nicht verfügbar.")?;
    let (x,y,width,height) = placement(p.x as f64,p.y as f64,area.position.x as f64,area.position.y as f64,
        area.size.width as f64,area.size.height as f64,monitor.scale_factor());
    panel.set_size(tauri::LogicalSize::new(width,height)).map_err(|_| "Die Panelgröße konnte nicht gesetzt werden.")?;
    panel.set_position(tauri::PhysicalPosition::new(x,y)).map_err(|_| "Das Panel konnte nicht positioniert werden.")?;
    Ok(())
}

#[tauri::command]
pub fn set_panel_visible(app: tauri::AppHandle, visible: bool) -> Result<()> {
    let panel = app.get_webview_window("main").ok_or("Das Panel ist nicht verfügbar.")?;
    if visible {
        position_panel(&app)?;
        panel.show().map_err(|_| "Das Panel konnte nicht geöffnet werden.")?;
        panel.set_focus().map_err(|_| "Das Panel konnte nicht aktiviert werden.")?;
    } else { panel.hide().map_err(|_| "Das Panel konnte nicht eingeklappt werden.")?; }
    let _ = app.emit_to("badge","widget-panel-state",visible);
    Ok(())
}
#[tauri::command]
pub fn widget_toggle(app: tauri::AppHandle) -> Result<()> {
    // Wake the hidden renderer before delivering the state change. WebView2 may
    // throttle its timers while hidden; opening must not wait for a React timer.
    if app.get_webview_window("main").is_some_and(|w|!w.is_visible().unwrap_or(false)) {
        set_panel_visible(app.clone(),true)?;
    }
    app.emit_to("main","widget-request-toggle",()).map_err(|_| "Das Widget konnte nicht geöffnet werden.".into())
}
#[tauri::command]
pub fn widget_quick_input(app: tauri::AppHandle) -> Result<()> {
    set_panel_visible(app.clone(),true)?;
    app.emit_to("main","widget-request-input",()).map_err(|_| "Die Eingabe konnte nicht geöffnet werden.".into())
}
#[tauri::command]
pub fn widget_badge_ready(app: tauri::AppHandle) {let _=app.emit_to("main","widget-badge-ready",());}
#[tauri::command]
pub fn widget_has_focus(app: tauri::AppHandle) -> bool {
    ["main","badge"].iter().any(|label| app.get_webview_window(label).is_some_and(|w| w.is_focused().unwrap_or(false)))
}
#[tauri::command]
pub fn widget_pin(app: tauri::AppHandle, on: bool) -> Result<()> {
    for label in ["main","badge"] { if let Some(w)=app.get_webview_window(label) {
        w.set_always_on_top(on).map_err(|_| "Der Vordergrundstatus konnte nicht gesetzt werden.")?;
    }}
    Ok(())
}
#[tauri::command]
pub fn widget_quit(app: tauri::AppHandle) { app.exit(0); }
#[tauri::command]
pub fn widget_request_quit(app: tauri::AppHandle) { let _=app.emit_to("main","widget-request-quit",()); }

pub fn setup(app: &tauri::AppHandle) {
    for label in ["main","badge"] {
        if let Some(window) = app.get_webview_window(label) {
            shape(&window);
            let handle=app.clone();
            let window_handle=window.clone();
            let label=label.to_string();
            window.on_window_event(move |event| match event {
                tauri::WindowEvent::Focused(false) => {let _=handle.emit_to("main","widget-panel-blur",());},
                tauri::WindowEvent::Focused(true) => {let _=handle.emit_to("main","widget-panel-focus",());},
                tauri::WindowEvent::Moved(_) if label=="badge" => {
                    if handle.get_webview_window("main").is_some_and(|w|w.is_visible().unwrap_or(false)) {let _=position_panel(&handle);}
                },
                tauri::WindowEvent::Resized(_) => {shape(&window_handle);},
                tauri::WindowEvent::ScaleFactorChanged{..} => {shape(&window_handle);let _=position_panel(&handle);},
                tauri::WindowEvent::CloseRequested{api,..} => {
                    api.prevent_close();
                    if label=="main" {let _=handle.emit_to("main","widget-request-collapse",());}
                    else {let _=handle.emit_to("main","widget-request-quit",());}
                },
                _=>{}
            });
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn opens_left_near_right_screen_edge() {
        let (x,y,_,h)=placement(1770.0,50.0,0.0,0.0,1920.0,1040.0,1.0);
        assert_eq!((x,y,h),(1344,50,788.0));
    }
    #[test] fn opens_right_and_clamps_bottom_on_negative_monitor() {
        let (x,y,_,h)=placement(-1850.0,900.0,-1920.0,0.0,1920.0,1040.0,1.0);
        assert_eq!((x,y,h),(-1712,252,788.0));
    }
    #[test] fn respects_taskbar_and_fractional_scale() {
        let (x,y,_,h)=placement(2200.0,1200.0,0.0,40.0,2560.0,1360.0,1.5);
        assert!(x>=0 && x as f64+PANEL_WIDTH*1.5<=2560.0);
        assert!(y>=40 && y as f64+h*1.5<=1400.0);
        assert_eq!(h,788.0);
    }
    #[test] fn docks_inside_work_area_at_all_supported_scales() {
        for scale in [1.0,1.25,1.5,2.0] {
            let right=dock_axis(9999,-1920,1920,BADGE,scale);
            assert_eq!(right,(-BADGE*scale).round() as i32);
            assert_eq!(dock_axis(-3000,-1920,1920,BADGE,scale),-1920);
            assert_eq!(dock_axis(-1915,-1920,1920,BADGE,scale),-1920);
            assert_eq!(dock_axis(-900,-1920,1920,BADGE,scale),-900);
        }
    }
    #[test] fn short_screen_has_no_invisible_bottom_margin_or_overflow() {
        let (_,y,_,h)=placement(20.0,600.0,0.0,40.0,1920.0,680.0,1.25);
        assert_eq!(h,544.0);
        assert_eq!(y,40);
        assert_eq!(y as f64+h*1.25,720.0);
    }
    #[test] fn narrow_screen_contains_both_horizontal_edges() {
        let (x,_,w,_)=placement(600.0,0.0,0.0,0.0,800.0,1400.0,2.0);
        assert_eq!(w,400.0);
        assert_eq!(x,0);
        assert_eq!(x as f64+w*2.0,800.0);
    }
}

use crate::{app_file, write_atomic, Result, Services};
use serde_json::{json, Value};
use tauri::State;

const SITE: &str = "https://kalorie-coach-fatih.fatihgenc.chatgpt.site";
fn credential(name: &str) -> Result<keyring::Entry> {
    keyring::Entry::new("de.fatih.kaloriewidget", name)
        .map_err(|_| "Die Windows-Anmeldeinformationsverwaltung ist nicht verfügbar.".into())
}
fn secret(name: &str) -> Result<String> {
    credential(name)?.get_password().map_err(|_| "Bitte das Widget zuerst mit deiner privaten Site verbinden.".into())
}

// Bootstrap accepts the hosting access token on stdin only. It never reaches
// frontend source, command arguments, journal backups, or normal console output.
pub fn configure_from_stdin() -> Result<()> {
    use std::io::Read;
    let mut text = String::new();
    std::io::stdin().take(16000).read_to_string(&mut text)
        .map_err(|_| "Die sichere Einrichtung konnte nicht gelesen werden.")?;
    let input: Value = serde_json::from_str(&text).map_err(|_| "Ungültige Einrichtung.")?;
    let token = input["gateway"].as_str().filter(|s| !s.is_empty() && s.len() < 12000 && !s.contains(['\n', '\r']))
        .ok_or("Ungültige Einrichtung.")?;
    credential("sites-gateway")?.set_password(token)
        .map_err(|_| "Der Site-Zugang konnte nicht sicher gespeichert werden.".into())
}
async fn request(state: &Services, method: reqwest::Method, path: &str, body: Option<Value>, paired: bool) -> Result<Value> {
    let mut req = state.client.request(method, format!("{SITE}/api/coach/{path}"))
        .header("OAI-Sites-Authorization", format!("Bearer {}", secret("sites-gateway")?));
    if paired { req = req.header("x-device-token", secret("sites-device")?); }
    if let Some(value) = body { req = req.json(&value); }
    let response = req.send().await.map_err(|_| "Deine private Site ist gerade nicht erreichbar. Lokale Einträge bleiben gesichert.")?;
    let status = response.status();
    let value: Value = response.json().await.map_err(|_| "Bitte erneut mit deiner privaten Site verbinden.")?;
    if !status.is_success() {
        if status.as_u16() == 409 { return Err("CLOUD_CONFLICT".into()); }
        return Err(value["error"].as_str().unwrap_or("Der Geräteabgleich ist derzeit nicht verfügbar.").to_string());
    }
    Ok(value)
}
#[tauri::command]
pub fn cloud_status() -> Result<Value> {
    Ok(json!({ "url": SITE, "gateway": secret("sites-gateway").is_ok(), "connected": secret("sites-device").is_ok() }))
}
#[tauri::command]
pub async fn cloud_connect(state: State<'_, Services>, code: String) -> Result<()> {
    let code = code.trim().to_lowercase();
    if code.len() != 16 || !code.bytes().all(|b| b.is_ascii_hexdigit()) { return Err("Bitte den vollständigen Kopplungscode eingeben.".into()); }
    if secret("sites-device").is_ok() { return Err("Bitte die bestehende Verbindung zuerst trennen.".into()); }
    let token = format!("{}{}", uuid::Uuid::new_v4().simple(), uuid::Uuid::new_v4().simple());
    let token = &token[..48];
    request(&state, reqwest::Method::POST, "claim", Some(json!({"code":code,"token":token})), false).await?;
    credential("sites-device")?.set_password(token).map_err(|_| "Der Gerätezugang konnte nicht sicher gespeichert werden.".into())
}
#[tauri::command]
pub fn cloud_disconnect(app: tauri::AppHandle, state: State<Services>) -> Result<()> {
    let _guard = state.io.lock().map_err(|_| "Die Speicherung ist gerade nicht verfügbar.")?;
    match credential("sites-device")?.delete_credential() {
        Ok(_) | Err(keyring::Error::NoEntry) => {},
        Err(_) => return Err("Die Verbindung konnte nicht getrennt werden.".into()),
    }
    let path = app_file(&app, "cloud-base.json")?;
    if path.exists() { std::fs::remove_file(path).map_err(|_| "Die Abgleichsbasis konnte nicht entfernt werden.")?; }
    Ok(())
}
#[tauri::command]
pub async fn cloud_pull(state: State<'_, Services>) -> Result<Value> {
    request(&state, reqwest::Method::GET, "state", None, true).await
}
#[tauri::command]
pub async fn cloud_push(state: State<'_, Services>, snapshot: Value, expected_revision: u64) -> Result<Value> {
    request(&state, reqwest::Method::PUT, "state", Some(json!({"snapshot":snapshot,"expectedRevision":expected_revision})), true).await
}
#[tauri::command]
pub fn cloud_base(app: tauri::AppHandle) -> Result<Option<Value>> {
    let path = app_file(&app, "cloud-base.json")?;
    if !path.exists() { return Ok(None); }
    let text = std::fs::read_to_string(path).map_err(|_| "Die Abgleichsbasis konnte nicht gelesen werden.")?;
    serde_json::from_str(&text).map(Some).map_err(|_| "Die Abgleichsbasis ist beschädigt. Bitte die Verbindung neu einrichten.".into())
}
#[tauri::command]
pub fn cloud_remember(app: tauri::AppHandle, state: State<Services>, document: Value) -> Result<()> {
    if !document["revision"].is_u64() || !document["snapshot"]["entries"].is_array() { return Err("Ungültige Abgleichsbasis.".into()); }
    let _guard = state.io.lock().map_err(|_| "Die Speicherung ist gerade nicht verfügbar.")?;
    write_atomic(&app_file(&app, "cloud-base.json")?, document.to_string().as_bytes())
}
#[tauri::command]
pub fn cloud_open() -> Result<()> {
    #[cfg(windows)] {
        use std::os::windows::process::CommandExt;
        std::process::Command::new("rundll32.exe").args(["url.dll,FileProtocolHandler", SITE]).creation_flags(0x08000000)
            .spawn().map_err(|_| "Bitte öffne die Site in deinem Browser.")?;
    }
    Ok(())
}

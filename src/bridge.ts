import { invoke, isTauri } from "@tauri-apps/api/core";
import {
  getCurrentWindow,
  availableMonitors,
  PhysicalPosition,
} from "@tauri-apps/api/window";
import { defaults, parseData } from "./domain";
import type { AppData, Food, Settings } from "./domain";
export const native = isTauri();
const key = "kalorie-widget-v1";
let saveQueue = Promise.resolve();
export async function loadData(): Promise<AppData> {
  const raw = native
    ? await invoke<string | null>("load_data")
    : localStorage.getItem(key);
  return raw ? parseData(JSON.parse(raw)) : defaults();
}
export function saveData(data: AppData): Promise<void> {
  const json = JSON.stringify(data);
  const task = saveQueue
    .catch(() => {})
    .then(async () => {
      if (native) await invoke("save_data", { json });
      else localStorage.setItem(key, json);
    });
  saveQueue = task;
  return task;
}
export async function exportData(data: AppData) {
  const json = JSON.stringify(data, null, 2);
  if (native) return invoke<string>("export_data", { json });
  const a = document.createElement("a");
  const url = URL.createObjectURL(
    new Blob([json], { type: "application/json" }),
  );
  a.href = url;
  a.download = `kalorie-widget-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "Deine Sicherung wurde heruntergeladen.";
}
export async function searchProducts(query: string): Promise<Food[]> {
  if (!native)
    throw new Error("Die Lebensmittelsuche ist in der Windows-App verfügbar.");
  return invoke("search_food", { query });
}
export async function estimateFood(
  text: string,
  settings: Settings,
  details: { quantity?: number; comment?: string } = {},
): Promise<Food> {
  if (!native) throw new Error("KI ist in der Windows-App verfügbar.");
  return invoke("estimate_food", {
    text,
    quantity: details.quantity,
    comment: details.comment,
    provider: settings.provider,
    model: settings.model,
    dailyLimit: settings.dailyLimit,
  });
}
export const hasKey = async (provider: string): Promise<boolean> =>
  native ? invoke("has_api_key", { provider }) : false;
export const setKey = async (provider: string, value: string) => {
  if (!native)
    throw new Error(
      "API-Schlüssel lassen sich nur in der Windows-App hinterlegen.",
    );
  await invoke("set_api_key", { provider, key: value });
};
export const usage = async (): Promise<{ date: string; calls: number }> =>
  native ? invoke("api_usage") : { date: "", calls: 0 };
export async function transcribe(
  bytes: number[],
  dailyLimit: number,
): Promise<string> {
  return invoke("transcribe_audio", { bytes, dailyLimit });
}
export async function dragWindow() {
  if (native) await getCurrentWindow().startDragging();
}
export async function closeWindow() {
  if (native) { await saveQueue; await invoke("widget_quit"); }
}
export async function pinWindow(on: boolean) {
  if (native) await invoke("widget_pin", {on});
}
export async function resizeWindow(collapsed: boolean) {
  if (native) await invoke("set_panel_visible", {visible: !collapsed});
}
export async function restoreWindow() {
  if (!native) return () => {};
  const win = getCurrentWindow();
  if (win.label !== "badge") return () => {};
  try {
    const raw = localStorage.getItem("kalorie-window-position");
    if (raw) {
      const { x, y } = JSON.parse(raw);
      const monitors = await availableMonitors();
      if (
        Number.isFinite(x) &&
        Number.isFinite(y) &&
        monitors.some(
          (m) =>
            x >= m.workArea.position.x &&
            y >= m.workArea.position.y &&
            x + 128 * m.scaleFactor <= m.workArea.position.x + m.workArea.size.width &&
            y + 128 * m.scaleFactor <= m.workArea.position.y + m.workArea.size.height,
        )
      )
        await win.setPosition(new PhysicalPosition(x, y));
    }
  } catch {
    /* A disconnected monitor or old position is harmless. */
  }
  await invoke("widget_dock");
  let timer:ReturnType<typeof setTimeout>|undefined;
  let disposed=false;
  const dock=()=>{void invoke<boolean>("widget_dock").then(done=>{if(!done&&!disposed)timer=setTimeout(dock,80);}).catch(()=>{});};
  const unlisten=await win.onMoved(({ payload }) => {
    localStorage.setItem("kalorie-window-position", JSON.stringify(payload));
    clearTimeout(timer);
    timer=setTimeout(dock,180);
  });
  return ()=>{disposed=true;clearTimeout(timer);unlisten();};
}

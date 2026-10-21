import { invoke, isTauri } from "@tauri-apps/api/core";
import {
  getCurrentWindow,
  currentMonitor,
  availableMonitors,
  LogicalSize,
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
): Promise<Food> {
  if (!native) throw new Error("KI ist in der Windows-App verfügbar.");
  return invoke("estimate_food", {
    text,
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
  if (native) await getCurrentWindow().close();
}
export async function pinWindow(on: boolean) {
  if (native) await getCurrentWindow().setAlwaysOnTop(on);
}
export async function resizeWindow(collapsed: boolean) {
  if (!native) return;
  const win = getCurrentWindow();
  const monitor = await currentMonitor();
  const scale = monitor?.scaleFactor || 1;
  const height = collapsed
    ? 168
    : Math.min(820, monitor ? monitor.workArea.size.height / scale - 28 : 820);
  const width = collapsed ? 168 : 460;
  await win.setSize(new LogicalSize(width, height));
  await invoke("shape_window", { collapsed });
  const pos = await win.outerPosition();
  if (monitor) {
    const area = monitor.workArea;
    const x = Math.min(
      Math.max(pos.x, area.position.x),
      area.position.x + area.size.width - width * scale,
    );
    const y = Math.min(
      Math.max(pos.y, area.position.y),
      area.position.y + area.size.height - height * scale,
    );
    await win.setPosition(new PhysicalPosition(Math.round(x), Math.round(y)));
  }
}
export async function restoreWindow() {
  if (!native) return () => {};
  const win = getCurrentWindow();
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
            x + 168 <= m.workArea.position.x + m.workArea.size.width &&
            y + 168 <= m.workArea.position.y + m.workArea.size.height,
        )
      )
        await win.setPosition(new PhysicalPosition(x, y));
    }
  } catch {
    /* A disconnected monitor or old position is harmless. */
  }
  return win.onMoved(({ payload }) => {
    localStorage.setItem("kalorie-window-position", JSON.stringify(payload));
  });
}

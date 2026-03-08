import { Window } from "node-screenshots";

export interface WindowInfo {
  id: number;
  title: string;
  appName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
}

export function getAllWindows(): WindowInfo[] {
  const windows = Window.all();
  return windows
    .map((w) => ({
      id: w.id(),
      title: w.title(),
      appName: w.appName(),
      x: w.x(),
      y: w.y(),
      width: w.width(),
      height: w.height(),
      isMinimized: w.isMinimized(),
    }))
    .filter((w) => w.title.trim().length > 0);
}

export function findWindowByTitle(searchTitle: string): WindowInfo | null {
  const allWindows = getAllWindows();
  const lowerSearch = searchTitle.toLowerCase();

  // Exact match first
  const exact = allWindows.find(
    (w) => w.title.toLowerCase() === lowerSearch
  );
  if (exact) return exact;

  // Substring match
  const partial = allWindows.filter((w) =>
    w.title.toLowerCase().includes(lowerSearch)
  );
  if (partial.length > 0) return partial[0];

  return null;
}

export function captureWindowById(windowId: number): Buffer | null {
  const windows = Window.all();
  const target = windows.find((w) => w.id() === windowId);
  if (!target) return null;

  const image = target.captureImageSync();
  return image.toPngSync();
}

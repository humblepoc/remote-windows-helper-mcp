import { getAllWindows } from "../utils/windows.js";

export const listWindowsToolName = "list_windows";

export const listWindowsToolDescription =
  "List all visible windows on the system with their title, ID, app name, position, and dimensions. Use this to discover available windows before taking a screenshot of a specific one.";

export const listWindowsInputSchema = {};

export async function listWindowsHandler() {
  const windows = getAllWindows();

  if (windows.length === 0) {
    return {
      content: [{ type: "text" as const, text: "No visible windows found." }],
    };
  }

  const summary = windows.map((w) => ({
    id: w.id,
    title: w.title,
    app: w.appName,
    position: { x: w.x, y: w.y },
    size: { width: w.width, height: w.height },
    minimized: w.isMinimized,
  }));

  return {
    content: [
      { type: "text" as const, text: JSON.stringify(summary, null, 2) },
    ],
  };
}

import { z } from "zod";
import { findWindowByTitle, captureWindowById } from "../utils/windows.js";
import { getTelegramConfig, sendPhotoToTelegram } from "../utils/telegram.js";

export const screenshotWindowToolName = "screenshot_window";

export const screenshotWindowToolDescription =
  "Take a screenshot of a specific application window by its title. Use list_windows first to see available windows. Matches by case-insensitive substring.";

export const screenshotWindowInputSchema = {
  window_title: z
    .string()
    .min(1)
    .describe(
      "Title (or partial title) of the window to capture. Case-insensitive substring match."
    ),
};

export async function screenshotWindowHandler({
  window_title,
}: {
  window_title: string;
}) {
  const windowInfo = findWindowByTitle(window_title);

  if (!windowInfo) {
    return {
      content: [
        {
          type: "text" as const,
          text: `No window found matching "${window_title}". Use list_windows to see available windows.`,
        },
      ],
    };
  }

  if (windowInfo.isMinimized) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Window "${windowInfo.title}" is minimized. Cannot capture minimized windows.`,
        },
      ],
    };
  }

  const pngBuffer = captureWindowById(windowInfo.id);
  if (!pngBuffer) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Failed to capture window "${windowInfo.title}".`,
        },
      ],
    };
  }

  const base64 = pngBuffer.toString("base64");

  const contentBlocks: Array<
    | { type: "text"; text: string }
    | { type: "image"; data: string; mimeType: string }
  > = [];

  // Send to Telegram
  const telegramConfig = getTelegramConfig();
  if (telegramConfig) {
    const caption = `Window: ${windowInfo.title} (${windowInfo.width}x${windowInfo.height})`;
    const result = await sendPhotoToTelegram(
      telegramConfig,
      pngBuffer,
      caption
    );
    if (result.ok) {
      contentBlocks.push({
        type: "text",
        text: `Sent to Telegram (message ID: ${result.messageId})`,
      });
    } else {
      contentBlocks.push({
        type: "text",
        text: `Failed to send to Telegram: ${result.error}`,
      });
    }
  } else {
    contentBlocks.push({
      type: "text",
      text: "Telegram not configured (set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID env vars)",
    });
  }

  contentBlocks.push({
    type: "image",
    data: base64,
    mimeType: "image/png",
  });

  return { content: contentBlocks };
}

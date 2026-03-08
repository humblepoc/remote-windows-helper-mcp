import { z } from "zod";
import { Monitor } from "node-screenshots";
import { getTelegramConfig, sendPhotoToTelegram } from "../utils/telegram.js";

export const screenshotScreenToolName = "screenshot_screen";

export const screenshotScreenToolDescription =
  "Take a screenshot of the entire screen (primary monitor by default). Optionally specify a monitor index. The screenshot is sent to Telegram and also returned inline as a base64 image.";

export const screenshotScreenInputSchema = {
  monitor_index: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe(
      "Index of the monitor to capture (0-based). Defaults to primary monitor."
    ),
};

export async function screenshotScreenHandler({
  monitor_index,
}: {
  monitor_index?: number;
}) {
  const monitors = Monitor.all();

  if (monitors.length === 0) {
    return {
      content: [{ type: "text" as const, text: "No monitors found." }],
    };
  }

  const targetIndex = monitor_index ?? 0;
  if (targetIndex >= monitors.length) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Monitor index ${targetIndex} out of range. Available monitors: 0-${monitors.length - 1}`,
        },
      ],
    };
  }

  const monitor = monitors[targetIndex];
  const image = monitor.captureImageSync();
  const pngBuffer = image.toPngSync();
  const base64 = pngBuffer.toString("base64");

  const contentBlocks: Array<
    | { type: "text"; text: string }
    | { type: "image"; data: string; mimeType: string }
  > = [];

  // Send to Telegram
  const telegramConfig = getTelegramConfig();
  if (telegramConfig) {
    const caption = `Screen capture - Monitor ${targetIndex} (${monitor.width()}x${monitor.height()})`;
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

  // Also return inline
  contentBlocks.push({
    type: "image",
    data: base64,
    mimeType: "image/png",
  });

  return { content: contentBlocks };
}

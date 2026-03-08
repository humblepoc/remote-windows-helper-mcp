import { z } from "zod";
import { unlink } from "node:fs/promises";
import { isFfmpegAvailable, recordScreen } from "../utils/ffmpeg.js";
import { getTelegramConfig, sendVideoToTelegram } from "../utils/telegram.js";

export const recordScreenToolName = "record_screen";

export const recordScreenToolDescription =
  "Record a short video of the screen. Duration is 1-30 seconds. The video is encoded as MP4 (H.264) and sent to Telegram. Requires ffmpeg installed on the system.";

export const recordScreenInputSchema = {
  duration_seconds: z
    .number()
    .int()
    .min(1)
    .max(30)
    .describe("Duration of the recording in seconds (1-30)."),
};

export async function recordScreenHandler({
  duration_seconds,
}: {
  duration_seconds: number;
}) {
  if (!isFfmpegAvailable()) {
    return {
      content: [
        {
          type: "text" as const,
          text: "ffmpeg is not installed or not in PATH. Install ffmpeg to use screen recording.",
        },
      ],
    };
  }

  const contentBlocks: Array<{ type: "text"; text: string }> = [];

  let videoPath: string;
  try {
    videoPath = await recordScreen({ durationSeconds: duration_seconds });
  } catch (err) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Screen recording failed: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
    };
  }

  // Send to Telegram
  const telegramConfig = getTelegramConfig();
  if (telegramConfig) {
    const caption = `Screen recording (${duration_seconds}s)`;
    const result = await sendVideoToTelegram(
      telegramConfig,
      videoPath,
      caption
    );
    if (result.ok) {
      contentBlocks.push({
        type: "text",
        text: `Video sent to Telegram (message ID: ${result.messageId})`,
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

  // Clean up temp file
  try {
    await unlink(videoPath);
    contentBlocks.push({
      type: "text",
      text: "Recording complete. Temp file cleaned up.",
    });
  } catch {
    contentBlocks.push({
      type: "text",
      text: `Recording saved to: ${videoPath}`,
    });
  }

  return { content: contentBlocks };
}

import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const TELEGRAM_API = "https://api.telegram.org";

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export interface TelegramResult {
  ok: boolean;
  messageId?: number;
  error?: string;
}

export function getTelegramConfig(): TelegramConfig | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    return null;
  }
  return { botToken, chatId };
}

export async function sendPhotoToTelegram(
  config: TelegramConfig,
  photoBuffer: Buffer,
  caption?: string
): Promise<TelegramResult> {
  const url = `${TELEGRAM_API}/bot${config.botToken}/sendPhoto`;

  const formData = new FormData();
  formData.append("chat_id", config.chatId);
  formData.append(
    "photo",
    new Blob([new Uint8Array(photoBuffer)], { type: "image/png" }),
    "screenshot.png"
  );
  if (caption) {
    formData.append("caption", caption);
  }

  try {
    const response = await fetch(url, { method: "POST", body: formData });
    const data = (await response.json()) as {
      ok: boolean;
      result?: { message_id: number };
      description?: string;
    };
    if (data.ok) {
      return { ok: true, messageId: data.result?.message_id };
    }
    return { ok: false, error: data.description || "Unknown Telegram error" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function sendVideoToTelegram(
  config: TelegramConfig,
  videoPath: string,
  caption?: string
): Promise<TelegramResult> {
  const url = `${TELEGRAM_API}/bot${config.botToken}/sendVideo`;

  const videoBuffer = await readFile(videoPath);
  const fileName = basename(videoPath);

  const formData = new FormData();
  formData.append("chat_id", config.chatId);
  formData.append(
    "video",
    new Blob([new Uint8Array(videoBuffer)], { type: "video/mp4" }),
    fileName
  );
  if (caption) {
    formData.append("caption", caption);
  }

  try {
    const response = await fetch(url, { method: "POST", body: formData });
    const data = (await response.json()) as {
      ok: boolean;
      result?: { message_id: number };
      description?: string;
    };
    if (data.ok) {
      return { ok: true, messageId: data.result?.message_id };
    }
    return { ok: false, error: data.description || "Unknown Telegram error" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

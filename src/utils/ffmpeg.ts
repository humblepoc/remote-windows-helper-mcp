import { spawn, execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Project root: build/utils/ffmpeg.js -> ../../ = project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..", "..");

/**
 * Resolve the ffmpeg executable path.
 * Checks project-local ffmpeg/ directory first, then falls back to PATH.
 */
function resolveFfmpegPath(): string {
  // Project-local ffmpeg (standalone — the preferred location)
  const localFfmpeg = join(PROJECT_ROOT, "ffmpeg", "ffmpeg.exe");
  if (existsSync(localFfmpeg)) {
    return localFfmpeg;
  }

  // Fallback: hope it's on PATH
  return "ffmpeg";
}

let cachedFfmpegPath: string | null = null;
function getFfmpegPath(): string {
  if (!cachedFfmpegPath) {
    cachedFfmpegPath = resolveFfmpegPath();
    console.error(`[ffmpeg] Resolved path: ${cachedFfmpegPath}`);
  }
  return cachedFfmpegPath;
}

export function isFfmpegAvailable(): boolean {
  try {
    const ffmpeg = getFfmpegPath();
    execSync(`"${ffmpeg}" -version`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export interface RecordOptions {
  durationSeconds: number;
}

export function recordScreen(options: RecordOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const ffmpeg = getFfmpegPath();
    const outputPath = join(
      tmpdir(),
      `screen-recording-${randomUUID()}.mp4`
    );

    const args = [
      "-f", "gdigrab",
      "-framerate", "15",
      "-t", String(options.durationSeconds),
      "-i", "desktop",
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-crf", "28",
      "-pix_fmt", "yuv420p",
      "-y",
      outputPath,
    ];

    const proc = spawn(ffmpeg, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    proc.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to start ffmpeg: ${err.message}`));
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(
          new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-500)}`)
        );
      }
    });

    // Safety timeout: kill after duration + 10 seconds
    const timeout = setTimeout(() => {
      proc.kill("SIGTERM");
      reject(new Error("ffmpeg recording timed out"));
    }, (options.durationSeconds + 10) * 1000);

    proc.on("close", () => clearTimeout(timeout));
  });
}

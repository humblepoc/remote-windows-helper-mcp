import { spawn, execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export function isFfmpegAvailable(): boolean {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
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

    const proc = spawn("ffmpeg", args, {
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

import { execFile } from "node:child_process";
import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

import type {
  ProcessedVideo,
  VideoProcessingProvider,
} from "@/lib/providers/types";

const execFileAsync = promisify(execFile);

type ProbeOutput = {
  format?: {
    duration?: string;
  };
};

export class FfmpegVideoProcessingProvider
  implements VideoProcessingProvider
{
  async process(
    inputPath: string,
    workspacePath: string,
  ): Promise<ProcessedVideo> {
    const ffmpegPath = process.env.FFMPEG_PATH || ffmpegStatic;
    const ffprobePath = process.env.FFPROBE_PATH || ffprobeStatic.path;

    if (!ffmpegPath || !ffprobePath) {
      throw new Error("FFmpeg binaries are not available on this platform.");
    }

    await mkdir(workspacePath, { recursive: true });
    const audioPath = path.join(workspacePath, "audio.mp3");
    const framesPath = path.join(workspacePath, "frames");
    await mkdir(framesPath, { recursive: true });

    const { stdout } = await execFileAsync(
      ffprobePath,
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "json",
        inputPath,
      ],
      { maxBuffer: 1024 * 1024 },
    );
    const probe = JSON.parse(stdout) as ProbeOutput;
    const durationSeconds = Number(probe.format?.duration);

    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      throw new Error("Could not determine the uploaded video duration.");
    }

    await execFileAsync(
      ffmpegPath,
      [
        "-y",
        "-i",
        inputPath,
        "-vn",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-b:a",
        "32k",
        audioPath,
      ],
      { maxBuffer: 10 * 1024 * 1024 },
    );

    const frameInterval = Math.max(durationSeconds / 10, 0.5);
    await execFileAsync(
      ffmpegPath,
      [
        "-y",
        "-i",
        inputPath,
        "-vf",
        `fps=1/${frameInterval},scale=640:-2`,
        "-frames:v",
        "10",
        "-q:v",
        "5",
        path.join(framesPath, "frame-%02d.jpg"),
      ],
      { maxBuffer: 10 * 1024 * 1024 },
    );

    const frameFiles = (await readdir(framesPath))
      .filter((fileName) => fileName.endsWith(".jpg"))
      .sort();
    const frames = frameFiles.map((fileName, index) => ({
      timestampSeconds: Math.min(index * frameInterval, durationSeconds),
      path: path.join(framesPath, fileName),
    }));

    return {
      durationSeconds,
      audioPath,
      frames,
      cleanup: () => rm(workspacePath, { recursive: true, force: true }),
    };
  }
}

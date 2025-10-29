const fs = require("fs");
const path = require("path");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const DOWNLOAD_DIR = path.resolve(__dirname, "..", "downloads");

function ensureDownloadDir() {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }
}

function sanitizeTitle(title) {
  if (!title) return `yt-audio-${Date.now()}`;
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-_]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

async function downloadVideo(url, tempPath) {
  return new Promise((resolve, reject) => {
    const stream = ytdl(url, { quality: "highestaudio" })
      .pipe(fs.createWriteStream(tempPath))
      .on("finish", resolve)
      .on("error", reject);

    stream.on("error", reject);
  });
}

async function convertToMp3(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec("libmp3lame")
      .format("mp3")
      .on("end", resolve)
      .on("error", reject)
      .save(outputPath);
  });
}

async function downloadAndConvertToMp3(url) {
  ensureDownloadDir();

  try {
    const info = await ytdl.getInfo(url);
    const title = sanitizeTitle(info.videoDetails?.title || "yt-audio");
    const tempPath = path.join(DOWNLOAD_DIR, `${title}-${Date.now()}.mp4`);
    const outputPath = path.join(DOWNLOAD_DIR, `${title}.mp3`);

    await downloadVideo(url, tempPath);
    await convertToMp3(tempPath, outputPath);

    fs.unlink(tempPath, () => {});

    return {
      path: outputPath,
      title,
      lengthSeconds: Number(info.videoDetails?.lengthSeconds || 0),
      viewCount: Number(info.videoDetails?.viewCount || 0),
    };
  } catch (error) {
    console.error("❌ YTMP3 error:", error);
    throw error;
  }
}

function removeFileSafe(filePath) {
  if (!filePath) return;

  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error(`⚠️ Failed to delete file ${filePath}:`, err.message);
    }
  });
}

module.exports = {
  downloadAndConvertToMp3,
  removeFileSafe,
  isValidYouTubeUrl: ytdl.validateURL,
  DOWNLOAD_DIR,
};

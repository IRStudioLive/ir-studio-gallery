import chokidar from "chokidar";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const galleriesRoot = process.env.GALLERIES_ROOT;
const watermarkPath = process.env.WATERMARK_PATH;

if (!galleriesRoot || !watermarkPath) {
  console.error("❌ Missing env vars: GALLERIES_ROOT or WATERMARK_PATH");
  process.exit(1);
}

console.log("👀 Watching root:", galleriesRoot);
console.log("🏷️ Watermark:", watermarkPath);

async function makePreview(srcFile) {
  const outFile = srcFile.replace("/originals/", "/previews/");

  await fs.promises.mkdir(path.dirname(outFile), { recursive: true });

  const img = sharp(srcFile).resize({
    width: 3000,
    fit: "inside",
    withoutEnlargement: true,
  });

  const meta = await img.metadata();
  const targetW = Math.max(200, Math.floor((meta.width || 3000) * 0.45));

  const wmBuf = await sharp(watermarkPath)
    .resize({ width: targetW, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();

  await img
    .composite([{ input: wmBuf, gravity: "center", blend: "over" }])
    .jpeg({ quality: 82 })
    .toFile(outFile);

  console.log("✅ Preview created:", outFile);
}

const watcher = chokidar.watch(`${galleriesRoot}/**/originals/**/*.{jpg,jpeg,JPG,JPEG}`, {
  ignoreInitial: true,
  usePolling: true,              // reliable on macOS
  interval: 500,
  binaryInterval: 500,
  awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 200 },
});

watcher.on("add", async (file) => {
  try {
    console.log("📌 New file:", file);
    await makePreview(file);
  } catch (e) {
    console.error("❌ Preview error:", e?.message || e);
  }
});

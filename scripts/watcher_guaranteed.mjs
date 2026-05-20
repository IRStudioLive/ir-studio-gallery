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

console.log("👀 GUARANTEED watcher running");
console.log("Root:", galleriesRoot);
console.log("Watermark:", watermarkPath);

async function ensurePreview(originalFile) {
  const previewFile = originalFile.replace("/originals/", "/previews/");

  // Only process files inside /originals/
  if (!originalFile.includes("/originals/")) return;

  // Only jpg/jpeg
  const lower = originalFile.toLowerCase();
  if (!lower.endsWith(".jpg") && !lower.endsWith(".jpeg")) return;

  // Skip if preview already exists
  if (fs.existsSync(previewFile)) return;

  await fs.promises.mkdir(path.dirname(previewFile), { recursive: true });

  const img = sharp(originalFile).resize({
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
    .toFile(previewFile);

  console.log("✅ Preview created:", previewFile);
}

const watcher = chokidar.watch(galleriesRoot, {
  ignoreInitial: true,
  persistent: true,
  usePolling: true,
  interval: 1000,
  binaryInterval: 1000,
  awaitWriteFinish: { stabilityThreshold: 1000, pollInterval: 250 },
});

watcher.on("add", (file) => {
  console.log("📌 add:", file);
  ensurePreview(file).catch((e) => console.error("❌", e?.message || e));
});

watcher.on("change", (file) => {
  // If Lightroom overwrites existing files, change event catches it
  ensurePreview(file).catch((e) => console.error("❌", e?.message || e));
});

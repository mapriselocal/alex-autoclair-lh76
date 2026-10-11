import { readdir, stat, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = "assets";
const MIN_BYTES = 300 * 1024;
const MAX_DIMENSION = 1920;
const QUALITY = 82;
const supported = new Set([".png", ".jpg", ".jpeg"]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

const files = (await walk(ROOT)).filter((file) =>
  supported.has(path.extname(file).toLowerCase())
);

let converted = 0;
let savedBytes = 0;

for (const input of files) {
  const sourceStat = await stat(input);
  if (sourceStat.size < MIN_BYTES) continue;

  const output = input.replace(/\.(png|jpe?g)$/i, ".webp");
  const tmp = output + ".tmp.webp";

  await mkdir(path.dirname(output), { recursive: true });

  await sharp(input)
    .rotate()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({ quality: QUALITY, effort: 4 })
    .toFile(tmp);

  const outStat = await stat(tmp);

  if (outStat.size >= sourceStat.size * 0.95) {
    const { unlink } = await import("node:fs/promises");
    await unlink(tmp);
    continue;
  }

  const { rename } = await import("node:fs/promises");
  await rename(tmp, output);

  converted += 1;
  savedBytes += sourceStat.size - outStat.size;
  console.log(
    `${input} -> ${output}: ${(sourceStat.size / 1024).toFixed(0)} KiB -> ${(outStat.size / 1024).toFixed(0)} KiB`
  );
}

console.log(
  `Converted ${converted} image(s), saved about ${(savedBytes / 1024 / 1024).toFixed(2)} MiB.`
);

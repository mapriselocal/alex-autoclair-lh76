import { access, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = ".";
const SITE_ORIGIN = "https://alexautoclair76.fr/";
const SKIP_DIRS = new Set([".git", "node_modules"]);
const SKIP_ASSETS = new Set([
  "assets/01-логотип/иконка-сайта.png"
]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const full = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

function toRepoPath(reference, htmlFile) {
  let clean = reference.split(/[?#]/, 1)[0];
  if (clean.startsWith(SITE_ORIGIN)) clean = clean.slice(SITE_ORIGIN.length);
  if (clean.startsWith("/")) return clean.slice(1);
  return path.posix.normalize(path.posix.join(path.posix.dirname(htmlFile), clean));
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

const htmlFiles = (await walk(ROOT)).filter((file) => file.endsWith(".html"));
let changedFiles = 0;
let changedRefs = 0;

for (const htmlFile of htmlFiles) {
  const original = await readFile(htmlFile, "utf8");
  const refs = [...original.matchAll(/(?:https:\/\/alexautoclair76\.fr\/|\/|\.\.\/|\.\/|assets\/)[^"'()<>\s]+?\.(?:png|jpe?g)(?:[?#][^"'()<>\s]*)?/gi)];

  let updated = original;
  const replacements = new Map();

  for (const match of refs) {
    const ref = match[0];
    const repoPath = toRepoPath(ref, htmlFile);

    if (SKIP_ASSETS.has(repoPath)) continue;
    if (!/\.(png|jpe?g)$/i.test(repoPath)) continue;

    const webpPath = repoPath.replace(/\.(png|jpe?g)$/i, ".webp");
    if (!(await exists(webpPath))) continue;

    const replacement = ref.replace(/\.(png|jpe?g)(?=([?#]|$))/i, ".webp");
    if (replacement !== ref) replacements.set(ref, replacement);
  }

  for (const [from, to] of replacements) {
    updated = updated.split(from).join(to);
  }

  if (updated !== original) {
    await writeFile(htmlFile, updated);
    changedFiles += 1;
    changedRefs += replacements.size;
    console.log(`${htmlFile}: updated ${replacements.size} image reference(s)`);
  }
}

console.log(`Updated ${changedRefs} reference(s) across ${changedFiles} HTML file(s).`);

import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "apps/troski-reporter");
const distDir = path.join(rootDir, "dist");

const args = new Set(process.argv.slice(2));
const cleanOnly = args.has("--clean");

async function fileExists(target) {
  try {
    await readdir(target);
    return true;
  } catch (error) {
    return false;
  }
}

async function cleanDist() {
  await rm(distDir, { recursive: true, force: true });
}

async function build() {
  const htmlSourcePath = path.join(sourceDir, "code.html");
  const htmlTargetPath = path.join(distDir, "index.html");

  await cleanDist();
  await mkdir(distDir, { recursive: true });

  const html = await readFile(htmlSourcePath, "utf8");
  await writeFile(htmlTargetPath, html, "utf8");

  for (const asset of ["app.js", "styles.css", "screen.png"]) {
    const from = path.join(sourceDir, asset);
    const to = path.join(distDir, asset);
    await cp(from, to, { force: true });
  }

  console.log("Build complete.");
  console.log(`Source: ${sourceDir}`);
  console.log(`Output: ${distDir}`);
}

if (cleanOnly) {
  const hasDist = await fileExists(distDir);
  if (hasDist) {
    await cleanDist();
    console.log(`Removed ${distDir}`);
  } else {
    console.log("No dist directory to remove.");
  }
} else {
  await build();
}

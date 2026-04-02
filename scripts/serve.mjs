import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const args = process.argv.slice(2);

function readFlag(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) return fallback;
  return args[index + 1];
}

const directoryName = readFlag("--dir", "apps/troski-reporter");
const entryFile = readFlag("--entry", "code.html");
const requestedPort = Number(readFlag("--port", "4173"));
const host = readFlag("--host", "0.0.0.0");
const baseDir = path.join(rootDir, directoryName);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
};

async function ensureDirExists(target) {
  try {
    await access(target);
    return true;
  } catch (error) {
    return false;
  }
}

function getContentType(targetPath) {
  return mimeTypes[path.extname(targetPath).toLowerCase()] || "application/octet-stream";
}

function sendNotFound(response) {
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
}

const exists = await ensureDirExists(baseDir);
if (!exists) {
  console.error(`Directory not found: ${baseDir}`);
  process.exit(1);
}

function getLanAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const entries of Object.values(interfaces)) {
    for (const details of entries || []) {
      if (details.family === "IPv4" && !details.internal) {
        addresses.push(details.address);
      }
    }
  }
  return addresses;
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host}`);
  let requestedPath = decodeURIComponent(requestUrl.pathname);

  if (requestedPath === "/") {
    requestedPath = `/${entryFile}`;
  }

  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const targetPath = path.join(baseDir, safePath);

  if (!targetPath.startsWith(baseDir)) {
    sendNotFound(response);
    return;
  }

  try {
    const targetStat = await stat(targetPath);
    if (targetStat.isDirectory()) {
      sendNotFound(response);
      return;
    }

    response.writeHead(200, {
      "Content-Type": getContentType(targetPath),
      "Cache-Control": "no-store",
    });
    createReadStream(targetPath).pipe(response);
  } catch (error) {
    sendNotFound(response);
  }
});

function listen(startPort) {
  server.once("error", (error) => {
    if (error && error.code === "EADDRINUSE") {
      const nextPort = startPort + 1;
      console.warn(`Port ${startPort} is busy, trying ${nextPort}...`);
      listen(nextPort);
      return;
    }
    console.error(error);
    process.exit(1);
  });

  server.listen(startPort, host, () => {
    console.log(`Serving ${directoryName}`);
    console.log(`Local:   http://127.0.0.1:${startPort}`);
    for (const address of getLanAddresses()) {
      console.log(`Network: http://${address}:${startPort}`);
    }
  });
}

listen(requestedPort);

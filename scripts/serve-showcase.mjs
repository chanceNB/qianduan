import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve("dist-showcase"),
  port = Number(process.env.PORT ?? 4186);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);
  try {
    const path = resolve(
      root,
      "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (path !== root && !path.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    let data;
    try {
      data = await readFile(path);
    } catch {
      if (extname(path)) {
        res.writeHead(404).end();
        return;
      }
      data = await readFile(resolve(root, "index.html"));
    }
    res
      .writeHead(200, {
        "Content-Type": types[extname(path)] ?? "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        ...(process.env.SHOWCASE_OFFLINE_CHECK === "1"
          ? {
              "Content-Security-Policy":
                "default-src 'self'; connect-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; object-src 'none'",
            }
          : {}),
      })
      .end(data);
  } catch {
    res.writeHead(500).end("Static server error");
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`Showcase: http://127.0.0.1:${port}`),
);

import fs from "fs";
import path from "path";
import os from "os";

function safeJoin(root: string, ...parts: string[]) {
  const p = path.join(root, ...parts);
  const rel = path.relative(root, p);
  if (rel.startsWith("..") || path.isAbsolute(rel)) throw new Error("Invalid path");
  return p;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const gallery = url.searchParams.get("gallery") || "";
  const section = url.searchParams.get("section") || "Highlights";
  const file = url.searchParams.get("file") || "";

  const galleriesRoot =
    process.env.GALLERIES_ROOT || path.join(os.homedir(), "photo-cloud/galleries");

  if (!gallery || !file) return new Response("Missing gallery or file", { status: 400 });

  const filePath = safeJoin(galleriesRoot, gallery, "previews", section, file);
  if (!fs.existsSync(filePath)) return new Response("Not found", { status: 404 });

  const buf = fs.readFileSync(filePath);
  return new Response(buf, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "no-store",
    },
  });
}

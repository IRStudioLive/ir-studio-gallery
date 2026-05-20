import fs from "node:fs"
import path from "node:path"
import { NextRequest } from "next/server"
import { getR2Object, r2Enabled } from "@/lib/irstudiolive/r2"

export const runtime = "nodejs"

function localPathFromKey(key: string) {
  const normalized = key.replace(/^\/+/, "")
  return path.join(process.cwd(), "public", normalized)
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key")?.trim() || ""
  if (!key) {
    return new Response("Missing key", { status: 400 })
  }

  try {
    if (r2Enabled()) {
      const object = await getR2Object(key)
      if (!object.Body) {
        return new Response("Not found", { status: 404 })
      }

      const stream =
        typeof object.Body.transformToWebStream === "function"
          ? object.Body.transformToWebStream()
          : new ReadableStream({
              async start(controller) {
                const bytes = await object.Body?.transformToByteArray()
                if (bytes) controller.enqueue(bytes)
                controller.close()
              },
            })

      return new Response(stream, {
        headers: {
          "Content-Type": object.ContentType || "application/octet-stream",
          "Cache-Control": object.CacheControl || "public, max-age=31536000, immutable",
        },
      })
    }

    const filePath = localPathFromKey(key)
    if (!fs.existsSync(filePath)) {
      return new Response("Not found", { status: 404 })
    }

    const stat = fs.statSync(filePath)
    if (!stat.isFile()) {
      return new Response("Not found", { status: 404 })
    }

    const ext = path.extname(filePath).toLowerCase()
    const contentType =
      ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : ext === ".mp4"
              ? "video/mp4"
              : ext === ".mov"
                ? "video/quicktime"
                : "application/octet-stream"

    return new Response(fs.readFileSync(filePath), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("[tether/media] error", error)
    return new Response("Failed to load media", { status: 500 })
  }
}

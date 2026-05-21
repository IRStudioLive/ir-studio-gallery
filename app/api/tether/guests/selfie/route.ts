import fs from "node:fs"
import path from "node:path"
import { NextRequest, NextResponse } from "next/server"
import { buildMediaProxyUrl, putR2Object, r2Enabled } from "@/lib/irstudiolive/r2"

export const runtime = "nodejs"

function sanitizePart(value: string) {
  const cleaned = value.replace(/[^A-Za-z0-9._-]+/g, "_")
  return cleaned || "file"
}

function extFromMime(mime: string) {
  const lower = (mime || "").toLowerCase()
  if (lower.includes("png")) return ".png"
  if (lower.includes("webp")) return ".webp"
  if (lower.includes("heic")) return ".heic"
  if (lower.includes("heif")) return ".heif"
  return ".jpg"
}

function localPublicUrl(eventId: string, filename: string) {
  return `/irstudiolive/${encodeURIComponent(sanitizePart(eventId))}/guest-selfies/${encodeURIComponent(filename)}`
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const eventId = String(form.get("eventId") ?? "").trim()
    const file = form.get("file")

    if (!eventId) {
      return NextResponse.json({ ok: false, error: "Missing eventId" }, { status: 400 })
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 })
    }

    if (!file.type.toLowerCase().startsWith("image/")) {
      return NextResponse.json({ ok: false, error: "Selfie must be an image" }, { status: 415 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const ext = path.extname(file.name || "").toLowerCase() || extFromMime(file.type)
    const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const filename = `${stamp}_selfie${ext}`

    if (r2Enabled()) {
      const key = `events/${sanitizePart(eventId)}/guest-selfies/${filename}`
      await putR2Object({
        key,
        body: bytes,
        contentType: file.type || "image/jpeg",
      })
      return NextResponse.json({
        ok: true,
        url: buildMediaProxyUrl(key),
      })
    }

    const root = path.join(process.cwd(), "public", "irstudiolive", sanitizePart(eventId), "guest-selfies")
    fs.mkdirSync(root, { recursive: true })
    fs.writeFileSync(path.join(root, filename), bytes)

    return NextResponse.json({
      ok: true,
      url: localPublicUrl(eventId, filename),
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}

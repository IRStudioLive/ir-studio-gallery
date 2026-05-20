import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { getEvent, getEventStorageUsage, getPhotos, savePhotos, upsertEvent } from "@/lib/irstudiolive/store"
import { buildMediaProxyUrl, buildR2MediaKey, putR2Object, r2Enabled } from "@/lib/irstudiolive/r2"
import type { IRSyncState } from "@/lib/irstudiolive/subscriptions"

export const runtime = "nodejs"

function sanitizePart(value: string) {
  const cleaned = value.replace(/[^A-Za-z0-9._-]+/g, "_")
  return cleaned || "file"
}

function extFromName(name: string) {
  const ext = path.extname(name || "").toLowerCase()
  return ext || ""
}

function extFromMime(mime: string, kind: "image" | "video"): string {
  const m = (mime || "").toLowerCase()
  if (kind === "image") {
    if (m.includes("jpeg") || m.includes("jpg")) return ".jpg"
    if (m.includes("png")) return ".png"
    if (m.includes("webp")) return ".webp"
    if (m.includes("heic")) return ".heic"
    if (m.includes("heif")) return ".heif"
    return ".jpg"
  }
  if (m.includes("mp4")) return ".mp4"
  if (m.includes("quicktime")) return ".mov"
  if (m.includes("mov")) return ".mov"
  if (m.includes("m4v")) return ".m4v"
  if (m.includes("webm")) return ".webm"
  return ".mov"
}

function mediaKind(mime: string, filename: string): "image" | "video" | null {
  const m = (mime || "").toLowerCase()
  const ext = extFromName(filename)
  if (m.startsWith("image/")) return "image"
  if (m.startsWith("video/")) return "video"
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif"].includes(ext)) return "image"
  if ([".mp4", ".mov", ".m4v", ".webm"].includes(ext)) return "video"
  return null
}

function makeRecord(params: {
  eventId: string
  base: string
  publicBase: string
  kind: "image" | "video"
  mimeType: string | null
  byteSize: number
  syncState: IRSyncState
  cloudStored: boolean
}) {
  return {
    id: "ph_" + Math.random().toString(36).slice(2, 10),
    eventId: params.eventId,
    base: params.base,
    previewUrl: params.publicBase,
    fullUrl: params.publicBase,
    mediaType: params.kind,
    posterUrl: params.kind === "video" ? null : params.publicBase,
    mimeType: params.mimeType,
    durationSec: null,
    byteSize: params.byteSize,
    syncState: params.syncState,
    cloudStored: params.cloudStored,
    matchedRecipientIds: [],
    createdAt: new Date().toISOString(),
  }
}

function saveIncomingFileLocally(params: {
  eventId: string
  kind: "image" | "video"
  filename: string
  bytes: Buffer
  mimeType: string | null
}) {
  const root = path.join(
    process.cwd(),
    "public",
    "irstudiolive",
    sanitizePart(params.eventId),
    params.kind === "video" ? "videos" : "images"
  )
  fs.mkdirSync(root, { recursive: true })

  const originalName = sanitizePart(params.filename || `upload_${Date.now()}`)
  const ext = extFromName(originalName) || extFromMime(params.mimeType || "", params.kind)
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const base = sanitizePart(path.basename(originalName, path.extname(originalName))) || `upload_${stamp}`
  const savedName = `${stamp}_${base}${ext}`
  const savedPath = path.join(root, savedName)

  fs.writeFileSync(savedPath, params.bytes)

  const publicBase =
    `/irstudiolive/${encodeURIComponent(sanitizePart(params.eventId))}/` +
    `${params.kind === "video" ? "videos" : "images"}/${encodeURIComponent(savedName)}`

  const photos = getPhotos()
  const record = makeRecord({
    eventId: params.eventId,
    base,
    publicBase,
    kind: params.kind,
    mimeType: params.mimeType,
    byteSize: params.bytes.length,
    syncState: "local_only",
    cloudStored: false,
  })
  photos.unshift(record)
  savePhotos(photos)

  return record
}

async function saveIncomingFile(params: {
  eventId: string
  kind: "image" | "video"
  filename: string
  bytes: Buffer
  mimeType: string | null
}) {
  const originalName = sanitizePart(params.filename || `upload_${Date.now()}`)
  const ext = extFromName(originalName) || extFromMime(params.mimeType || "", params.kind)
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const base = sanitizePart(path.basename(originalName, path.extname(originalName))) || `upload_${stamp}`
  const savedName = `${stamp}_${base}${ext}`

  const event = getEvent(params.eventId) ?? upsertEvent({ id: params.eventId })
  const storage = getEventStorageUsage(params.eventId)
  const nextUsageBytes = storage.usedBytes + params.bytes.length
  const quotaBlocked = storage.quotaBytes > 0 && nextUsageBytes > storage.quotaBytes

  if (!r2Enabled()) {
    const record = saveIncomingFileLocally({
      ...params,
      filename: savedName,
    })
    return { ok: true as const, record }
  }

  if (!event.sellerPlan || event.sellerPlan === "free") {
    return {
      ok: false as const,
      status: 402,
      error: "Cloud sync requires a paid plan",
      syncState: "local_only" as IRSyncState,
      storage,
    }
  }

  if (quotaBlocked) {
    return {
      ok: false as const,
      status: 507,
      error: "Cloud storage quota exceeded",
      syncState: "quota_blocked" as IRSyncState,
      storage: {
        ...storage,
        overQuota: true,
        remainingBytes: 0,
      },
    }
  }

  const key = buildR2MediaKey({
    eventId: sanitizePart(params.eventId),
    kind: params.kind,
    filename: savedName,
  })

  await putR2Object({
    key,
    body: params.bytes,
    contentType: params.mimeType,
  })

  const publicBase = buildMediaProxyUrl(key)
  const photos = getPhotos()
  const record = makeRecord({
    eventId: params.eventId,
    base,
    publicBase,
    kind: params.kind,
    mimeType: params.mimeType,
    byteSize: params.bytes.length,
    syncState: "synced",
    cloudStored: true,
  })
  photos.unshift(record)
  savePhotos(photos)
  return { ok: true as const, record }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = (req.headers.get("content-type") || "").toLowerCase()
    const headerEventId = (req.headers.get("x-event-id") || "").trim()

    // Multipart/form-data path
    if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const form = await req.formData()
      const eventId = String(form.get("eventId") ?? headerEventId ?? "").trim()

      if (!eventId) {
        return NextResponse.json({ ok: false, error: "Missing eventId" }, { status: 400 })
      }

      const file = form.get("file")
      if (!(file instanceof File)) {
        return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 })
      }

      const kind = mediaKind(file.type || "", file.name || "")
      if (!kind) {
        return NextResponse.json({ ok: false, error: "Unsupported file type" }, { status: 415 })
      }

      upsertEvent({ id: eventId })

      const saved = await saveIncomingFile({
        eventId,
        kind,
        filename: file.name || `upload_${Date.now()}`,
        bytes: Buffer.from(await file.arrayBuffer()),
        mimeType: file.type || null,
      })

      if (!saved.ok) {
        return NextResponse.json(
          { ok: false, error: saved.error, syncState: saved.syncState, storage: saved.storage },
          { status: saved.status }
        )
      }

      console.log("[tether/upload] multipart ok", { eventId, kind, base: saved.record.base })
      return NextResponse.json({ ok: true, media: saved.record })
    }

    // Raw binary body path (image/jpeg, video/quicktime, etc)
    const eventId = headerEventId.trim()
    if (!eventId) {
      return NextResponse.json({ ok: false, error: "Missing X-Event-Id" }, { status: 400 })
    }

    const kind = mediaKind(contentType, "")
    if (!kind) {
      return NextResponse.json(
        { ok: false, error: `Unsupported raw content-type: ${contentType || "<empty>"}` },
        { status: 415 }
      )
    }

    const bytes = Buffer.from(await req.arrayBuffer())
    if (!bytes.length) {
      return NextResponse.json({ ok: false, error: "Empty request body" }, { status: 400 })
    }

    upsertEvent({ id: eventId })

    const saved = await saveIncomingFile({
      eventId,
      kind,
      filename: `raw_upload_${Date.now()}${extFromMime(contentType, kind)}`,
      bytes,
      mimeType: contentType || null,
    })

    if (!saved.ok) {
      return NextResponse.json(
        { ok: false, error: saved.error, syncState: saved.syncState, storage: saved.storage },
        { status: saved.status }
      )
    }

    console.log("[tether/upload] raw ok", {
      eventId,
      kind,
      bytes: bytes.length,
      base: saved.record.base,
      mime: contentType,
    })

    return NextResponse.json({ ok: true, media: saved.record })
  } catch (error) {
    console.error("[tether/upload] error", error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}

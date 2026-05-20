import { NextRequest, NextResponse } from "next/server"
import { getEvent, getEventPhotos, getEventStorageUsage, upsertEvent } from "@/lib/irstudiolive/store"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const eventId = req.nextUrl.searchParams.get("eventId")?.trim() || ""
    const limitRaw = Number(req.nextUrl.searchParams.get("limit") || "80")
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, limitRaw)) : 80

    if (!eventId) {
      return NextResponse.json({ ok: false, error: "Missing eventId" }, { status: 400 })
    }

    const event = getEvent(eventId) ?? upsertEvent({ id: eventId })
    const storage = getEventStorageUsage(eventId)

    const items = getEventPhotos(eventId)
      .slice(0, limit)
      .map((photo) => ({
        base: photo.base,
        previewUrl: photo.previewUrl || photo.fullUrl,
        fullUrl: photo.fullUrl,
        mediaType: photo.mediaType ?? "image",
        posterUrl: photo.posterUrl ?? null,
        byteSize: photo.byteSize ?? null,
        syncState: photo.syncState ?? "synced",
      }))

    return NextResponse.json({
      ok: true,
      eventId: event.id,
      event: {
        ...event,
        sellerPlan: event.sellerPlan ?? "free",
      },
      storage,
      items,
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}

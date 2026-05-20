import { NextRequest, NextResponse } from "next/server"
import { getEvent, upsertEvent } from "@/lib/irstudiolive/store"

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get("eventId")?.trim() || ""
  if (!eventId) return NextResponse.json({ ok: false, error: "Missing eventId" }, { status: 400 })
  const event = getEvent(eventId) ?? upsertEvent({ id: eventId })
  return NextResponse.json({ ok: true, event })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const eventId = String(body?.eventId ?? "").trim()
  if (!eventId) return NextResponse.json({ ok: false, error: "Missing eventId" }, { status: 400 })
  const event = upsertEvent({
    id: eventId,
    isPublic: Boolean(body?.isPublic),
    requireSelfie: Boolean(body?.requireSelfie),
    title: body?.title ?? null,
  })
  return NextResponse.json({ ok: true, event })
}

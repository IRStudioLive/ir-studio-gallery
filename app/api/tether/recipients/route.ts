import { NextRequest, NextResponse } from "next/server"
import { getRecipientsForEvent } from "@/lib/irstudiolive/store"

export async function GET(req: NextRequest) {
  const eventId = req.headers.get("x-event-id")?.trim() || req.nextUrl.searchParams.get("eventId")?.trim() || ""
  if (!eventId) return NextResponse.json({ recipients: [] })
  return NextResponse.json({ recipients: getRecipientsForEvent(eventId) })
}

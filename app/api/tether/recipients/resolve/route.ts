import { NextRequest, NextResponse } from "next/server"
import { resolveRecipientByCode } from "@/lib/irstudiolive/store"

export async function GET(req: NextRequest) {
  const eventId = req.headers.get("x-event-id")?.trim() || req.nextUrl.searchParams.get("eventId")?.trim() || ""
  const code = req.nextUrl.searchParams.get("code")?.trim() || ""
  if (!eventId || !code) return NextResponse.json({ recipient: null })
  return NextResponse.json({ recipient: resolveRecipientByCode(eventId, code) })
}

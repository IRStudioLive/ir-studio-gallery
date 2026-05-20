import { NextRequest, NextResponse } from "next/server"
import { registerRecipient, upsertEvent } from "@/lib/irstudiolive/store"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const eventId = String(body?.eventId ?? "").trim()
    if (!eventId) return NextResponse.json({ ok: false, error: "Missing eventId" }, { status: 400 })

    upsertEvent({
      id: eventId,
      isPublic: true,
      requireSelfie: Boolean(body?.requireSelfie ?? false),
    })

    const recipient = registerRecipient({
      eventId,
      name: body?.name ?? null,
      phone: body?.phone ?? null,
      email: body?.email ?? null,
      selfieUrl: body?.selfieUrl ?? null,
      faceEmbedding: Array.isArray(body?.faceEmbedding) ? body.faceEmbedding : null,
    })

    return NextResponse.json({ ok: true, recipient })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}

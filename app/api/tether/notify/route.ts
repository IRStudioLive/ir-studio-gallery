import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  console.log("[IR Studio Live notify]", body)
  return NextResponse.json({ ok: true, queued: true })
}

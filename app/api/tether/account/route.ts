import { NextRequest, NextResponse } from "next/server"
import { getEventStorageUsage, getEvents, getSellerAccount, updateSellerAccount } from "@/lib/irstudiolive/store"
import { getSubscriptionPlan } from "@/lib/irstudiolive/subscriptions"

export const runtime = "nodejs"

export async function GET() {
  try {
    const account = getSellerAccount()
    const events = getEvents()
    const usage = events.reduce(
      (sum, event) => {
        const storage = getEventStorageUsage(event.id)
        return {
          usedBytes: sum.usedBytes + storage.usedBytes,
          quotaBytes: Math.max(sum.quotaBytes, storage.quotaBytes),
          eventsWithCloud: sum.eventsWithCloud + (storage.storageMode === "local-plus-cloud" ? 1 : 0),
        }
      },
      { usedBytes: 0, quotaBytes: 0, eventsWithCloud: 0 }
    )

    return NextResponse.json({
      ok: true,
      account,
      plan: getSubscriptionPlan(account.plan),
      usage: {
        ...usage,
        remainingBytes: Math.max(0, usage.quotaBytes - usage.usedBytes),
      },
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const account = updateSellerAccount({
      email: typeof body?.email === "string" ? body.email.trim() : undefined,
      displayName: typeof body?.displayName === "string" ? body.displayName.trim() : undefined,
      plan: body?.plan,
    })

    return NextResponse.json({
      ok: true,
      account,
      plan: getSubscriptionPlan(account.plan),
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"
import { calculatePlatformFee, type IRSubscriptionPlanId } from "@/lib/irstudiolive/subscriptions"

type OrderItem = {
  id: string
  base: string
  previewUrl: string
  fullUrl: string
  product: string
  mediaType?: "image" | "video"
  posterUrl?: string | null
}

type OrderPayload = {
  eventId: string
  guestId?: string | null
  customer?: {
    name?: string
    phone?: string
    email?: string
    notes?: string
  }
  items: OrderItem[]
  total: number
  extras?: {
    collection?: string
    prints?: Array<{ sku: string; quantity: number }>
    paymentMethod?: string
    sellerPlan?: IRSubscriptionPlanId
  }
}

type StoredOrder = {
  id: string
  eventId: string
  guestId: string | null
  customer: NonNullable<OrderPayload["customer"]> | Record<string, never>
  items: OrderItem[]
  total: number
  extras?: OrderPayload["extras"]
  commerce?: {
    sellerPlan: IRSubscriptionPlanId | null
    platformFeePercent: number | null
    platformFeeAmount: number | null
    fulfillmentMode: "digital-download" | "self-fulfilled-print-order" | "mixed"
  }
  status: "requested"
  createdAt: string
}

type FulfillmentMode = NonNullable<StoredOrder["commerce"]>["fulfillmentMode"]

const ROOT = path.join(process.cwd(), "data", "irstudiolive")
const FILE = path.join(ROOT, "orders.json")

function ensureFile() {
  fs.mkdirSync(ROOT, { recursive: true })
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({ orders: [] }, null, 2), "utf8")
}

function readDb(): { orders: StoredOrder[] } {
  ensureFile()
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"))
  } catch {
    return { orders: [] }
  }
}

function writeDb(db: { orders: StoredOrder[] }) {
  ensureFile()
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2), "utf8")
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as OrderPayload
    if (!body?.eventId || !Array.isArray(body?.items) || !body.items.length) {
      return NextResponse.json({ ok: false, error: "Missing eventId or items" }, { status: 400 })
    }

    const db = readDb()
    const orderId = "ord_" + Math.random().toString(36).slice(2, 10)
    const sellerPlan = body.extras?.sellerPlan ?? null
    const platformFee = calculatePlatformFee(body.total ?? 0, sellerPlan)
    const hasPrints = Boolean(body.extras?.prints?.length)
    const hasDigitalItems = body.items.some((item) => item.product === "digital")
    const fulfillmentMode: FulfillmentMode =
      hasPrints && hasDigitalItems ? "mixed" : hasPrints ? "self-fulfilled-print-order" : "digital-download"

    db.orders.unshift({
      id: orderId,
      eventId: body.eventId,
      guestId: body.guestId ?? null,
      customer: body.customer ?? {},
      items: body.items,
      total: body.total ?? 0,
      extras: body.extras ?? undefined,
      commerce: {
        sellerPlan,
        platformFeePercent: platformFee?.feePercent ?? null,
        platformFeeAmount: platformFee?.amount ?? null,
        fulfillmentMode,
      },
      status: "requested",
      createdAt: new Date().toISOString(),
    })

    writeDb(db)
    return NextResponse.json({ ok: true, orderId })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}

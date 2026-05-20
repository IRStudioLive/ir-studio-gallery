import type { CartLine, LivePhotoCard } from "./live-types"

export const PRODUCT_PRICES = {
  digital: 15,
  print4x6: 12,
  print5x7: 18,
  print8x10: 28,
} as const

export const PRODUCT_LABELS = {
  digital: "Digital Download",
  print4x6: "4x6 Print",
  print5x7: "5x7 Print",
  print8x10: "8x10 Print",
} as const

export function cartKey(eventId: string, guestId?: string) {
  return guestId ? `irsl_cart::${eventId}::${guestId}` : `irsl_cart::${eventId}`
}

export function readCart(eventId: string, guestId?: string): CartLine[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(cartKey(eventId, guestId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function writeCart(eventId: string, guestId: string | undefined, items: CartLine[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(cartKey(eventId, guestId), JSON.stringify(items))
}

export function toggleCartItem(eventId: string, guestId: string | undefined, photo: LivePhotoCard): CartLine[] {
  const current = readCart(eventId, guestId)
  const exists = current.some((x) => x.id === photo.id)
  const next: CartLine[] = exists
    ? current.filter((x) => x.id !== photo.id)
    : [
        ...current,
        {
          id: photo.id,
          base: photo.base,
          previewUrl: photo.previewUrl,
          fullUrl: photo.fullUrl,
          product: "digital",
          mediaType: photo.mediaType,
          posterUrl: photo.posterUrl ?? null,
        } as CartLine,
      ]
  writeCart(eventId, guestId, next)
  return next
}

export function setCartProduct(eventId: string, guestId: string | undefined, id: string, product: CartLine["product"]): CartLine[] {
  const next: CartLine[] = readCart(eventId, guestId).map((x): CartLine => {
    if (x.id !== id) return x
    if (x.mediaType === "video" && product !== "digital") {
      return { ...x, product: "digital" }
    }
    return { ...x, product }
  })
  writeCart(eventId, guestId, next)
  return next
}

export function removeCartItem(eventId: string, guestId: string | undefined, id: string): CartLine[] {
  const next = readCart(eventId, guestId).filter((x) => x.id !== id)
  writeCart(eventId, guestId, next)
  return next
}

export function cartTotal(items: CartLine[]) {
  return items.reduce((sum, item) => sum + PRODUCT_PRICES[item.product], 0)
}

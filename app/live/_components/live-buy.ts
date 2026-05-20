"use client"

import type { LivePhotoCard } from "./live-types"

export type LiveCollectionKey = "all" | "highlights" | "favorites" | "videos"
export type PrintSku = "print4x6" | "print5x7" | "print8x10" | "print11x14" | "print16x20" | "photoSet3"

export type BuyFlowState = {
  collection: LiveCollectionKey
  selectedIds: string[]
  printSelections: Partial<Record<PrintSku, number>>
}

export const COLLECTION_OPTIONS: Array<{
  key: LiveCollectionKey
  title: string
  description: string
  price: number
  badge?: string
}> = [
  { key: "all", title: "All Photos", description: "Get every photo from the event.", price: 49.99, badge: "Best Value" },
  { key: "highlights", title: "Highlights", description: "Hand-picked best moments from the event.", price: 24.99 },
  { key: "favorites", title: "Favorites", description: "Your favorite moments, curated just for you.", price: 19.99 },
  { key: "videos", title: "Videos Only", description: "All video moments from the event.", price: 29.99 },
]

export const DIGITAL_ITEM_PRICE = 3.99

export const PRINT_OPTIONS: Array<{
  sku: PrintSku
  title: string
  subtitle?: string
  price: number
}> = [
  { sku: "print4x6", title: "4×6 Print", price: 1.49 },
  { sku: "print5x7", title: "5×7 Print", price: 2.49 },
  { sku: "print8x10", title: "8×10 Print", price: 4.99 },
  { sku: "print11x14", title: "11×14 Print", price: 9.99 },
  { sku: "print16x20", title: "16×20 Print", price: 19.99 },
  { sku: "photoSet3", title: "Photo Set (3)", subtitle: "(4×6 each)", price: 12.99 },
]

export function looksLikeVideo(photo: Pick<LivePhotoCard, "mediaType" | "fullUrl" | "previewUrl">) {
  if (photo.mediaType === "video") return true
  const value = `${photo.fullUrl} ${photo.previewUrl}`.toLowerCase()
  return /\.(mp4|mov|m4v|webm)(\?|$)/i.test(value)
}

function favoritesKey(eventId: string, guestId?: string) {
  return guestId ? `irsl_favorites::${eventId}::${guestId}` : `irsl_favorites::${eventId}`
}

function buyFlowKey(eventId: string, guestId?: string) {
  return guestId ? `irsl_buy_flow::${eventId}::${guestId}` : `irsl_buy_flow::${eventId}`
}

export function readFavorites(eventId: string, guestId?: string) {
  if (typeof window === "undefined") return [] as string[]
  try {
    const raw = localStorage.getItem(favoritesKey(eventId, guestId))
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function toggleFavorite(eventId: string, guestId: string | undefined, photoId: string) {
  const current = new Set(readFavorites(eventId, guestId))
  if (current.has(photoId)) current.delete(photoId)
  else current.add(photoId)
  const next = Array.from(current)
  if (typeof window !== "undefined") {
    localStorage.setItem(favoritesKey(eventId, guestId), JSON.stringify(next))
  }
  return next
}

export function readBuyFlowState(eventId: string, guestId?: string): BuyFlowState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(buyFlowKey(eventId, guestId))
    return raw ? (JSON.parse(raw) as BuyFlowState) : null
  } catch {
    return null
  }
}

export function writeBuyFlowState(eventId: string, guestId: string | undefined, state: BuyFlowState) {
  if (typeof window === "undefined") return
  localStorage.setItem(buyFlowKey(eventId, guestId), JSON.stringify(state))
}

export function clearBuyFlowState(eventId: string, guestId?: string) {
  if (typeof window === "undefined") return
  localStorage.removeItem(buyFlowKey(eventId, guestId))
}

export function collectionScopedPhotos(
  collection: LiveCollectionKey,
  photos: LivePhotoCard[],
  favoriteIds: Set<string>,
) {
  const images = photos.filter((photo) => !looksLikeVideo(photo))
  const videos = photos.filter((photo) => looksLikeVideo(photo))

  switch (collection) {
    case "videos":
      return videos
    case "favorites": {
      const favorites = photos.filter((photo) => favoriteIds.has(photo.id))
      return favorites.length ? favorites : photos.slice(0, 12)
    }
    case "highlights":
      return images.slice(0, 12)
    default:
      return images.length ? images : photos
  }
}

export function digitalSubtotal(selected: LivePhotoCard[]) {
  return selected.reduce((sum, photo) => {
    if (looksLikeVideo(photo)) return sum + DIGITAL_ITEM_PRICE
    return sum + DIGITAL_ITEM_PRICE
  }, 0)
}

export function printSubtotal(printSelections: Partial<Record<PrintSku, number>>) {
  return PRINT_OPTIONS.reduce((sum, option) => {
    const quantity = Math.max(0, Number(printSelections[option.sku] ?? 0))
    return sum + quantity * option.price
  }, 0)
}

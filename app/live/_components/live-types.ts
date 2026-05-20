export type LivePhotoCard = {
  id: string
  base: string
  previewUrl: string
  fullUrl: string
  mediaType?: "image" | "video"
  posterUrl?: string | null
  createdAt?: string
  durationSec?: number | null
}

export type CartLine = {
  id: string
  base: string
  previewUrl: string
  fullUrl: string
  product: "digital" | "print4x6" | "print5x7" | "print8x10"
  mediaType?: "image" | "video"
  posterUrl?: string | null
  createdAt?: string
  durationSec?: number | null
}

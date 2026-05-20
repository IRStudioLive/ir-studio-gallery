import type { IRSubscriptionPlanId, IRSyncState } from "./subscriptions"

export type LiveRecipient = {
  id: string
  eventId: string
  code: string
  name?: string | null
  phone?: string | null
  email?: string | null
  selfieUrl?: string | null
  faceEmbedding?: number[] | null
  createdAt: string
}

export type LivePhoto = {
  id: string
  eventId: string
  base: string
  previewUrl: string
  fullUrl: string
  mediaType?: "image" | "video"
  posterUrl?: string | null
  mimeType?: string | null
  durationSec?: number | null
  byteSize?: number | null
  syncState?: IRSyncState
  cloudStored?: boolean
  matchedRecipientIds?: string[]
  createdAt: string
}

export type LiveEvent = {
  id: string
  title?: string | null
  isPublic: boolean
  requireSelfie: boolean
  sellerPlan?: IRSubscriptionPlanId | null
  createdAt: string
}

export type LiveSellerAccount = {
  id: string
  email: string
  displayName: string
  plan: IRSubscriptionPlanId
  createdAt: string
  updatedAt: string
}

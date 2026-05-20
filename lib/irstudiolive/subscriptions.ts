export type IRSubscriptionPlanId = "free" | "starter" | "pro" | "studio"

export type IRStorageMode = "local-only" | "local-plus-cloud"

export type IRCommerceMode = "disabled" | "enabled"

export type IRSyncState =
  | "local_only"
  | "pending_upload"
  | "synced"
  | "offline_fallback"
  | "quota_blocked"

export type IRSubscriptionPlan = {
  id: IRSubscriptionPlanId
  name: string
  storageGb: number
  monthlyPriceUsd: number
  yearlyPriceUsd: number
  platformFeePercent: number
  storageMode: IRStorageMode
  commerceMode: IRCommerceMode
  maxActiveEvents: number
  guestWebLiveWall: boolean
  guestSales: boolean
  cloudSync: boolean
  description: string
}

export const IR_SUBSCRIPTION_PLANS: Record<IRSubscriptionPlanId, IRSubscriptionPlan> = {
  free: {
    id: "free",
    name: "Free",
    storageGb: 0,
    monthlyPriceUsd: 0,
    yearlyPriceUsd: 0,
    platformFeePercent: 0,
    storageMode: "local-only",
    commerceMode: "disabled",
    maxActiveEvents: 1,
    guestWebLiveWall: false,
    guestSales: false,
    cloudSync: false,
    description: "Local albums only. Best for testing and local-only events.",
  },
  starter: {
    id: "starter",
    name: "Starter",
    storageGb: 50,
    monthlyPriceUsd: 4.99,
    yearlyPriceUsd: 49,
    platformFeePercent: 5,
    storageMode: "local-plus-cloud",
    commerceMode: "enabled",
    maxActiveEvents: 5,
    guestWebLiveWall: true,
    guestSales: true,
    cloudSync: true,
    description: "Affordable cloud sync and guest sales for growing photographers.",
  },
  pro: {
    id: "pro",
    name: "Pro",
    storageGb: 200,
    monthlyPriceUsd: 9.99,
    yearlyPriceUsd: 99,
    platformFeePercent: 3,
    storageMode: "local-plus-cloud",
    commerceMode: "enabled",
    maxActiveEvents: 20,
    guestWebLiveWall: true,
    guestSales: true,
    cloudSync: true,
    description: "More storage, lower selling fee, better for active event work.",
  },
  studio: {
    id: "studio",
    name: "Studio",
    storageGb: 1024,
    monthlyPriceUsd: 24.99,
    yearlyPriceUsd: 249,
    platformFeePercent: 0,
    storageMode: "local-plus-cloud",
    commerceMode: "enabled",
    maxActiveEvents: 999,
    guestWebLiveWall: true,
    guestSales: true,
    cloudSync: true,
    description: "Built for high-volume studios with zero platform commission.",
  },
}

export type IRSyncPolicy = {
  capturePriority: "local-first"
  cloudBehavior: "background-sync"
  offlineFallback: "local-album-and-cache"
  guestWebDependency: "cloud-required"
  quotaBehavior: "local-capture-continues-cloud-blocked"
}

export const IR_DEFAULT_SYNC_POLICY: IRSyncPolicy = {
  capturePriority: "local-first",
  cloudBehavior: "background-sync",
  offlineFallback: "local-album-and-cache",
  guestWebDependency: "cloud-required",
  quotaBehavior: "local-capture-continues-cloud-blocked",
}

export type IRStripeProductConfig = {
  appStoreProductId: string | null
  playStoreProductId: string | null
}

export const IR_STORE_PRODUCT_IDS: Record<Exclude<IRSubscriptionPlanId, "free">, IRStripeProductConfig & { yearlyAppStoreProductId: string; yearlyPlayStoreProductId: string }> = {
  starter: {
    appStoreProductId: "ir_starter_50_monthly",
    playStoreProductId: "ir_starter_50_monthly",
    yearlyAppStoreProductId: "ir_starter_50_yearly",
    yearlyPlayStoreProductId: "ir_starter_50_yearly",
  },
  pro: {
    appStoreProductId: "ir_pro_200_monthly",
    playStoreProductId: "ir_pro_200_monthly",
    yearlyAppStoreProductId: "ir_pro_200_yearly",
    yearlyPlayStoreProductId: "ir_pro_200_yearly",
  },
  studio: {
    appStoreProductId: "ir_studio_1000_monthly",
    playStoreProductId: "ir_studio_1000_monthly",
    yearlyAppStoreProductId: "ir_studio_1000_yearly",
    yearlyPlayStoreProductId: "ir_studio_1000_yearly",
  },
}

export function getSubscriptionPlan(planId: IRSubscriptionPlanId) {
  return IR_SUBSCRIPTION_PLANS[planId]
}

export function resolvePlatformFeePercent(planId: IRSubscriptionPlanId | null | undefined) {
  if (!planId) return null
  return IR_SUBSCRIPTION_PLANS[planId]?.platformFeePercent ?? null
}

export function calculatePlatformFee(total: number, planId: IRSubscriptionPlanId | null | undefined) {
  const feePercent = resolvePlatformFeePercent(planId)
  if (feePercent == null) return null
  const amount = Math.round(total * (feePercent / 100) * 100) / 100
  return {
    feePercent,
    amount,
  }
}

export function planQuotaBytes(planId: IRSubscriptionPlanId | null | undefined) {
  if (!planId) return 0
  const plan = IR_SUBSCRIPTION_PLANS[planId]
  return plan.storageGb * 1024 * 1024 * 1024
}

export function describeSyncState(state: IRSyncState) {
  switch (state) {
    case "local_only":
      return "Saved on device only"
    case "pending_upload":
      return "Saved locally and waiting to sync"
    case "synced":
      return "Saved locally and synced to cloud"
    case "offline_fallback":
      return "Using local album because cloud is offline"
    case "quota_blocked":
      return "Saved locally, but cloud storage is full"
  }
}

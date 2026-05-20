import fs from "fs"
import path from "path"
import { LiveEvent, LivePhoto, LiveRecipient, LiveSellerAccount } from "./types"
import { getSubscriptionPlan, type IRSubscriptionPlanId } from "./subscriptions"

const ROOT = path.join(process.cwd(), "data", "irstudiolive")
const EVENTS_FILE = path.join(ROOT, "events.json")
const RECIPIENTS_FILE = path.join(ROOT, "recipients.json")
const PHOTOS_FILE = path.join(ROOT, "photos.json")
const ACCOUNT_FILE = path.join(ROOT, "account.json")

function ensureFile(file: string, fallback: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(fallback, null, 2))
}

function readJSON<T>(file: string, fallback: T): T {
  ensureFile(file, fallback)
  return JSON.parse(fs.readFileSync(file, "utf8")) as T
}

function writeJSON<T>(file: string, data: T) {
  ensureFile(file, data)
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

export function getEvents(): LiveEvent[] {
  return readJSON<LiveEvent[]>(EVENTS_FILE, [])
}

export function saveEvents(events: LiveEvent[]) {
  writeJSON(EVENTS_FILE, events)
}

export function getRecipients(): LiveRecipient[] {
  return readJSON<LiveRecipient[]>(RECIPIENTS_FILE, [])
}

export function saveRecipients(recipients: LiveRecipient[]) {
  writeJSON(RECIPIENTS_FILE, recipients)
}

export function getPhotos(): LivePhoto[] {
  return readJSON<LivePhoto[]>(PHOTOS_FILE, [])
}

export function savePhotos(photos: LivePhoto[]) {
  writeJSON(PHOTOS_FILE, photos)
}

export function getSellerAccount(): LiveSellerAccount {
  return readJSON<LiveSellerAccount>(ACCOUNT_FILE, {
    id: "acct_default",
    email: "owner@irstudiolive.com",
    displayName: "IR Studio Live",
    plan: "studio",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

export function saveSellerAccount(account: LiveSellerAccount) {
  writeJSON(ACCOUNT_FILE, account)
}

export function updateSellerAccount(input: Partial<LiveSellerAccount>) {
  const current = getSellerAccount()
  const next: LiveSellerAccount = {
    ...current,
    ...input,
    id: input.id ?? current.id,
    email: input.email ?? current.email,
    displayName: input.displayName ?? current.displayName,
    plan: input.plan ?? current.plan,
    updatedAt: new Date().toISOString(),
  }
  saveSellerAccount(next)
  return next
}

export function upsertEvent(input: Partial<LiveEvent> & { id: string }): LiveEvent {
  const events = getEvents()
  const idx = events.findIndex(e => e.id === input.id)
  const account = getSellerAccount()
  const next: LiveEvent = {
    id: input.id,
    title: input.title ?? events[idx]?.title ?? input.id,
    isPublic: input.isPublic ?? events[idx]?.isPublic ?? true,
    requireSelfie: input.requireSelfie ?? events[idx]?.requireSelfie ?? false,
    sellerPlan: input.sellerPlan ?? events[idx]?.sellerPlan ?? account.plan ?? "free",
    createdAt: events[idx]?.createdAt ?? new Date().toISOString(),
  }
  if (idx >= 0) events[idx] = next
  else events.unshift(next)
  saveEvents(events)
  return next
}

export function getEvent(eventId: string): LiveEvent | undefined {
  return getEvents().find(e => e.id === eventId)
}

export function registerRecipient(input: {
  eventId: string
  phone?: string | null
  email?: string | null
  name?: string | null
  selfieUrl?: string | null
  faceEmbedding?: number[] | null
}) {
  const recipients = getRecipients()
  const id = "gst_" + Math.random().toString(36).slice(2, 10)
  const code = Math.random().toString(36).slice(2, 8).toUpperCase()
  const recipient: LiveRecipient = {
    id,
    eventId: input.eventId,
    code,
    name: input.name ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    selfieUrl: input.selfieUrl ?? null,
    faceEmbedding: input.faceEmbedding ?? null,
    createdAt: new Date().toISOString(),
  }
  recipients.unshift(recipient)
  saveRecipients(recipients)
  upsertEvent({ id: input.eventId })
  return recipient
}

export function getRecipientsForEvent(eventId: string) {
  return getRecipients().filter(r => r.eventId === eventId)
}

export function resolveRecipientByCode(eventId: string, code: string) {
  return getRecipients().find(r => r.eventId === eventId && r.code === code) ?? null
}

export function getRecipient(eventId: string, guestId: string) {
  return getRecipients().find(r => r.eventId === eventId && r.id === guestId) ?? null
}

export function getEventPhotos(eventId: string) {
  return getPhotos()
    .filter(p => p.eventId === eventId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getEventStorageUsage(eventId: string) {
  const event = getEvent(eventId)
  const photos = getEventPhotos(eventId)
  const usedBytes = photos.reduce((sum, photo) => sum + (photo.byteSize ?? 0), 0)
  const sellerPlan = (event?.sellerPlan ?? "free") as IRSubscriptionPlanId
  const plan = getSubscriptionPlan(sellerPlan)
  const quotaBytes = plan.storageGb > 0 ? plan.storageGb * 1024 * 1024 * 1024 : 0
  const remainingBytes = Math.max(0, quotaBytes - usedBytes)

  return {
    sellerPlan,
    storageMode: plan.storageMode,
    usedBytes,
    quotaBytes,
    remainingBytes,
    overQuota: quotaBytes > 0 ? usedBytes >= quotaBytes : false,
  }
}

export function getGuestPhotos(eventId: string, guestId: string) {
  return getPhotos()
    .filter(p => p.eventId === eventId && (p.matchedRecipientIds ?? []).includes(guestId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function seedDemoPhoto() {
  return
}

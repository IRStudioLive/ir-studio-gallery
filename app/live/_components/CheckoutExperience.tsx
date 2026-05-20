"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import type { LivePhotoCard } from "./live-types"
import {
  COLLECTION_OPTIONS,
  DIGITAL_ITEM_PRICE,
  PRINT_OPTIONS,
  clearBuyFlowState,
  collectionScopedPhotos,
  digitalSubtotal,
  looksLikeVideo,
  printSubtotal,
  readBuyFlowState,
  readFavorites,
  type LiveCollectionKey,
  type PrintSku,
  writeBuyFlowState,
} from "./live-buy"
import { LiveEventChrome, formatPhotoTimeLabel, liveThemeClasses, type LiveWebTheme } from "./live-web-theme"
import { calculatePlatformFee, getSubscriptionPlan, type IRSubscriptionPlanId } from "@/lib/irstudiolive/subscriptions"

type PaymentMethod = "card" | "paypal" | "applepay"

export default function CheckoutExperience({
  theme,
  eventId,
  guestId,
  sellerPlan,
  eventTitle,
  eventDateLabel,
  backHref,
  photos,
}: {
  theme: LiveWebTheme
  eventId: string
  guestId?: string
  sellerPlan: IRSubscriptionPlanId
  eventTitle: string
  eventDateLabel: string
  backHref: string
  photos: LivePhotoCard[]
}) {
  const ui = liveThemeClasses(theme)
  const [step, setStep] = useState(1)
  const [collection, setCollection] = useState<LiveCollectionKey>("all")
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [printSelections, setPrintSelections] = useState<Partial<Record<PrintSku, number>>>({})
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    country: "United States",
    address: "",
    city: "",
    state: "",
    zip: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
    cardName: "",
    updates: true,
  })
  const [status, setStatus] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const favorites = new Set(readFavorites(eventId, guestId))
    setFavoriteIds(favorites)
    const stored = readBuyFlowState(eventId, guestId)
    if (stored) {
      setCollection(stored.collection)
      setSelectedIds(stored.selectedIds)
      setPrintSelections(stored.printSelections)
    }
  }, [eventId, guestId])

  const scopedPhotos = useMemo(() => collectionScopedPhotos(collection, photos, favoriteIds), [collection, favoriteIds, photos])
  const selectedPhotos = useMemo(() => scopedPhotos.filter((photo) => selectedIds.includes(photo.id)), [scopedPhotos, selectedIds])
  const selectedVideosOnly = selectedPhotos.every((photo) => looksLikeVideo(photo))
  const digitalTotal = useMemo(() => digitalSubtotal(selectedPhotos), [selectedPhotos])
  const printsTotal = useMemo(() => printSubtotal(printSelections), [printSelections])
  const subtotal = digitalTotal + printsTotal
  const tax = subtotal * 0.08
  const grandTotal = subtotal + tax
  const plan = getSubscriptionPlan(sellerPlan)
  const platformFee = calculatePlatformFee(Number(grandTotal.toFixed(2)), sellerPlan)

  useEffect(() => {
    writeBuyFlowState(eventId, guestId, { collection, selectedIds, printSelections })
  }, [collection, eventId, guestId, printSelections, selectedIds])

  function goToCollection(next: LiveCollectionKey) {
    setCollection(next)
    const nextScoped = collectionScopedPhotos(next, photos, favoriteIds)
    setSelectedIds(next === "videos" ? nextScoped.map((photo) => photo.id) : [])
    setPrintSelections({})
    setStep(2)
  }

  function toggleSelection(photoId: string) {
    setSelectedIds((current) => current.includes(photoId) ? current.filter((id) => id !== photoId) : [...current, photoId])
  }

  function setAllSelections() {
    setSelectedIds(scopedPhotos.map((photo) => photo.id))
  }

  function setPrintQuantity(sku: PrintSku, next: number) {
    setPrintSelections((current) => {
      const copy = { ...current }
      if (next <= 0) delete copy[sku]
      else copy[sku] = next
      return copy
    })
  }

  async function placeOrder() {
    if (!selectedPhotos.length || !customer.name.trim() || !customer.email.trim()) {
      setStatus("Add your name, email, and select at least one photo or video.")
      return
    }

    setSubmitting(true)
    setStatus("Placing order…")

    const res = await fetch("/api/tether/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        guestId: guestId || null,
        customer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          notes: JSON.stringify({
            collection,
            prints: printSelections,
            paymentMethod,
            address: {
              country: customer.country,
              address: customer.address,
              city: customer.city,
              state: customer.state,
              zip: customer.zip,
            },
          }),
        },
        items: selectedPhotos.map((photo) => ({
          id: photo.id,
          base: photo.base,
          previewUrl: photo.previewUrl,
          fullUrl: photo.fullUrl,
          product: "digital",
          mediaType: photo.mediaType,
          posterUrl: photo.posterUrl ?? null,
        })),
        total: Number(grandTotal.toFixed(2)),
        extras: {
          collection,
          prints: Object.entries(printSelections)
            .filter((entry) => Number(entry[1]) > 0)
            .map(([sku, quantity]) => ({ sku, quantity })),
          paymentMethod,
          sellerPlan,
        },
      }),
    })

    const json = await res.json()
    setSubmitting(false)

    if (!res.ok || !json?.ok) {
      setStatus("Order request failed. Please try again.")
      return
    }

    clearBuyFlowState(eventId, guestId)
    setStatus(`Order placed. Order ID: ${json.orderId}`)
  }

  const progressStep = step === 4 ? 4 : step

  return (
    <LiveEventChrome theme={theme} eventTitle={eventTitle} eventDate={eventDateLabel}>
      {step < 4 ? (
        <div className="fixed inset-0 overflow-y-auto bg-black/55 px-4 py-8 backdrop-blur-sm">
          <div className={`mx-auto w-full max-w-[1180px] rounded-[32px] border px-8 py-8 lg:px-10 lg:py-10 ${ui.panel}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-5">
                <div className={`flex h-20 w-20 items-center justify-center rounded-full ${ui.accentSoft}`}>
                  <span className={`text-[44px] ${ui.accent}`}>🛒</span>
                </div>
                <div>
                  <div className={`text-[28px] font-black ${ui.textPrimary}`}>Buy Photos</div>
                  <div className={`mt-1 text-lg ${ui.textSecondary}`}>
                    {step === 1 ? "Choose a collection and checkout securely." : step === 2 ? "Select your photos." : "Review your selection and choose your prints."}
                  </div>
                </div>
              </div>

              <Link href={backHref} className={`flex h-12 w-12 items-center justify-center rounded-full border text-2xl no-underline ${ui.buttonSecondary}`}>
                ×
              </Link>
            </div>

            <StepProgress theme={theme} steps={step === 1 ? ["Choose Collection", "Review", "Checkout"] : ["Choose Option", "Select Photos", "Review", "Checkout"]} currentStep={progressStep} />

            {step === 1 ? (
              <StepChooseCollection theme={theme} collection={collection} onChoose={goToCollection} />
            ) : null}

            {step === 2 ? (
              <StepSelectMedia
                theme={theme}
                collection={collection}
                photos={scopedPhotos}
                selectedIds={selectedIds}
                onSelectAll={setAllSelections}
                onToggle={toggleSelection}
                onContinue={() => setStep(3)}
              />
            ) : null}

            {step === 3 ? (
              <StepReview
                theme={theme}
                selectedPhotos={selectedPhotos}
                printSelections={printSelections}
                selectedVideosOnly={selectedVideosOnly}
                printsTotal={printsTotal}
                digitalTotal={digitalTotal}
                onSetPrintQuantity={setPrintQuantity}
                onRemovePhoto={(photoId) => setSelectedIds((current) => current.filter((id) => id !== photoId))}
                onBack={() => setStep(2)}
                onContinue={() => setStep(4)}
              />
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <Link href={backHref} className={`text-lg font-black no-underline ${ui.textPrimary}`}>← Buy Photos</Link>
          </div>

          <StepProgress theme={theme} steps={["Choose Option", "Select Photos", "Review", "Checkout"]} currentStep={4} />

          <div className="grid gap-8 xl:grid-cols-[1.65fr_0.95fr]">
            <div className={`rounded-[30px] border p-6 ${ui.panel}`}>
              <div className={`text-[18px] font-black ${ui.textPrimary}`}>Customer Information</div>
              <div className={`mt-1 text-sm ${ui.textSecondary}`}>Enter your details to continue.</div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <FormField label="Full Name" value={customer.name} onChange={(value) => setCustomer((current) => ({ ...current, name: value }))} placeholder="Enter your full name" theme={theme} />
                <FormField label="Email Address" value={customer.email} onChange={(value) => setCustomer((current) => ({ ...current, email: value }))} placeholder="Enter your email address" theme={theme} />
                <FormField label="Phone Number (Optional)" value={customer.phone} onChange={(value) => setCustomer((current) => ({ ...current, phone: value }))} placeholder="Enter your phone number" theme={theme} />
                <FormField label="Country" value={customer.country} onChange={(value) => setCustomer((current) => ({ ...current, country: value }))} placeholder="Country" theme={theme} />
                <div className="md:col-span-2">
                  <FormField label="Billing Address" value={customer.address} onChange={(value) => setCustomer((current) => ({ ...current, address: value }))} placeholder="Street address" theme={theme} />
                </div>
                <FormField label="City" value={customer.city} onChange={(value) => setCustomer((current) => ({ ...current, city: value }))} placeholder="City" theme={theme} />
                <FormField label="State" value={customer.state} onChange={(value) => setCustomer((current) => ({ ...current, state: value }))} placeholder="Select state" theme={theme} />
                <FormField label="ZIP Code" value={customer.zip} onChange={(value) => setCustomer((current) => ({ ...current, zip: value }))} placeholder="ZIP code" theme={theme} />
              </div>

              <label className="mt-5 flex items-center gap-3 text-sm font-medium">
                <input type="checkbox" checked={customer.updates} onChange={(event) => setCustomer((current) => ({ ...current, updates: event.target.checked }))} />
                Email me updates about my order
              </label>

              <div className={`mt-6 rounded-[28px] border p-5 ${ui.secondaryPanel}`}>
                <div className="flex items-center gap-3">
                  <div className={`text-[18px] font-black ${ui.textPrimary}`}>Payment Method</div>
                  <div className={`text-sm ${ui.textMuted}`}>All transactions are secure and encrypted.</div>
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    { key: "card", label: "Credit / Debit Card", brand: "VISA • Mastercard • AMEX" },
                    { key: "paypal", label: "PayPal", brand: "PayPal" },
                    { key: "applepay", label: "Apple Pay", brand: "Apple Pay" },
                  ].map((method) => (
                    <button
                      key={method.key}
                      onClick={() => setPaymentMethod(method.key as PaymentMethod)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left ${paymentMethod === method.key ? `${ui.accentBorder} ${ui.accentSoft}` : ui.buttonSecondary}`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`h-5 w-5 rounded-full border ${paymentMethod === method.key ? "border-[#6f37ff] bg-[#6f37ff]" : theme === "dark" ? "border-white/20" : "border-black/14"}`} />
                        <span className={`text-base font-semibold ${ui.textPrimary}`}>{method.label}</span>
                      </span>
                      <span className={`text-sm font-semibold ${ui.textMuted}`}>{method.brand}</span>
                    </button>
                  ))}
                </div>

                {paymentMethod === "card" ? (
                  <div className="mt-5 grid gap-4">
                    <FormField label="Card Number" value={customer.cardNumber} onChange={(value) => setCustomer((current) => ({ ...current, cardNumber: value }))} placeholder="•••• •••• •••• ••••" theme={theme} />
                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField label="Expiry Date" value={customer.expiry} onChange={(value) => setCustomer((current) => ({ ...current, expiry: value }))} placeholder="MM / YY" theme={theme} />
                      <FormField label="CVC" value={customer.cvc} onChange={(value) => setCustomer((current) => ({ ...current, cvc: value }))} placeholder="CVC" theme={theme} />
                      <FormField label="Name on Card" value={customer.cardName} onChange={(value) => setCustomer((current) => ({ ...current, cardName: value }))} placeholder="Name on card" theme={theme} />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className={`rounded-[30px] border p-6 ${ui.panel}`}>
              <div className="flex items-center justify-between">
                <div className={`text-[18px] font-black ${ui.textPrimary}`}>Order Summary</div>
                <button onClick={() => setStep(3)} className={`text-sm font-bold ${ui.accent}`}>Edit</button>
              </div>

              <SummaryRow theme={theme} title={`${selectedPhotos.length} ${selectedPhotos.length === 1 ? "Photo" : "Photos"}`} subtitle="Digital Download" total={digitalTotal} />
              {Object.entries(printSelections).filter((entry) => Number(entry[1]) > 0).map(([sku, quantity]) => {
                const option = PRINT_OPTIONS.find((item) => item.sku === sku)!
                return <SummaryRow key={sku} theme={theme} title="Prints" subtitle={`${quantity} × ${option.title}`} total={quantity * option.price} />
              })}

              <div className={`mt-6 border-t pt-5 ${theme === "dark" ? "border-white/10" : "border-black/8"}`}>
                <PriceLine theme={theme} label="Subtotal" value={subtotal} />
                <PriceLine theme={theme} label="Tax" value={tax} />
                {platformFee ? <PriceLine theme={theme} label={`Platform Fee (${platformFee.feePercent}%)`} value={platformFee.amount} subtle /> : null}
                <div className="mt-3 flex items-end justify-between">
                  <div className={`text-[16px] font-black ${ui.textPrimary}`}>Total</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${ui.textMuted}`}>USD</span>
                    <span className={`text-[40px] font-black tracking-[-0.04em] ${ui.textPrimary}`}>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className={`mt-6 border-t pt-5 ${theme === "dark" ? "border-white/10" : "border-black/8"}`}>
                <div className="flex items-center justify-between">
                  <div className={`text-[18px] font-black ${ui.textPrimary}`}>Your Photos ({selectedPhotos.length})</div>
                  <button onClick={() => setStep(2)} className={`text-sm font-bold ${ui.accent}`}>View All</button>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {selectedPhotos.slice(0, 3).map((photo) => (
                    <div key={photo.id}>
                      <div className={`relative aspect-[1.05/1] overflow-hidden rounded-2xl border ${theme === "dark" ? "border-white/10" : "border-black/8"}`}>
                        <Image src={photo.previewUrl} alt={photo.base} fill sizes="180px" className="object-cover" />
                      </div>
                      <div className={`mt-2 truncate text-xs font-semibold ${ui.textSecondary}`}>{photo.base}</div>
                    </div>
                  ))}
                </div>
              </div>

              {Object.entries(printSelections).filter((entry) => Number(entry[1]) > 0).length ? (
                <div className={`mt-6 border-t pt-5 ${theme === "dark" ? "border-white/10" : "border-black/8"}`}>
                  <div className="flex items-center justify-between">
                    <div className={`text-[18px] font-black ${ui.textPrimary}`}>Prints</div>
                    <button onClick={() => setStep(3)} className={`text-sm font-bold ${ui.accent}`}>Edit</button>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {Object.entries(printSelections).filter((entry) => Number(entry[1]) > 0).map(([sku, quantity]) => {
                      const option = PRINT_OPTIONS.find((item) => item.sku === sku)!
                      return (
                        <div key={sku} className={`rounded-2xl border p-3 ${ui.secondaryPanel}`}>
                          <div className={`text-sm font-black ${ui.textPrimary}`}>{option.title}</div>
                          <div className={`mt-1 text-xs ${ui.textSecondary}`}>{quantity} selected</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              <div className={`mt-6 rounded-2xl border px-4 py-4 ${ui.secondaryPanel}`}>
                <div className={`text-sm font-black ${ui.textPrimary}`}>Satisfaction Guaranteed.</div>
                <div className={`mt-1 text-sm ${ui.textSecondary}`}>Love your photos or we’ll make it right.</div>
              </div>

              <div className={`mt-4 rounded-2xl border px-4 py-4 ${ui.secondaryPanel}`}>
                <div className={`text-sm font-black ${ui.textPrimary}`}>{plan.name} Plan</div>
                <div className={`mt-1 text-sm ${ui.textSecondary}`}>
                  {plan.platformFeePercent === 0
                    ? "No IR Studio Live platform fee is applied on this sale."
                    : `${plan.platformFeePercent}% IR Studio Live platform fee applies to guest web sales. Payment processor fees are separate.`}
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-[28px] border px-6 py-6 ${ui.panel}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <button onClick={() => setStep(3)} className={`text-base font-bold ${ui.accent}`}>← Back to Review</button>
              <button onClick={placeOrder} disabled={submitting} className={`inline-flex min-h-[58px] items-center justify-center gap-3 rounded-2xl px-8 text-lg font-black ${ui.buttonPrimary} disabled:opacity-60`}>
                {submitting ? "Placing Order…" : "Place Order"}
              </button>
            </div>
            <div className={`mt-4 text-center text-xs ${ui.textMuted}`}>
              By placing your order, you agree to our Terms of Service and Privacy Policy.
            </div>
            {status ? <div className={`mt-4 text-center text-sm font-semibold ${ui.textSecondary}`}>{status}</div> : null}
          </div>
        </div>
      )}
    </LiveEventChrome>
  )
}

function StepProgress({
  theme,
  steps,
  currentStep,
}: {
  theme: LiveWebTheme
  steps: string[]
  currentStep: number
}) {
  const ui = liveThemeClasses(theme)
  return (
    <div className="mx-auto mt-8 flex max-w-4xl items-start justify-center gap-3 px-2">
      {steps.map((step, index) => {
        const number = index + 1
        const complete = number < currentStep
        const active = number === currentStep
        return (
          <div key={step} className="flex min-w-0 flex-1 items-start">
            <div className="flex w-full flex-col items-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-black ${complete || active ? "border-transparent bg-[#6f37ff] text-white" : theme === "dark" ? "border-white/12 bg-white/6 text-white/70" : "border-black/10 bg-[#f3f4f8] text-[#485166]"}`}>
                {complete ? "✓" : number}
              </div>
              <div className={`mt-3 text-center text-[13px] font-semibold ${active || complete ? ui.accent : ui.textSecondary}`}>{step}</div>
            </div>
            {index < steps.length - 1 ? (
              <div className={`mt-4 h-px flex-1 ${complete ? "bg-[#6f37ff]" : theme === "dark" ? "bg-white/10" : "bg-black/10"}`} />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function StepChooseCollection({
  theme,
  collection,
  onChoose,
}: {
  theme: LiveWebTheme
  collection: LiveCollectionKey
  onChoose: (next: LiveCollectionKey) => void
}) {
  const ui = liveThemeClasses(theme)
  return (
    <div className="mt-10">
      <div className={`text-[18px] font-black ${ui.textPrimary}`}>Select a Collection</div>
      <div className={`mt-1 text-lg ${ui.textSecondary}`}>All photos are high resolution with print release.</div>

      <div className="mt-8 grid gap-4 lg:grid-cols-4">
        {COLLECTION_OPTIONS.map((option) => {
          const selected = option.key === collection
          return (
            <button
              key={option.key}
              onClick={() => onChoose(option.key)}
              className={`relative rounded-[26px] border p-6 text-center transition ${selected ? "border-[#6f37ff] shadow-[0_18px_44px_rgba(111,55,255,0.14)]" : theme === "dark" ? "border-white/10 bg-white/[0.02]" : "border-black/8 bg-white"}`}
            >
              {selected ? <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#6f37ff] text-sm font-black text-white">✓</span> : null}
              <div className={`mx-auto flex h-18 w-18 items-center justify-center rounded-full ${ui.accentSoft}`}>
                <span className={`text-[36px] ${ui.accent}`}>{option.key === "videos" ? "▷" : option.key === "favorites" ? "♡" : "🖼️"}</span>
              </div>
              <div className={`mt-5 text-[18px] font-black ${selected ? ui.accent : ui.textPrimary}`}>{option.title}</div>
              <div className={`mt-3 min-h-[52px] text-sm leading-6 ${ui.textSecondary}`}>{option.description}</div>
              <div className={`mt-4 text-[18px] font-black ${selected ? ui.accent : ui.textPrimary}`}>${option.price.toFixed(2)}</div>
              {option.badge ? <div className={`mx-auto mt-4 inline-flex rounded-full px-3 py-1 text-sm font-bold ${ui.accentSoft} ${ui.accent}`}>{option.badge}</div> : null}
            </button>
          )
        })}
      </div>

      <div className={`mt-8 rounded-2xl border px-5 py-4 text-sm ${ui.secondaryPanel}`}>
        Secure checkout ・ High resolution ・ Print release included
      </div>
    </div>
  )
}

function StepSelectMedia({
  theme,
  collection,
  photos,
  selectedIds,
  onToggle,
  onSelectAll,
  onContinue,
}: {
  theme: LiveWebTheme
  collection: LiveCollectionKey
  photos: LivePhotoCard[]
  selectedIds: string[]
  onToggle: (photoId: string) => void
  onSelectAll: () => void
  onContinue: () => void
}) {
  const ui = liveThemeClasses(theme)
  const total = selectedIds.length * DIGITAL_ITEM_PRICE

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className={`text-[18px] font-black ${ui.textPrimary}`}>Select Photos</div>
          <div className={`mt-1 text-lg ${ui.textSecondary}`}>You selected “{COLLECTION_OPTIONS.find((option) => option.key === collection)?.title}”. Choose the photos you’d like to purchase.</div>
        </div>
        <div className="flex items-center gap-5">
          <button onClick={onSelectAll} className={`rounded-2xl border px-5 py-3 text-base font-semibold ${ui.buttonSecondary}`}>Select All</button>
          <div className={`text-base font-medium ${ui.textSecondary}`}>{selectedIds.length} selected</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        {photos.map((photo, index) => {
          const selected = selectedIds.includes(photo.id)
          const isVideo = looksLikeVideo(photo)
          return (
            <button
              key={photo.id}
              onClick={() => onToggle(photo.id)}
              className={`group relative overflow-hidden rounded-[20px] border text-left ${selected ? "border-[#6f37ff]" : theme === "dark" ? "border-white/10" : "border-black/8"}`}
            >
              <div className="relative aspect-[1/1] overflow-hidden">
                {isVideo ? (
                  <video src={photo.fullUrl} poster={photo.posterUrl || photo.previewUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                ) : (
                  <Image src={photo.previewUrl} alt={photo.base} fill sizes="240px" className="object-cover" />
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
                <div className={`absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border ${selected ? "border-transparent bg-[#6f37ff] text-white" : "border-white/70 bg-black/25 text-white"}`}>
                  {selected ? "✓" : ""}
                </div>
                {isVideo ? (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/55 bg-black/30 text-3xl">▶</div>
                  </div>
                ) : null}
                <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-xl bg-black/55 px-3 py-2 text-sm font-bold text-white">
                  <span>🖼️</span>
                  {formatPhotoTimeLabel(photo.createdAt, index)}
                </div>
                {isVideo ? (
                  <div className="absolute bottom-3 right-3 rounded-xl bg-black/72 px-3 py-2 text-sm font-bold text-white">
                    {photo.durationSec ? `${Math.floor(photo.durationSec / 60)}:${String(Math.round(photo.durationSec % 60)).padStart(2, "0")}` : "0:18"}
                  </div>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>

      <div className={`mt-8 flex flex-col gap-4 rounded-[24px] border px-5 py-5 lg:flex-row lg:items-center lg:justify-between ${ui.panel}`}>
        <div className="flex flex-wrap items-center gap-5 text-sm">
          <div className={`rounded-2xl border px-4 py-3 ${ui.secondaryPanel}`}>High Resolution ・ Perfect for printing</div>
          <div className={`rounded-2xl border px-4 py-3 ${ui.secondaryPanel}`}>Print Release Included ・ Personal use only</div>
        </div>
        <div className="flex items-center gap-8">
          <div className={`text-base font-semibold ${ui.textSecondary}`}>{selectedIds.length} photos selected</div>
          <div className={`text-[18px] font-black ${ui.textPrimary}`}>${total.toFixed(2)}</div>
          <button onClick={onContinue} disabled={!selectedIds.length} className={`inline-flex min-h-[58px] items-center justify-center rounded-2xl px-8 text-lg font-black ${ui.buttonPrimary} disabled:opacity-60`}>Continue →</button>
        </div>
      </div>
    </div>
  )
}

function StepReview({
  theme,
  selectedPhotos,
  printSelections,
  selectedVideosOnly,
  printsTotal,
  digitalTotal,
  onSetPrintQuantity,
  onRemovePhoto,
  onBack,
  onContinue,
}: {
  theme: LiveWebTheme
  selectedPhotos: LivePhotoCard[]
  printSelections: Partial<Record<PrintSku, number>>
  selectedVideosOnly: boolean
  printsTotal: number
  digitalTotal: number
  onSetPrintQuantity: (sku: PrintSku, next: number) => void
  onRemovePhoto: (photoId: string) => void
  onBack: () => void
  onContinue: () => void
}) {
  const ui = liveThemeClasses(theme)
  return (
    <div className="mt-10">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.25fr]">
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div className={`text-[18px] font-black ${ui.textPrimary}`}>Your Selection ({selectedPhotos.length})</div>
            <button onClick={onBack} className={`text-base font-bold ${ui.accent}`}>Change Selection</button>
          </div>

          <div className="space-y-4">
            {selectedPhotos.map((photo, index) => (
              <div key={photo.id} className={`grid grid-cols-[156px_1fr_42px] gap-4 rounded-[24px] border p-4 ${ui.secondaryPanel}`}>
                <div className="relative aspect-[1.15/1] overflow-hidden rounded-[18px]">
                  <Image src={photo.previewUrl} alt={photo.base} fill sizes="156px" className="object-cover" />
                </div>
                <div className="flex flex-col justify-center">
                  <div className={`text-[18px] font-black ${ui.textPrimary}`}>{photo.base}</div>
                  <div className={`mt-2 text-base ${ui.textSecondary}`}>{formatPhotoTimeLabel(photo.createdAt, index)} • {new Date(photo.createdAt || Date.now()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
                  <div className={`mt-2 text-base ${ui.textSecondary}`}>6000 × 4000</div>
                </div>
                <button onClick={() => onRemovePhoto(photo.id)} className={`flex h-11 w-11 items-center justify-center rounded-full border text-xl ${ui.buttonSecondary}`}>×</button>
              </div>
            ))}
          </div>

          <button onClick={() => selectedPhotos.forEach((photo) => onRemovePhoto(photo.id))} className={`mt-5 rounded-2xl border px-5 py-3 text-base font-semibold ${ui.buttonSecondary}`}>🗑 Remove All</button>
        </div>

        <div>
          <div className="mb-5 flex items-center justify-between">
            <div className={`text-[18px] font-black ${ui.textPrimary}`}>Choose Prints</div>
            <div className={`text-base ${ui.textSecondary}`}>Optional</div>
          </div>

          {selectedVideosOnly ? (
            <div className={`rounded-[24px] border p-6 ${ui.secondaryPanel}`}>
              <div className={`text-[18px] font-black ${ui.textPrimary}`}>Digital purchase only</div>
              <div className={`mt-2 text-base ${ui.textSecondary}`}>Prints are available for photos. Video selections can continue as digital-only.</div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {PRINT_OPTIONS.map((option, index) => {
                const quantity = Number(printSelections[option.sku] ?? 0)
                const preview = selectedPhotos[index % Math.max(1, selectedPhotos.length)]
                return (
                  <button
                    key={option.sku}
                    onClick={() => onSetPrintQuantity(option.sku, quantity + 1)}
                    className={`rounded-[24px] border p-4 text-center ${quantity > 0 ? "border-[#6f37ff]" : theme === "dark" ? "border-white/10 bg-white/[0.02]" : "border-black/8 bg-white"}`}
                  >
                    <div className="mx-auto flex h-36 w-full items-center justify-center rounded-[18px] bg-[#f5f1ff]">
                      <div className={`relative overflow-hidden border bg-white shadow-[0_14px_34px_rgba(0,0,0,0.12)] ${index % 3 === 0 ? "h-24 w-20 rotate-[-6deg]" : index % 3 === 1 ? "h-28 w-20" : "h-24 w-28"}`}>
                        {preview ? <Image src={preview.previewUrl} alt={preview.base} fill sizes="160px" className="object-cover" /> : null}
                      </div>
                    </div>
                    <div className={`mt-4 text-[20px] font-black ${ui.textPrimary}`}>{option.title}</div>
                    <div className={`mt-1 text-[18px] font-black ${ui.textPrimary}`}>${option.price.toFixed(2)}</div>
                    {option.subtitle ? <div className={`mt-1 text-sm ${ui.textSecondary}`}>{option.subtitle}</div> : null}
                    <div className={`mt-3 inline-flex items-center gap-3 rounded-full px-3 py-1 text-sm font-bold ${quantity > 0 ? `${ui.accentSoft} ${ui.accent}` : ui.textSecondary}`}>
                      <span>Qty</span>
                      <span>{quantity}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <div className={`mt-4 rounded-2xl border px-4 py-4 ${ui.secondaryPanel}`}>
            <div className={`text-sm font-black ${ui.textPrimary}`}>High quality professional prints</div>
            <div className={`mt-1 text-sm ${ui.textSecondary}`}>Printed on premium photo paper.</div>
          </div>
        </div>
      </div>

      <div className={`mt-8 flex flex-col gap-4 rounded-[24px] border px-5 py-5 lg:flex-row lg:items-center lg:justify-between ${ui.panel}`}>
        <div className="flex flex-wrap items-center gap-5">
          <div className={`rounded-2xl border px-4 py-4 ${ui.secondaryPanel}`}>
            <div className={`text-sm font-black ${ui.textPrimary}`}>{selectedPhotos.length} Photos Selected</div>
            <div className={`mt-1 text-sm ${ui.textSecondary}`}>Digital Download</div>
          </div>
          <div className={`rounded-2xl border px-4 py-4 ${ui.secondaryPanel}`}>
            <div className={`text-sm font-black ${ui.textPrimary}`}>Prints</div>
            <div className={`mt-1 text-sm ${ui.textSecondary}`}>{printsTotal > 0 ? `${Object.values(printSelections).reduce((sum, quantity) => sum + Number(quantity || 0), 0)} prints selected` : "No prints selected"}</div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className={`text-[16px] font-bold ${ui.textSecondary}`}>Total</div>
          <div className={`text-[34px] font-black tracking-[-0.04em] ${ui.textPrimary}`}>${(digitalTotal + printsTotal).toFixed(2)}</div>
          <button onClick={onContinue} disabled={!selectedPhotos.length} className={`inline-flex min-h-[58px] items-center justify-center rounded-2xl px-8 text-lg font-black ${ui.buttonPrimary} disabled:opacity-60`}>Continue to Checkout →</button>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({
  theme,
  title,
  subtitle,
  total,
}: {
  theme: LiveWebTheme
  title: string
  subtitle: string
  total: number
}) {
  const ui = liveThemeClasses(theme)
  return (
    <div className={`mt-5 flex items-start justify-between border-b pb-5 ${theme === "dark" ? "border-white/10" : "border-black/8"}`}>
      <div>
        <div className={`text-[18px] font-black ${ui.textPrimary}`}>{title}</div>
        <div className={`text-base ${ui.textSecondary}`}>{subtitle}</div>
      </div>
      <div className={`text-[18px] font-black ${ui.textPrimary}`}>${total.toFixed(2)}</div>
    </div>
  )
}

function PriceLine({ theme, label, value, subtle = false }: { theme: LiveWebTheme; label: string; value: number; subtle?: boolean }) {
  const ui = liveThemeClasses(theme)
  return (
    <div className="mt-2 flex items-center justify-between">
      <div className={`text-base ${ui.textSecondary}`}>{label}</div>
      <div className={`${subtle ? "text-base" : "text-[18px]"} font-semibold ${ui.textPrimary}`}>${value.toFixed(2)}</div>
    </div>
  )
}

function FormField({
  theme,
  label,
  value,
  onChange,
  placeholder,
}: {
  theme: LiveWebTheme
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const ui = liveThemeClasses(theme)
  return (
    <label className="block">
      <div className={`mb-2 text-sm font-bold ${ui.textPrimary}`}>{label}</div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`h-12 w-full rounded-2xl border px-4 text-base outline-none ${theme === "dark" ? "border-white/10 bg-[#0b0b0b] text-white placeholder:text-white/30" : "border-black/10 bg-white text-[#0f1424] placeholder:text-[#90a0b8]"}`}
      />
    </label>
  )
}

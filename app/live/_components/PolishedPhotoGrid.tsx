"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { cartTotal, readCart, toggleCartItem } from "./live-cart"
import type { CartLine, LivePhotoCard } from "./live-types"

function looksLikeVideo(photo: LivePhotoCard) {
  if (photo.mediaType === "video") return true
  const u = `${photo.fullUrl} ${photo.previewUrl}`.toLowerCase()
  return /\.(mp4|mov|m4v|webm)(\?|$)/i.test(u)
}

export default function PolishedPhotoGrid({
  eventId,
  guestId,
  photos,
  selectable = false,
}: {
  eventId: string
  guestId?: string
  photos: LivePhotoCard[]
  selectable?: boolean
}) {
  const [cart, setCart] = useState<CartLine[]>([])
  const [lightbox, setLightbox] = useState<LivePhotoCard | null>(null)

  useEffect(() => {
    setCart(readCart(eventId, guestId))
  }, [eventId, guestId])

  const selectedIds = useMemo(() => new Set(cart.map((x) => x.id)), [cart])

  function toggle(photo: LivePhotoCard) {
    setCart(toggleCartItem(eventId, guestId, photo))
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {photos.map((photo) => {
          const selected = selectedIds.has(photo.id)
          const isVideo = looksLikeVideo(photo)

          return (
            <div
              key={photo.id}
              className="group overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] transition hover:border-white/20 hover:bg-white/[0.06]"
            >
              <button className="block w-full" onClick={() => setLightbox(photo)}>
                <div className="relative aspect-[4/5] overflow-hidden bg-black/40">
                  {isVideo ? (
                    <video
                      src={photo.fullUrl}
                      poster={photo.posterUrl || undefined}
                      className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.02]"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <Image
                      src={photo.previewUrl}
                      alt={photo.base}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                      className="object-contain transition duration-300 group-hover:scale-[1.02]"
                    />
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
                  {isVideo ? (
                    <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white">
                      Video
                    </div>
                  ) : null}
                </div>
              </button>

              <div className="flex items-center justify-between gap-3 px-4 py-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-white/90">{photo.base}</div>
                  <div className="mt-1 text-xs text-white/50">{isVideo ? "IR Studio Live • Video" : "IR Studio Live"}</div>
                </div>

                {selectable ? (
                  <button
                    onClick={() => toggle(photo)}
                    className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${
                      selected
                        ? "bg-white text-black"
                        : "border border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12]"
                    }`}
                  >
                    {selected ? "Selected" : "Select"}
                  </button>
                ) : (
                  <button
                    onClick={() => setLightbox(photo)}
                    className="rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white hover:bg-white/[0.12]"
                  >
                    View
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectable && cart.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <div className="text-sm font-bold">{cart.length} selected</div>
              <div className="text-xs text-white/60">Ready for checkout</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-white/50">Starting total</div>
                <div className="text-lg font-black">${cartTotal(cart).toFixed(2)}</div>
              </div>
              <Link
                href={`/live/${encodeURIComponent(eventId)}/checkout${guestId ? `?guestId=${encodeURIComponent(guestId)}` : ""}`}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-black"
              >
                Checkout
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {lightbox ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setLightbox(null)}>
          <div
            className="relative max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_30px_120px_rgba(0,0,0,0.7)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <div className="text-sm font-bold">{lightbox.base}</div>
                <div className="text-xs text-white/50">{looksLikeVideo(lightbox) ? "Video Preview" : "Preview"}</div>
              </div>
              <div className="flex items-center gap-2">
                {selectable ? (
                  <button
                    onClick={() => toggle(lightbox)}
                    className={`rounded-2xl px-4 py-2 text-sm font-bold ${
                      selectedIds.has(lightbox.id)
                        ? "bg-white text-black"
                        : "border border-white/15 bg-white/[0.06] text-white"
                    }`}
                  >
                    {selectedIds.has(lightbox.id) ? "Selected" : "Select"}
                  </button>
                ) : null}
                <button
                  onClick={() => setLightbox(null)}
                  className="rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-bold"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex max-h-[80vh] items-center justify-center bg-black p-4">
              {looksLikeVideo(lightbox) ? (
                <video
                  src={lightbox.fullUrl}
                  poster={lightbox.posterUrl || undefined}
                  controls
                  playsInline
                  preload="metadata"
                  className="max-h-[78vh] w-auto max-w-full object-contain"
                />
              ) : (
                <Image
                  src={lightbox.fullUrl}
                  alt={lightbox.base}
                  width={1600}
                  height={1200}
                  sizes="100vw"
                  className="max-h-[78vh] w-auto max-w-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

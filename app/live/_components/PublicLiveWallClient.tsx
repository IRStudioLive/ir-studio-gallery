"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import type { LivePhotoCard } from "./live-types"
import { looksLikeVideo, readFavorites, toggleFavorite } from "./live-buy"
import { QRCodeImage, formatPhotoTimeLabel, type LiveWebTheme, liveThemeClasses } from "./live-web-theme"

type SortMode = "newest" | "oldest"
type FilterMode = "all" | "photos" | "videos"

export default function PublicLiveWallClient({
  theme,
  eventId,
  eventTitle,
  eventDateLabel,
  joinUrl,
  publicUrl,
  photos,
  guestCount,
  momentsCount,
  buyHref,
  guestId,
  guestLabel,
}: {
  theme: LiveWebTheme
  eventId: string
  eventTitle: string
  eventDateLabel: string
  joinUrl: string
  publicUrl: string
  photos: LivePhotoCard[]
  guestCount: number
  momentsCount: number
  buyHref: string
  guestId?: string
  guestLabel?: string
}) {
  const ui = liveThemeClasses(theme)
  const [filter, setFilter] = useState<FilterMode>("all")
  const [sort, setSort] = useState<SortMode>("newest")
  const [compactGrid, setCompactGrid] = useState(false)
  const [lightbox, setLightbox] = useState<LivePhotoCard | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setFavoriteIds(new Set(readFavorites(eventId, guestId)))
  }, [eventId, guestId])

  const photosOnlyCount = useMemo(() => photos.filter((photo) => !looksLikeVideo(photo)).length, [photos])
  const videoCount = useMemo(() => photos.filter((photo) => looksLikeVideo(photo)).length, [photos])

  const filteredPhotos = useMemo(() => {
    const next = [...photos]
      .filter((photo) => {
        if (filter === "videos") return looksLikeVideo(photo)
        if (filter === "photos") return !looksLikeVideo(photo)
        return true
      })
      .sort((a, b) => {
        const aTime = new Date(a.createdAt ?? 0).getTime()
        const bTime = new Date(b.createdAt ?? 0).getTime()
        return sort === "newest" ? bTime - aTime : aTime - bTime
      })
    return next
  }, [filter, photos, sort])

  function handleFavorite(photoId: string) {
    setFavoriteIds(new Set(toggleFavorite(eventId, guestId, photoId)))
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="space-y-3 pt-3 text-center lg:space-y-4 lg:pt-5">
        <div className={`text-[18px] font-semibold ${ui.textSecondary}`}>
          {guestLabel ? `Detected for ${guestLabel}` : ""}
        </div>
        <h1 className={`text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-[66px] ${ui.textPrimary}`}>
          Welcome to the <span className={ui.accent}>Live Wall</span>
        </h1>
        <p className={`mx-auto max-w-3xl text-lg ${ui.textSecondary}`}>
          Photos and videos from the event, shared in real time.
        </p>
      </section>

      <section className={`grid gap-6 rounded-[32px] border px-6 py-7 lg:grid-cols-[340px_1fr] lg:px-9 lg:py-8 ${ui.panel}`}>
        <div className="mx-auto w-full max-w-[280px]">
          <div className={`rounded-[30px] border p-4 ${theme === "dark" ? "border-[#6f37ff]/35 shadow-[0_0_30px_rgba(111,55,255,0.18)]" : "border-[#6f37ff]/18 shadow-[0_10px_30px_rgba(111,55,255,0.10)]"}`}>
            <QRCodeImage value={joinUrl} size={280} />
          </div>
        </div>

        <div className="flex flex-col justify-center gap-6">
          <div className="flex items-start gap-4">
            <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full ${ui.accentSoft}`}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className={ui.accent}>
                <path d="M8 7.5h1.1l.8-1.7A1.5 1.5 0 0 1 11.26 5h1.48a1.5 1.5 0 0 1 1.36.8l.8 1.7H16a3 3 0 0 1 3 3v4.5A3 3 0 0 1 16 18H8a3 3 0 0 1-3-3v-4.5a3 3 0 0 1 3-3Z" stroke="currentColor" strokeWidth="1.7"/>
                <circle cx="12" cy="12.25" r="3.1" stroke="currentColor" strokeWidth="1.7"/>
              </svg>
            </div>
            <div>
              <div className={`text-[18px] font-black sm:text-[20px] ${ui.textPrimary}`}>Share your moments!</div>
              <p className={`mt-3 max-w-xl text-lg leading-8 ${ui.textSecondary}`}>
                Scan the QR code to join and upload your photos &amp; videos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`h-px flex-1 ${theme === "dark" ? "bg-white/10" : "bg-black/10"}`} />
            <div className={`text-lg font-semibold ${ui.textMuted}`}>OR</div>
            <div className={`h-px flex-1 ${theme === "dark" ? "bg-white/10" : "bg-black/10"}`} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className={`flex min-h-[62px] flex-1 items-center gap-4 rounded-2xl border px-4 ${ui.chipIdle}`}>
              <span className={ui.accent}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 1 1 7 7l-1 1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 1 1-7-7l1-1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </span>
              <span className={`truncate text-base font-medium ${ui.textSecondary}`}>{publicUrl.replace(/^https?:\/\//, "")}</span>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(publicUrl)}
              className={`inline-flex min-h-[62px] items-center justify-center rounded-2xl px-7 text-lg font-black ${ui.buttonPrimary}`}
            >
              Copy Link
            </button>
          </div>
        </div>
      </section>

      <section className={`grid gap-4 rounded-[32px] border px-6 py-6 lg:grid-cols-[1fr_1fr_260px] lg:px-8 ${ui.panel}`}>
        <StatBlock
          theme={theme}
          icon="users"
          value={String(guestCount)}
          label={guestLabel ? "Detected Person" : "Guests"}
          detail={guestLabel || undefined}
        />
        <StatBlock
          theme={theme}
          icon="heart"
          value={String(momentsCount)}
          label="Moments Shared"
        />
        <Link
          href={buyHref}
          className={`inline-flex min-h-[92px] items-center justify-center gap-4 rounded-[24px] border px-6 text-[20px] font-black no-underline ${ui.buttonSecondary} ${ui.accentBorder} ${ui.accent}`}
        >
          <span className="text-[30px]">🛒</span>
          Buy Photos
        </Link>
      </section>

      <section className={`rounded-[32px] border px-5 py-5 lg:px-6 lg:py-6 ${ui.gridPanel}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <FilterButton selected={filter === "all"} onClick={() => setFilter("all")} theme={theme} label={`All`} count={photos.length} />
            <FilterButton selected={filter === "photos"} onClick={() => setFilter("photos")} theme={theme} label="Photos" count={photosOnlyCount} />
            <FilterButton selected={filter === "videos"} onClick={() => setFilter("videos")} theme={theme} label="Videos" count={videoCount} />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className={`h-14 rounded-2xl border px-5 text-lg font-semibold outline-none ${ui.select}`}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            <button
              onClick={() => setCompactGrid((value) => !value)}
              className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${ui.chipIdle}`}
              aria-label="Toggle grid density"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={ui.textPrimary}>
                <rect x="4" y="4" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.8"/>
                <rect x="14" y="4" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.8"/>
                <rect x="4" y="14" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.8"/>
                <rect x="14" y="14" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
            </button>
          </div>
        </div>

        <div className={`mt-6 grid gap-4 ${compactGrid ? "grid-cols-1 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"}`}>
          {filteredPhotos.map((photo, index) => {
            const isVideo = looksLikeVideo(photo)
            const isFavorite = favoriteIds.has(photo.id)

            return (
              <article
                key={photo.id}
                className={`group overflow-hidden rounded-[22px] border transition ${theme === "dark" ? "border-white/10 bg-white/[0.03]" : "border-black/8 bg-[#f7f7f4]"}`}
              >
                <button className="relative block aspect-[1.13/1] w-full overflow-hidden bg-black/5 text-left" onClick={() => setLightbox(photo)}>
                  {isVideo ? (
                    <video
                      src={photo.fullUrl}
                      poster={photo.posterUrl || photo.previewUrl}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <Image
                      src={photo.previewUrl}
                      alt={photo.base}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  )}

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

                  <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-xl bg-black/55 px-3 py-2 text-sm font-bold text-white">
                    <span>🖼️</span>
                    {formatPhotoTimeLabel(photo.createdAt, index)}
                  </div>

                  {isVideo ? (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-18 w-18 items-center justify-center rounded-full border border-white/50 bg-black/40 text-white shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
                          <span className="ml-1 text-4xl">▶</span>
                        </div>
                      </div>
                      <div className="absolute bottom-3 right-3 rounded-xl bg-black/72 px-3 py-2 text-sm font-bold text-white">
                        {photo.durationSec ? `${Math.floor(photo.durationSec / 60)}:${String(Math.round(photo.durationSec % 60)).padStart(2, "0")}` : "0:18"}
                      </div>
                    </>
                  ) : (
                    <button
                      className={`absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full border text-xl transition ${
                        isFavorite
                          ? "border-transparent bg-[#6f37ff] text-white shadow-[0_12px_28px_rgba(111,55,255,0.35)]"
                          : "border-white/55 bg-black/28 text-white"
                      }`}
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        handleFavorite(photo.id)
                      }}
                      aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
                    >
                      ♥
                    </button>
                  )}
                </button>
              </article>
            )
          })}
        </div>
      </section>

      <footer className={`flex flex-col items-center justify-between gap-5 pt-2 text-sm font-medium lg:flex-row ${ui.footer}`}>
        <Image src="/ir.png" alt="IR Studio" width={88} height={46} className="h-[42px] w-auto opacity-90" />
        <div className="text-center text-base">Capturing moments, creating memories <span className={ui.accent}>♡</span></div>
        <div>© 2026 IR Studio. All rights reserved.</div>
      </footer>

      {lightbox ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={() => setLightbox(null)}>
          <div
            className={`relative w-full max-w-6xl overflow-hidden rounded-[30px] border ${ui.panel}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => setLightbox(null)}
              className={`absolute right-5 top-5 z-10 flex h-12 w-12 items-center justify-center rounded-full border text-xl ${ui.buttonSecondary}`}
            >
              ×
            </button>
            <div className="relative flex max-h-[88vh] items-center justify-center bg-black px-4 py-16">
              {looksLikeVideo(lightbox) ? (
                <video src={lightbox.fullUrl} poster={lightbox.posterUrl || lightbox.previewUrl} controls playsInline preload="metadata" className="max-h-[78vh] w-auto max-w-full object-contain" />
              ) : (
                <Image src={lightbox.fullUrl} alt={lightbox.base} width={1600} height={1200} sizes="100vw" className="max-h-[78vh] w-auto max-w-full object-contain" />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function FilterButton({
  selected,
  onClick,
  theme,
  label,
  count,
}: {
  selected: boolean
  onClick: () => void
  theme: LiveWebTheme
  label: string
  count: number
}) {
  const ui = liveThemeClasses(theme)
  return (
    <button
      onClick={onClick}
      className={`inline-flex h-14 items-center gap-3 rounded-full border px-6 text-[18px] font-black transition ${selected ? ui.chipSelected : ui.chipIdle}`}
    >
      <span>{label}</span>
      {label === "All" ? null : <span className={`${selected ? "text-white/80" : ui.accent}`}>{count.toLocaleString()}</span>}
    </button>
  )
}

function StatBlock({
  theme,
  icon,
  value,
  label,
  detail,
}: {
  theme: LiveWebTheme
  icon: "users" | "heart"
  value: string
  label: string
  detail?: string
}) {
  const ui = liveThemeClasses(theme)
  return (
    <div className="flex items-center gap-5">
      <div className={`flex h-18 w-18 shrink-0 items-center justify-center rounded-full ${ui.accentSoft} ${ui.accent}`}>
        <span className="text-[34px]">{icon === "users" ? "👥" : "♡"}</span>
      </div>
      <div className="min-w-0">
        <div className={`text-[19px] font-black ${ui.textPrimary}`}>{value}</div>
        <div className={`text-[15px] font-medium ${ui.textSecondary}`}>{label}</div>
        {detail ? <div className={`truncate text-[13px] ${ui.textMuted}`}>{detail}</div> : null}
      </div>
    </div>
  )
}

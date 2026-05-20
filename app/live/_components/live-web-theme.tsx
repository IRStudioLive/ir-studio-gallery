import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

export type LiveWebTheme = "light" | "dark"

export function resolveLiveWebTheme(input?: string): LiveWebTheme {
  return input === "dark" ? "dark" : "light"
}

export function liveBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_IR_STUDIO_LIVE_URL?.trim()
  return (raw && raw.length ? raw : "https://irstudiolive.com").replace(/\/+$/, "")
}

export function absoluteLiveUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${liveBaseUrl()}${normalized}`
}

export function formatEventDateLabel(input?: string | null) {
  if (!input) return ""
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export function formatPhotoTimeLabel(input?: string | null, fallbackIndex = 0) {
  if (!input) return `${String(8 + (fallbackIndex % 10)).padStart(2, "0")}:${String(22 - (fallbackIndex % 9)).padStart(2, "0")} PM`
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return `${String(8 + (fallbackIndex % 10)).padStart(2, "0")}:${String(22 - (fallbackIndex % 9)).padStart(2, "0")} PM`
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export function displayEventTitle(title: string | null | undefined, eventId: string) {
  const clean = (title || "").trim()
  if (!clean || clean === eventId || clean.startsWith("evt_")) return "IR Studio Live Event"
  return clean
}

export function liveThemeClasses(theme: LiveWebTheme) {
  if (theme === "dark") {
    return {
      page: "bg-[#020202] text-white",
      panel: "border-white/10 bg-[#090909] shadow-[0_24px_100px_rgba(0,0,0,0.55)]",
      secondaryPanel: "border-white/10 bg-[#090909]",
      topBorder: "border-white/10",
      textPrimary: "text-white",
      textSecondary: "text-white/72",
      textMuted: "text-white/52",
      accent: "text-[#6f37ff]",
      accentBorder: "border-[#6f37ff]/50",
      accentSoft: "bg-[#6f37ff]/12",
      buttonPrimary: "bg-[linear-gradient(90deg,#6f37ff,#4e20ff)] text-white shadow-[0_20px_60px_rgba(111,55,255,0.28)]",
      buttonSecondary: "border-white/12 bg-transparent text-white",
      chipIdle: "border-white/10 bg-[#0b0b0b] text-white/80",
      chipSelected: "border-transparent bg-[linear-gradient(90deg,#6f37ff,#4e20ff)] text-white",
      select: "border-white/10 bg-[#0b0b0b] text-white",
      gridPanel: "border-white/10 bg-[#060606]",
      footer: "text-white/72",
      liveBadge: "border-white/12 bg-[#050505] text-white",
    } as const
  }

  return {
    page: "bg-[#faf8f3] text-[#0f1424]",
    panel: "border-black/8 bg-white shadow-[0_20px_90px_rgba(15,23,42,0.08)]",
    secondaryPanel: "border-black/8 bg-white",
    topBorder: "border-black/8",
    textPrimary: "text-[#0f1424]",
    textSecondary: "text-[#485166]",
    textMuted: "text-[#768099]",
    accent: "text-[#6f37ff]",
    accentBorder: "border-[#6f37ff]/35",
    accentSoft: "bg-[#6f37ff]/8",
    buttonPrimary: "bg-[linear-gradient(90deg,#6f37ff,#4e20ff)] text-white shadow-[0_16px_40px_rgba(111,55,255,0.22)]",
    buttonSecondary: "border-black/10 bg-white text-[#0f1424]",
    chipIdle: "border-black/10 bg-white text-[#0f1424]",
    chipSelected: "border-transparent bg-[linear-gradient(90deg,#6f37ff,#4e20ff)] text-white",
    select: "border-black/10 bg-white text-[#0f1424]",
    gridPanel: "border-black/8 bg-white",
    footer: "text-[#485166]",
    liveBadge: "border-black/10 bg-white text-[#0f1424]",
  } as const
}

export function QRCodeImage({ value, size = 260 }: { value: string; size?: number }) {
  return (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&data=${encodeURIComponent(value)}`}
      alt="Join event QR code"
      width={size}
      height={size}
      className="h-auto w-full rounded-[28px] bg-white object-contain"
    />
  )
}

export function LiveEventChrome({
  theme,
  eventTitle,
  eventDate,
  children,
}: {
  theme: LiveWebTheme
  eventTitle: string
  eventDate: string
  children: ReactNode
}) {
  const ui = liveThemeClasses(theme)

  return (
    <main className={`min-h-screen ${ui.page}`}>
      <div className={`border-b ${ui.topBorder}`}>
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-6 py-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-5">
            <Link href="/" className="shrink-0 no-underline">
              <Image src="/ir.png" alt="IR Studio" width={92} height={58} className="h-[52px] w-auto" />
            </Link>
            <div className={`h-14 w-px shrink-0 ${theme === "dark" ? "bg-white/12" : "bg-black/10"}`} />
            <div className="min-w-0">
              <div className={`truncate text-[19px] font-black ${ui.textPrimary}`}>{eventTitle}</div>
              <div className={`mt-1 text-[14px] font-medium ${ui.textSecondary}`}>{eventDate}</div>
            </div>
          </div>

          <div className={`inline-flex items-center gap-3 rounded-2xl border px-5 py-3 ${ui.liveBadge}`}>
            <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.55)]" />
            <span className="text-[15px] font-black tracking-[0.02em]">LIVE</span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1440px] flex-col px-6 py-9 lg:px-10 lg:py-10">
        {children}
      </div>
    </main>
  )
}

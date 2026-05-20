"use client"

import Link from "next/link"
import { ReactNode } from "react"

export default function LiveShell({
  title,
  subtitle,
  eventId,
  rightSlot,
  children,
}: {
  title: string
  subtitle?: string
  eventId?: string
  rightSlot?: ReactNode
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.28),transparent_40%),radial-gradient(circle_at_top_right,rgba(236,72,153,0.20),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))] px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link href="/" className="text-xs font-bold tracking-[0.24em] text-white/45 no-underline">
                  IR STUDIO LIVE
                </Link>
                <div className="mt-4">
                  <h1 className="text-2xl font-black sm:text-3xl">{title}</h1>
                  {subtitle ? <p className="mt-1 text-sm text-white/60 sm:text-base">{subtitle}</p> : null}
                  {eventId ? (
                    <p className="mt-2 text-xs font-semibold tracking-wide text-white/40">
                      Event ID: {eventId}
                    </p>
                  ) : null}
                </div>
              </div>
              {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
            </div>
          </div>

          <div className="px-5 py-5 sm:px-7 sm:py-7">
            {children}
          </div>
        </div>
      </div>
    </main>
  )
}

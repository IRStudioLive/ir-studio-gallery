"use client"

import { useMemo, useState } from "react"
import { LiveEventChrome, liveThemeClasses, type LiveWebTheme } from "./live-web-theme"

export default function JoinExperience({
  theme,
  eventId,
  requireSelfie,
}: {
  theme: LiveWebTheme
  eventId: string
  requireSelfie: boolean
}) {
  const ui = liveThemeClasses(theme)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [selfieUrl, setSelfieUrl] = useState("")
  const [selfieFileName, setSelfieFileName] = useState("")
  const [status, setStatus] = useState("")
  const [busy, setBusy] = useState(false)
  const [uploadingSelfie, setUploadingSelfie] = useState(false)

  const canSubmit = useMemo(() => {
    if (!eventId) return false
    if (!phone.trim() && !email.trim()) return false
    if (requireSelfie && !selfieUrl.trim()) return false
    if (uploadingSelfie) return false
    return true
  }, [email, eventId, phone, requireSelfie, selfieUrl, uploadingSelfie])

  async function onPickSelfie(file: File | null) {
    if (!file || !eventId) return
    setUploadingSelfie(true)
    setStatus("Uploading selfie…")

    const form = new FormData()
    form.set("eventId", eventId)
    form.set("file", file)

    const res = await fetch("/api/tether/guests/selfie", {
      method: "POST",
      body: form,
    })
    const json = await res.json()
    setUploadingSelfie(false)

    if (!res.ok || !json?.ok || !json?.url) {
      setStatus("Selfie upload failed.")
      return
    }

    setSelfieUrl(String(json.url))
    setSelfieFileName(file.name)
    setStatus("Selfie ready.")
  }

  async function submit() {
    if (!canSubmit) return
    setBusy(true)
    setStatus("Joining event…")
    const res = await fetch("/api/tether/guests/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        name: name || null,
        phone: phone || null,
        email: email || null,
        selfieUrl: requireSelfie ? selfieUrl || null : null,
        requireSelfie,
      }),
    })
    const json = await res.json()
    setBusy(false)
    if (!res.ok || !json?.ok) {
      setStatus("Join failed.")
      return
    }
    setStatus("Joined successfully.")
    if (json?.recipient?.id) {
      window.location.href = `/live/${encodeURIComponent(eventId)}/guest/${encodeURIComponent(json.recipient.id)}${theme === "dark" ? "?theme=dark" : ""}`
    }
  }

  return (
    <LiveEventChrome theme={theme} eventTitle="Join Live Event" eventDate={eventId || "IR Studio Live"}>
      <div className="mx-auto flex w-full max-w-[760px] flex-col items-center pt-8">
        <div className="text-center">
          <h1 className={`text-4xl font-black tracking-[-0.04em] sm:text-5xl ${ui.textPrimary}`}>Join the <span className={ui.accent}>Live Wall</span></h1>
          <p className={`mt-3 text-lg ${ui.textSecondary}`}>Enter your details to receive your matched photos and videos.</p>
        </div>

        <div className={`mt-8 w-full rounded-[32px] border p-7 sm:p-9 ${ui.panel}`}>
          <div className={`mb-6 text-sm font-semibold ${ui.textMuted}`}>Event ID: {eventId || "Unknown event"}</div>
          <div className="grid gap-4">
            <JoinField theme={theme} value={name} onChange={setName} placeholder="Full Name (optional)" />
            <JoinField theme={theme} value={phone} onChange={setPhone} placeholder="Phone Number" />
            <JoinField theme={theme} value={email} onChange={setEmail} placeholder="Email Address" />
            {requireSelfie ? (
              <SelfieUploader
                theme={theme}
                fileName={selfieFileName}
                uploading={uploadingSelfie}
                ready={Boolean(selfieUrl)}
                onPick={onPickSelfie}
              />
            ) : null}
            <button
              disabled={!canSubmit || busy}
              onClick={submit}
              className={`mt-2 inline-flex min-h-[60px] items-center justify-center rounded-2xl px-8 text-lg font-black ${ui.buttonPrimary} disabled:opacity-60`}
            >
              {busy ? "Joining…" : requireSelfie ? "Join + Enroll Selfie" : "Join Event"}
            </button>
            {status ? <div className={`text-center text-sm font-semibold ${ui.textSecondary}`}>{status}</div> : null}
          </div>
        </div>
      </div>
    </LiveEventChrome>
  )
}

function JoinField({
  theme,
  value,
  onChange,
  placeholder,
}: {
  theme: LiveWebTheme
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={`h-14 w-full rounded-2xl border px-4 text-base outline-none ${theme === "dark" ? "border-white/10 bg-[#0b0b0b] text-white placeholder:text-white/30" : "border-black/10 bg-white text-[#0f1424] placeholder:text-[#90a0b8]"}`}
    />
  )
}

function SelfieUploader({
  theme,
  fileName,
  uploading,
  ready,
  onPick,
}: {
  theme: LiveWebTheme
  fileName: string
  uploading: boolean
  ready: boolean
  onPick: (file: File | null) => void | Promise<void>
}) {
  const inputId = "ir-selfie-upload"
  const dark = theme === "dark"

  return (
    <div className={`rounded-[24px] border p-4 ${dark ? "border-white/10 bg-[#0b0b0b]" : "border-black/10 bg-white"}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className={`text-sm font-black ${dark ? "text-white" : "text-[#0f1424]"}`}>Upload a Selfie</div>
          <div className={`mt-1 text-sm ${dark ? "text-white/60" : "text-[#708099]"}`}>
            Choose a photo from your phone instead of pasting a URL.
          </div>
        </div>
        <label
          htmlFor={inputId}
          className={`inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-2xl px-5 text-sm font-black ${
            dark ? "bg-white text-black" : "bg-[#0f1424] text-white"
          }`}
        >
          {uploading ? "Uploading…" : ready ? "Replace Selfie" : "Choose Photo"}
        </label>
      </div>

      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => onPick(event.target.files?.[0] ?? null)}
      />

      <div className={`mt-3 text-sm font-semibold ${ready ? (dark ? "text-[#8ed0ff]" : "text-[#0d61d8]") : dark ? "text-white/40" : "text-[#90a0b8]"}`}>
        {ready ? `Ready: ${fileName || "selfie uploaded"}` : "No selfie selected yet"}
      </div>
    </div>
  )
}

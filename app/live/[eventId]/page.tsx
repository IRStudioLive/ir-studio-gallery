import LiveAutoRefresh from "../_components/LiveAutoRefresh"
import PublicLiveWallClient from "../_components/PublicLiveWallClient"
import { absoluteLiveUrl, displayEventTitle, formatEventDateLabel, LiveEventChrome, resolveLiveWebTheme } from "../_components/live-web-theme"
import { getEvent, getEventPhotos, getRecipientsForEvent, upsertEvent } from "@/lib/irstudiolive/store"

export default async function LiveEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>
  searchParams: Promise<{ theme?: string }>
}) {
  const { eventId } = await params
  const { theme: themeInput } = await searchParams
  const theme = resolveLiveWebTheme(themeInput)

  upsertEvent({ id: eventId })
  const event = getEvent(eventId)
  const recipients = getRecipientsForEvent(eventId)
  const photos = getEventPhotos(eventId).map((photo) => ({
    id: photo.id,
    base: photo.base,
    previewUrl: photo.posterUrl || photo.previewUrl,
    fullUrl: photo.fullUrl,
    mediaType: photo.mediaType,
    posterUrl: photo.posterUrl,
    createdAt: photo.createdAt,
    durationSec: photo.durationSec ?? null,
  }))

  if (!event?.isPublic) {
    return (
      <LiveEventChrome
        theme={theme}
        eventTitle={displayEventTitle(event?.title, eventId)}
        eventDate={formatEventDateLabel(event?.createdAt) || "Private event"}
      >
        <div className="rounded-[28px] border border-black/10 bg-white p-10 text-center text-lg text-black/65">
          This event has public access turned off.
        </div>
      </LiveEventChrome>
    )
  }

  const eventTitle = displayEventTitle(event?.title, eventId)
  const eventDate = formatEventDateLabel(event?.createdAt) || "Live event"
  const joinUrl = absoluteLiveUrl(`/live/join?eventId=${encodeURIComponent(eventId)}${event?.requireSelfie ? "&selfie=1" : ""}${theme === "dark" ? "&theme=dark" : ""}`)
  const publicUrl = absoluteLiveUrl(`/live/${encodeURIComponent(eventId)}${theme === "dark" ? "?theme=dark" : ""}`)
  const buyHref = `/live/${encodeURIComponent(eventId)}/checkout${theme === "dark" ? "?theme=dark" : ""}`

  return (
    <>
      <LiveAutoRefresh intervalMs={3000} />
      <LiveEventChrome theme={theme} eventTitle={eventTitle} eventDate={eventDate}>
        <PublicLiveWallClient
          theme={theme}
          eventId={eventId}
          eventTitle={eventTitle}
          eventDateLabel={eventDate}
          joinUrl={joinUrl}
          publicUrl={publicUrl}
          photos={photos}
          guestCount={recipients.length}
          momentsCount={photos.length}
          buyHref={buyHref}
        />
      </LiveEventChrome>
    </>
  )
}

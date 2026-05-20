import LiveAutoRefresh from "@/app/live/_components/LiveAutoRefresh"
import PublicLiveWallClient from "@/app/live/_components/PublicLiveWallClient"
import { absoluteLiveUrl, displayEventTitle, formatEventDateLabel, LiveEventChrome, resolveLiveWebTheme } from "@/app/live/_components/live-web-theme"
import { getEvent, getGuestPhotos, getRecipient } from "@/lib/irstudiolive/store"

export default async function LiveGuestPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string; guestId: string }>
  searchParams: Promise<{ theme?: string }>
}) {
  const { eventId, guestId } = await params
  const { theme: themeInput } = await searchParams
  const theme = resolveLiveWebTheme(themeInput ?? "dark")

  const event = getEvent(eventId)
  const guest = getRecipient(eventId, guestId)
  const photos = getGuestPhotos(eventId, guestId).map((photo) => ({
    id: photo.id,
    base: photo.base,
    previewUrl: photo.posterUrl || photo.previewUrl,
    fullUrl: photo.fullUrl,
    mediaType: photo.mediaType,
    posterUrl: photo.posterUrl,
    createdAt: photo.createdAt,
    durationSec: photo.durationSec ?? null,
  }))

  const eventTitle = displayEventTitle(event?.title, eventId)
  const eventDate = formatEventDateLabel(event?.createdAt) || "Live event"
  const guestLabel = guest?.name || guest?.email || guest?.phone || "Detected Person"
  const joinUrl = absoluteLiveUrl(`/live/join?eventId=${encodeURIComponent(eventId)}${event?.requireSelfie ? "&selfie=1" : ""}${theme === "dark" ? "&theme=dark" : ""}`)
  const publicUrl = absoluteLiveUrl(`/live/${encodeURIComponent(eventId)}/guest/${encodeURIComponent(guestId)}${theme === "dark" ? "?theme=dark" : ""}`)
  const buyHref = `/live/${encodeURIComponent(eventId)}/checkout?guestId=${encodeURIComponent(guestId)}${theme === "dark" ? "&theme=dark" : ""}`

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
          guestCount={1}
          momentsCount={photos.length}
          buyHref={buyHref}
          guestId={guestId}
          guestLabel={guestLabel}
        />
      </LiveEventChrome>
    </>
  )
}

import CheckoutExperience from "@/app/live/_components/CheckoutExperience"
import { displayEventTitle, formatEventDateLabel, resolveLiveWebTheme } from "@/app/live/_components/live-web-theme"
import { getEvent, getEventPhotos, getGuestPhotos } from "@/lib/irstudiolive/store"
import type { IRSubscriptionPlanId } from "@/lib/irstudiolive/subscriptions"

export default async function LiveCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>
  searchParams: Promise<{ guestId?: string; theme?: string }>
}) {
  const { eventId } = await params
  const { guestId, theme: themeInput } = await searchParams
  const theme = resolveLiveWebTheme(themeInput)

  const event = getEvent(eventId)
  const sourcePhotos = guestId ? getGuestPhotos(eventId, guestId) : getEventPhotos(eventId)
  const photos = sourcePhotos.map((photo) => ({
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
  const backHref = guestId
    ? `/live/${encodeURIComponent(eventId)}/guest/${encodeURIComponent(guestId)}${theme === "dark" ? "?theme=dark" : ""}`
    : `/live/${encodeURIComponent(eventId)}${theme === "dark" ? "?theme=dark" : ""}`

  return (
    <CheckoutExperience
      theme={theme}
      eventId={eventId}
      guestId={guestId}
      sellerPlan={(event?.sellerPlan ?? "free") as IRSubscriptionPlanId}
      eventTitle={eventTitle}
      eventDateLabel={eventDate}
      backHref={backHref}
      photos={photos}
    />
  )
}

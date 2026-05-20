import JoinExperience from "../_components/JoinExperience"
import { resolveLiveWebTheme } from "../_components/live-web-theme"

export default async function LiveJoinPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string; selfie?: string; theme?: string }>
}) {
  const { eventId, selfie, theme: themeInput } = await searchParams
  const theme = resolveLiveWebTheme(themeInput ?? "light")

  return (
    <JoinExperience
      theme={theme}
      eventId={eventId ?? ""}
      requireSelfie={selfie === "1"}
    />
  )
}

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

const accountId = process.env.R2_ACCOUNT_ID?.trim()
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
const bucket = process.env.R2_BUCKET?.trim()

let client: S3Client | null = null

export function r2Enabled() {
  return Boolean(accountId && accessKeyId && secretAccessKey && bucket)
}

export function r2Bucket() {
  return bucket || ""
}

function getClient() {
  if (!r2Enabled()) {
    throw new Error("R2 is not configured")
  }

  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId as string,
        secretAccessKey: secretAccessKey as string,
      },
    })
  }

  return client
}

export async function putR2Object(params: {
  key: string
  body: Buffer
  contentType: string | null
}) {
  await getClient().send(
    new PutObjectCommand({
      Bucket: r2Bucket(),
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType || undefined,
      CacheControl: "public, max-age=31536000, immutable",
    })
  )
}

export async function getR2Object(key: string) {
  return getClient().send(
    new GetObjectCommand({
      Bucket: r2Bucket(),
      Key: key,
    })
  )
}

export function buildR2MediaKey(params: {
  eventId: string
  kind: "image" | "video"
  filename: string
}) {
  return `events/${params.eventId}/${params.kind === "video" ? "videos" : "images"}/${params.filename}`
}

export function buildMediaProxyUrl(key: string) {
  return `/api/tether/media?key=${encodeURIComponent(key)}`
}

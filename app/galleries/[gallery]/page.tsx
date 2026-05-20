import fs from "fs";
import path from "path";
import os from "os";
import Link from "next/link";
import Image from "next/image";

type Props = { params: Promise<{ gallery: string }> };

function safeJoin(root: string, ...parts: string[]) {
  const p = path.join(root, ...parts);
  const rel = path.relative(root, p);
  if (rel.startsWith("..") || path.isAbsolute(rel)) throw new Error("Invalid path");
  return p;
}

export default async function GalleryPage(props: Props) {
  const { gallery } = await props.params;

  const galleriesRoot =
    process.env.GALLERIES_ROOT || path.join(os.homedir(), "photo-cloud/galleries");

  const galleryName = gallery || "unknown";

  const highlightsDir = safeJoin(galleriesRoot, galleryName, "previews", "Highlights");

  const images = fs.existsSync(highlightsDir)
    ? fs
        .readdirSync(highlightsDir)
        .filter((f) => /\.(jpe?g)$/i.test(f))
        .sort()
    : [];

  return (
    <main style={{ padding: 40 }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/galleries" style={{ textDecoration: "none" }}>
          ← Back
        </Link>
      </div>

      <h1 style={{ fontSize: 32, marginBottom: 10 }}>{galleryName}</h1>
      <div style={{ color: "#666", marginBottom: 24 }}>
        Highlights ({images.length} images)
      </div>

      {images.length === 0 ? (
        <div style={{ padding: 20, border: "1px solid #ddd", borderRadius: 12 }}>
          No preview images found yet.
          <div style={{ marginTop: 8, color: "#666" }}>
            Put JPGs in <code>originals/Highlights</code> and the watcher will create previews.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {images.map((file) => (
            <a
              key={file}
              href={`/api/image?gallery=${encodeURIComponent(galleryName)}&section=Highlights&file=${encodeURIComponent(
                file
              )}`}
              target="_blank"
              rel="noreferrer"
              style={{
                border: "1px solid #eee",
                borderRadius: 14,
                overflow: "hidden",
                display: "block",
                textDecoration: "none",
              }}
              title={file}
            >
              <div style={{ position: "relative", width: "100%", height: 220 }}>
                <Image
                  src={`/api/image?gallery=${encodeURIComponent(galleryName)}&section=Highlights&file=${encodeURIComponent(
                    file
                  )}`}
                  alt={file}
                  fill
                  sizes="(max-width: 768px) 100vw, 220px"
                  style={{ objectFit: "cover" }}
                />
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}

import fs from "fs";
import path from "path";
import os from "os";
import Link from "next/link";

export default function GalleriesPage() {
  const galleriesRoot =
    process.env.GALLERIES_ROOT || path.join(os.homedir(), "photo-cloud/galleries");

  const galleries = fs.existsSync(galleriesRoot)
    ? fs
        .readdirSync(galleriesRoot, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
    : [];

  return (
    <main style={{ padding: 40 }}>
      <h1 style={{ fontSize: 32, marginBottom: 30 }}>Client Galleries</h1>

      {galleries.length === 0 ? (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: "1px solid #ddd",
            color: "#555",
            maxWidth: 720,
            lineHeight: 1.6,
          }}
        >
          No hosted galleries are available in this environment yet.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px,1fr))",
            gap: 20,
          }}
        >
          {galleries.map((gallery) => (
            <Link
              key={gallery}
              href={`/galleries/${gallery}`}
              style={{
                padding: 30,
                borderRadius: 16,
                border: "1px solid #ddd",
                textDecoration: "none",
                color: "black",
                fontWeight: 600,
                fontSize: 18,
              }}
            >
              {gallery}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

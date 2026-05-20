import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IR Studio Gallery",
  description: "IR Studio gallery, equipment, and live event tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "../index.css";
export const metadata: Metadata = {
  title: "Ayush — Creative Developer / On Air",
  description: "Hey, I’m Ayush. I make games, websites, and mobile apps.",
  icons: { icon: "/favicon.svg" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

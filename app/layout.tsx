import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/components/ui/sonner";
import { SkipLink } from "@/components/skip-link";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://murales-politicos.vercel.app"),
  title: {
    default: "Murales Políticos — Registro de propaganda política en Paraguay",
    template: "%s · Murales Políticos",
  },
  description:
    "Mapa colaborativo para registrar y documentar murales de propaganda política en Paraguay.",
  openGraph: {
    title: "Murales Políticos",
    description: "Mapa colaborativo de murales de propaganda política en Paraguay",
    locale: "es_PY",
    type: "website",
  },
  robots: { index: true, follow: true },
  referrer: "strict-origin-when-cross-origin",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={plex.variable}>
      <body className="font-sans antialiased bg-background text-foreground">
        <SkipLink />
        {children}
        <Toaster position="top-right" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

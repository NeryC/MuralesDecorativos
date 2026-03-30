import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Murales Políticos — Registro de propaganda política en Paraguay",
  description: "Mapa colaborativo para registrar y documentar murales de propaganda política en Paraguay. Reportá murales, seguí modificaciones y consultá el historial.",
  openGraph: {
    title: "Murales Políticos",
    description: "Mapa colaborativo de murales de propaganda política en Paraguay",
    locale: "es_PY",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="bg-white dark:bg-gray-950">
      <head>
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

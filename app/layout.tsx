import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Murales Decorativos",
  description: "Mapa colaborativo de murales decorativos",
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
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

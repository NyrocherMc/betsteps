import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BetSteps — Calculateur séquentiel intelligent",
  description: "Calculateur mathématique séquentiel en 2 étapes pour optimisation de mises. Dark premium dashboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen antialiased selection:bg-violet-500/30 selection:text-white">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Anton, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import { DraftDataProvider } from "@/lib/useDraftData";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--anton-font",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--plex-mono-font",
});

const inter = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--inter-font",
});

export const metadata: Metadata = {
  title: "Field Goal Seekers 2 — Draft Board",
  description: "Live fantasy football draft board",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${anton.variable} ${plexMono.variable} ${inter.variable}`}>
      <body>
        <DraftDataProvider>{children}</DraftDataProvider>
      </body>
    </html>
  );
}

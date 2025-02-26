import type { Metadata } from "next";

import "~/app/globals.css";
import { Providers } from "~/app/providers";

export const metadata: Metadata = {
  title: "Tic-Tac-Maxi",
  description: "Tic-Tac-Toe style game by @goldie and @themrsazon",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        {/* Preload game pieces first */}
        <link rel="preload" href="/scarygary.png" as="image" />
        <link rel="preload" href="/chili.png" as="image" />
        <link rel="preload" href="/maxi.png" as="image" />
        {/* Preload other critical assets */}
        <link rel="preload" href="/podplaylogo.png" as="image" />
        <link rel="preload" href="/game-board.png" as="image" />
        <link rel="preload" href="/sounds/openingtheme.mp3" as="audio" />
        <link rel="preload" href="/sounds/jingle.mp3" as="audio" />
        {/* Prefetch secondary assets */}
        <link rel="prefetch" href="/fantokenlogo.png" />
        <link rel="prefetch" href="/splash.png" />
        <link rel="prefetch" href="/sounds/click.mp3" />
      </head>
      <body className="overscroll-none">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import localFont from "next/font/local";

import "./globals.css";

// fonts are bundled with the app rather than fetched from Google at build time
const instrument = localFont({
  src: [
    { path: "../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2", style: "normal" },
    { path: "../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2", style: "italic" },
  ],
  weight: "400",
  variable: "--font-instrument",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "FinSight · Your bank statement, read properly", template: "%s · FinSight" },
  description:
    "Upload the PDF or CSV statement your bank already gives you. FinSight sorts every line, flags unusual charges and answers questions with exact figures. Built for OPay and Nigerian banks.",
  openGraph: {
    title: "FinSight · Your bank statement, read properly",
    description: "Sorted spending, highlighted charges and answers in exact naira.",
    images: ["/hero-statement.webp"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0eeeb" },
    { media: "(prefers-color-scheme: dark)", color: "#161614" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${instrument.variable}`}>
      <body>{children}</body>
    </html>
  );
}

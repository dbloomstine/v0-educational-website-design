import type React from "react"
import type { Metadata } from "next"
import { Inter, DM_Sans, Fraunces, JetBrains_Mono, Newsreader, Libre_Franklin } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { SignupSourceCapture } from "@/components/signup-source-capture"
import { SubscribePrompt } from "@/components/newsletter/SubscribePrompt"
import "./globals.css"

// FundOpsHQ Brand Fonts:
// - Inter        → body
// - DM Sans      → secondary headings (kept for backwards compat)
// - Fraunces     → editorial display (variable serif w/ optical sizing)
// - JetBrains Mono → financial-ticker numerals, timestamps, eyebrows
// `preload: false` on the three faces the public pages no longer use: they
// still load wherever they are asked for (Lead Desk, /brand), but a reader
// arriving on the front page is not made to download them first.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  preload: false,
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-dm-sans",
  preload: false,
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
  preload: false,
})

// The news pages (2026-10 redesign) are set like a newspaper: Newsreader for
// headlines, Libre Franklin for labels and UI. Applied inside `.paper` only
// (see globals.css), so Lead Desk and the admin pages keep Inter.
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: ["normal", "italic"],
  axes: ["opsz"],
})

const franklin = Libre_Franklin({
  subsets: ["latin"],
  variable: "--font-franklin",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://fundopshq.com'),
  title: {
    default: "FundOpsHQ — News & Daily Newsletter for the Investment Funds Industry",
    template: "%s | FundOpsHQ"
  },
  alternates: { types: { 'application/rss+xml': [{ url: '/feed.xml', title: 'FundOpsHQ' }] } },
  description:
    "FundOpsHQ is the hub for the investment funds industry — home to the FundOps Daily news feed and morning newsletter. Built for GPs, LPs, and the fund service providers working in and around private markets.",
  keywords: [
    "investment funds",
    "private markets",
    "fund news",
    "fund launches",
    "capital raises",
    "private equity",
    "venture capital",
    "private credit",
    "real estate funds",
    "infrastructure funds",
    "secondaries",
    "GP stakes",
    "LPs",
    "GPs",
    "FundOps Daily",
  ],
  authors: [{ name: "FundOpsHQ" }],
  creator: "FundOpsHQ",
  publisher: "FundOpsHQ",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://fundopshq.com',
    siteName: 'FundOpsHQ',
    title: 'FundOpsHQ — News & Daily Newsletter for the Investment Funds Industry',
    description: 'The hub for the investment funds industry. Home to the FundOps Daily news feed and morning newsletter — built for GPs, LPs, and fund service providers across private markets.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FundOpsHQ — News & Daily Newsletter for the Investment Funds Industry',
    description: 'The hub for the investment funds industry. Built for GPs, LPs, and fund service providers across private markets.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  verification: {
    // Add your verification codes when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${dmSans.variable} ${fraunces.variable} ${jetbrainsMono.variable} ${newsreader.variable} ${franklin.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:border-border focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: 'bg-card border-border text-card-foreground',
              title: 'text-foreground',
              description: 'text-muted-foreground',
              success: 'bg-green-950 border-green-800',
            }
          }}
        />
        <Analytics />
        <SignupSourceCapture />
        <SubscribePrompt />
      </body>
    </html>
  )
}

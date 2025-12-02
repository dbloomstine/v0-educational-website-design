import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

// <CHANGE> Using Inter for institutional feel
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL('https://fundops.com'),
  title: {
    default: "FundOpsHQ - Fund Operations Resources for Investment Professionals",
    template: "%s | FundOpsHQ"
  },
  description:
    "Comprehensive fund operations resources for CFOs, COOs, and operations professionals across Private Equity, Private Credit, Venture Capital, Hedge Funds, Real Estate, Infrastructure, Secondaries, and GP-Stakes funds.",
  keywords: [
    "fund operations",
    "private equity operations",
    "fund administration",
    "CFO",
    "fund compliance",
    "investor relations",
    "fund accounting",
    "venture capital operations",
    "hedge fund operations",
    "real estate fund operations"
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
    url: 'https://fundops.com',
    siteName: 'FundOpsHQ',
    title: 'FundOpsHQ - Fund Operations Resources for Investment Professionals',
    description: 'Comprehensive fund operations resources for CFOs, COOs, and operations professionals across all asset classes.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FundOpsHQ - Fund Operations Resources',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FundOpsHQ - Fund Operations Resources',
    description: 'Comprehensive fund operations resources for investment professionals across all asset classes.',
    images: ['/og-image.png'],
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
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:border-border focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to main content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

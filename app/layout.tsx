import type React from "react"
import type { Metadata } from "next"
import { Inter, DM_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import "./globals.css"

// FundOpsHQ Brand Fonts: DM Sans for headings, Inter for body
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-dm-sans"
})

export const metadata: Metadata = {
  metadataBase: new URL('https://fundops.com'),
  title: {
    default: "FundOpsHQ - Fund Operations Resources",
    template: "%s | FundOpsHQ"
  },
  description:
    "Articles and tools to help you learn fund operations. Covering PE, VC, hedge funds, private credit, real estate, infrastructure, and more.",
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
    title: 'FundOpsHQ - Fund Operations Resources',
    description: 'Articles and tools to help you learn fund operations across all asset classes.',
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
    description: 'Articles and tools to help you learn fund operations.',
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
      <body className={`${inter.variable} ${dmSans.variable} font-sans antialiased`}>
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
      </body>
    </html>
  )
}

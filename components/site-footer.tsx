import Link from "next/link"
import { Logo } from "@/components/logo"
import { ExternalLink } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 md:grid-cols-2">
          {/* Logo & About */}
          <div>
            <div className="mb-4">
              <Logo height={24} className="text-foreground" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              Conversations on fund operations—from the people who do it.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://www.linkedin.com/in/danny-bloomstine/" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors" aria-label="LinkedIn">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="https://www.youtube.com/playlist?list=PLZG9Q54lvPcZ-HOuVG61UzjoAtA8ZuewC" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors" aria-label="YouTube">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a href="https://open.spotify.com/show/6uuXUhmOA8Y2XPhWNr5oyz" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors" aria-label="Spotify">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </a>
              <a href="https://podcasts.apple.com/us/podcast/fundopshq/id1860384424" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors" aria-label="Apple Podcasts">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.34 0A5.328 5.328 0 000 5.34v13.32A5.328 5.328 0 005.34 24h13.32A5.328 5.328 0 0024 18.66V5.34A5.328 5.328 0 0018.66 0zm6.525 2.568c4.988 0 9.037 4.062 9.037 9.065 0 4.968-4.049 9.002-9.037 9.002-4.984 0-9.033-4.034-9.033-9.002 0-5.003 4.049-9.065 9.033-9.065zm-.013 3.154a5.883 5.883 0 00-5.88 5.886c0 1.71.756 3.246 1.944 4.311a6.333 6.333 0 01-.146-1.313c0-.839.165-1.64.463-2.378.31-.76.184-1.633-.326-2.236a2.628 2.628 0 01.583-3.925 2.612 2.612 0 013.64.58 2.63 2.63 0 01.581 1.645c0 .63-.221 1.21-.589 1.664-.51.603-.636 1.476-.326 2.236.298.738.463 1.54.463 2.378 0 .454-.05.896-.146 1.321a5.86 5.86 0 001.949-4.319 5.882 5.882 0 00-5.88-5.886zm-.013 4.457a1.4 1.4 0 00-1.396 1.4c0 .771.626 1.4 1.396 1.4.773 0 1.4-.629 1.4-1.4a1.4 1.4 0 00-1.4-1.4zm0 3.757c-.596 0-1.08.482-1.08 1.08v3.07c0 .596.484 1.08 1.08 1.08.599 0 1.08-.484 1.08-1.08v-3.07c0-.598-.481-1.08-1.08-1.08z"/>
                </svg>
              </a>
              <a href="https://www.tiktok.com/@dannybloomstine" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors" aria-label="TikTok">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/dannybloomstine/" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors" aria-label="Instagram">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a href="https://www.xiaohongshu.com/user/profile/6789c34b000000000d00bcf3" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors" aria-label="RedNote">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.767 7.029h-1.036c-.82 0-.978.39-.978 .962v1.262h1.955l-.254 1.974h-1.7v5.063h-2.04v-5.063H9.96v-1.974h1.753V7.794c0-1.738 1.062-2.684 2.612-2.684.743 0 1.381.055 1.567.08v1.84h-.125z"/>
                </svg>
              </a>
              <a href="https://facebook.com/profile.php?id=61579864313553" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors" aria-label="Facebook">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/interviews" className="text-muted-foreground hover:text-foreground transition-colors">
                  Watch
                </Link>
              </li>
              <li>
                <Link href="/guests" className="text-muted-foreground hover:text-foreground transition-colors">
                  Guests
                </Link>
              </li>
              <li>
                <Link href="/newsletter" className="text-muted-foreground hover:text-foreground transition-colors">
                  Newsletters
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-muted-foreground hover:text-foreground transition-colors">
                  News
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <a href="https://fundopshq-shop.myshopify.com/collections/all" className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1" target="_blank" rel="noopener noreferrer">
                  Shop
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Fund Types — hidden until articles are public */}
          {/* <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Fund Types</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/funds/private-equity" className="text-muted-foreground hover:text-foreground transition-colors">
                  Private Equity
                </Link>
              </li>
              <li>
                <Link href="/funds/private-credit" className="text-muted-foreground hover:text-foreground transition-colors">
                  Private Credit
                </Link>
              </li>
              <li>
                <Link href="/funds/venture-capital" className="text-muted-foreground hover:text-foreground transition-colors">
                  Venture Capital
                </Link>
              </li>
              <li>
                <Link href="/funds/hedge-funds" className="text-muted-foreground hover:text-foreground transition-colors">
                  Hedge Funds
                </Link>
              </li>
              <li>
                <Link href="/funds/real-estate" className="text-muted-foreground hover:text-foreground transition-colors">
                  Real Estate
                </Link>
              </li>
              <li>
                <Link href="/funds/infrastructure" className="text-muted-foreground hover:text-foreground transition-colors">
                  Infrastructure
                </Link>
              </li>
              <li>
                <Link href="/funds/secondaries" className="text-muted-foreground hover:text-foreground transition-colors">
                  Secondaries
                </Link>
              </li>
              <li>
                <Link href="/funds/gp-stakes" className="text-muted-foreground hover:text-foreground transition-colors">
                  GP-Stakes
                </Link>
              </li>
            </ul>
          </div> */}
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground space-y-2">
          <p>© {new Date().getFullYear()} FundOpsHQ. All rights reserved.</p>
          <p className="flex items-center justify-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <span className="text-border">|</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </p>
          <p>
            Built by <a href="https://www.linkedin.com/in/danny-bloomstine/" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary underline">Danny Bloomstine</a>
          </p>
        </div>
      </div>
    </footer>
  )
}

import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageHero } from '@/components/layout'

export const metadata: Metadata = {
  title: 'Chrome Extension Privacy Policy',
  description:
    'Privacy Policy for the FundOpsHQ News Chrome extension. Learn what data the extension accesses and how it is used.',
  openGraph: {
    title: 'Chrome Extension Privacy Policy - FundOpsHQ',
    description:
      'Privacy Policy for the FundOpsHQ News Chrome extension. Learn what data the extension accesses and how it is used.',
    type: 'website',
    url: 'https://fundopshq.com/privacy/extension',
  },
  twitter: {
    card: 'summary',
    title: 'Chrome Extension Privacy Policy - FundOpsHQ',
    description:
      'Privacy Policy for the FundOpsHQ News Chrome extension. Learn what data the extension accesses and how it is used.',
  },
  alternates: {
    canonical: 'https://fundopshq.com/privacy/extension',
  },
}

export default function ExtensionPrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <PageHero
          title="Chrome Extension Privacy Policy"
          subtitle="What the FundOpsHQ News extension does and does not collect"
        />

        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <div className="prose prose-invert prose-lg max-w-none">
                <p className="text-sm text-muted-foreground mb-12">Last updated: April 28, 2026</p>

                <div className="mb-12">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Overview</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    The FundOpsHQ News browser extension (the &quot;Extension&quot;) shows a red badge on
                    the Chrome toolbar when new articles appear in the public FundOpsHQ news feed. The
                    Extension is designed to do as little as possible: it does not require an account, does
                    not track you, and does not transmit any personal information to our servers or any third
                    party.
                  </p>
                </div>

                <div className="mb-12">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Information the Extension Accesses</h2>

                  <h3 className="text-xl font-semibold mb-3 mt-6">Public news feed</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    The Extension periodically requests the public FundOpsHQ news feed at{' '}
                    <code>https://fundopshq.com/api/news/feed</code>. This is the same feed that powers
                    the public homepage at fundopshq.com and is available without authentication. The
                    request includes only the filter parameters you have configured (asset class,
                    story type, fund-size minimum, keyword, date range, high-signal toggle). It does
                    not include any identifier for you.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">Filter preferences</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    The filter preferences you configure on the Extension&apos;s preferences page are
                    saved using the Chrome <code>storage.sync</code> API. If you are signed into Chrome,
                    these preferences may sync across your own devices via your Google account. They
                    are never transmitted to FundOpsHQ.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">Article cache</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    To compute the unread badge count, the Extension stores a list of article IDs you
                    have already seen, along with the most recent article metadata returned by the
                    feed. This data is kept in <code>chrome.storage.local</code> on your device and is
                    never transmitted to FundOpsHQ.
                  </p>
                </div>

                <div className="mb-12">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Information We Do Not Collect</h2>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Personally identifiable information of any kind</li>
                    <li>Browsing history outside of fundopshq.com</li>
                    <li>The contents of any web page you visit</li>
                    <li>Form data, keystrokes, mouse movements, or input</li>
                    <li>Cookies or any cross-site tracking identifiers</li>
                    <li>Any data sent to advertisers or analytics providers</li>
                  </ul>
                </div>

                <div className="mb-12">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Permissions</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Chrome may show the following permission prompts when you install the Extension:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>
                      <strong>storage</strong> — used to cache your filter preferences and the list of
                      article IDs you have already seen.
                    </li>
                    <li>
                      <strong>alarms</strong> — used to schedule a periodic background poll of the
                      public news feed (every 10 minutes).
                    </li>
                    <li>
                      <strong>Read your data on fundopshq.com</strong> — used to call the public
                      <code>/api/news/feed</code> endpoint. The Extension does not read or modify the
                      contents of any page on fundopshq.com or any other site.
                    </li>
                  </ul>
                </div>

                <div className="mb-12">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Data Sharing</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    The Extension does not share any data with third parties. There are no analytics,
                    no advertising SDKs, and no remote code execution.
                  </p>
                </div>

                <div className="mb-12">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Removing the Extension</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Uninstalling the Extension via <code>chrome://extensions</code> deletes all data
                    that the Extension stored on your device, including filter preferences and the
                    article cache.
                  </p>
                </div>

                <div className="mb-12">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Contact</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Questions about this policy can be sent to{' '}
                    <a
                      href="mailto:danny.bloomstine@iqeq.com"
                      className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
                    >
                      danny.bloomstine@iqeq.com
                    </a>
                    . For the website&apos;s general privacy policy, see{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      fundopshq.com/privacy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

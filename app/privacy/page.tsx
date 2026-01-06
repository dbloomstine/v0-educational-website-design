import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageHero } from '@/components/layout'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for FundOpsHQ. Learn how we collect, use, and protect your information.',
  openGraph: {
    title: 'Privacy Policy - FundOpsHQ',
    description: 'Privacy Policy for FundOpsHQ. Learn how we collect, use, and protect your information.',
    type: 'website',
    url: 'https://fundops.com/privacy',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy - FundOpsHQ',
    description: 'Privacy Policy for FundOpsHQ. Learn how we collect, use, and protect your information.',
  },
  alternates: {
    canonical: 'https://fundops.com/privacy',
  },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <PageHero
          title="Privacy Policy"
          subtitle="How we collect, use, and protect your information"
        />

        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <div className="prose prose-invert prose-lg max-w-none">
                <p className="text-sm text-muted-foreground mb-12">
                  Last updated: January 6, 2025
                </p>

                {/* Introduction */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Introduction</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    FundOpsHQ (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
                    This Privacy Policy explains how we collect, use, and safeguard your information when you visit
                    our website at fundops.com (the &quot;Site&quot;). We believe in minimal data collection and transparency
                    about the data we do collect.
                  </p>
                </div>

                {/* Data Collection */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Information We Collect</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We collect minimal information to operate and improve our Site. The information we collect includes:
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">Analytics Data</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We use Vercel Analytics to understand how visitors interact with our Site. This service collects:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                    <li>Page views and navigation patterns</li>
                    <li>Referring websites</li>
                    <li>Device type and browser information</li>
                    <li>Geographic region (country level)</li>
                    <li>Performance metrics (page load times)</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    Vercel Analytics is privacy-focused and does not use cookies for tracking. It does not collect
                    personally identifiable information or track individual users across sessions.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">Newsletter Signup</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    If you choose to subscribe to our newsletter, we collect your email address. This is entirely
                    optional and is the only personal information we actively request from visitors.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">Local Storage</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Some of our interactive tools use your browser&apos;s local storage to save your preferences and
                    progress (such as calculator inputs). This data is stored only on your device and is never
                    transmitted to our servers.
                  </p>
                </div>

                {/* Cookies */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Cookies</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Our Site uses minimal cookies. Vercel Analytics does not use cookies for tracking purposes.
                    We may use essential cookies that are necessary for the Site to function properly, such as:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Session cookies for basic site functionality</li>
                    <li>Security cookies to prevent cross-site request forgery</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    We do not use advertising cookies or third-party tracking cookies.
                  </p>
                </div>

                {/* How We Use Information */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">How We Use Your Information</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We use the information we collect for the following purposes:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>To understand how visitors use our Site and improve our content</li>
                    <li>To send newsletter updates to subscribers who have opted in</li>
                    <li>To ensure the security and proper functioning of our Site</li>
                    <li>To respond to inquiries or requests from users</li>
                  </ul>
                </div>

                {/* Email List Management */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Email List Management</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    If you subscribe to our newsletter:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>We will only send you content related to fund operations and Site updates</li>
                    <li>We will never sell, rent, or share your email address with third parties for marketing purposes</li>
                    <li>Every email includes an unsubscribe link to opt out at any time</li>
                    <li>You can request deletion of your email from our list at any time by contacting us</li>
                  </ul>
                </div>

                {/* Third-Party Services */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Third-Party Services</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We use the following third-party services to operate our Site:
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">Vercel</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Our Site is hosted on Vercel. Vercel may collect server logs that include IP addresses and
                    request information for security and operational purposes. For more information, see{' '}
                    <a
                      href="https://vercel.com/legal/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
                    >
                      Vercel&apos;s Privacy Policy
                    </a>.
                  </p>

                  <h3 className="text-xl font-semibold mb-3 mt-6">Vercel Analytics</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We use Vercel Analytics to collect anonymous usage data. Vercel Analytics is designed with
                    privacy in mind and does not use cookies or collect personally identifiable information.
                  </p>
                </div>

                {/* Data Retention */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Data Retention</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    We retain data for different periods depending on the type:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li><strong>Analytics data:</strong> Retained by Vercel according to their data retention policies</li>
                    <li><strong>Email addresses:</strong> Retained until you unsubscribe or request deletion</li>
                    <li><strong>Local storage data:</strong> Remains on your device until you clear it</li>
                  </ul>
                </div>

                {/* GDPR Rights */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Your Rights (GDPR)</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    If you are located in the European Economic Area (EEA), you have certain rights under the
                    General Data Protection Regulation (GDPR). These include:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li><strong>Right to Access:</strong> You can request a copy of the personal data we hold about you</li>
                    <li><strong>Right to Rectification:</strong> You can request correction of inaccurate personal data</li>
                    <li><strong>Right to Erasure:</strong> You can request deletion of your personal data</li>
                    <li><strong>Right to Restrict Processing:</strong> You can request that we limit how we use your data</li>
                    <li><strong>Right to Data Portability:</strong> You can request a copy of your data in a machine-readable format</li>
                    <li><strong>Right to Object:</strong> You can object to our processing of your personal data</li>
                    <li><strong>Right to Withdraw Consent:</strong> If you have given consent, you can withdraw it at any time</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed mt-4">
                    To exercise any of these rights, please contact us using the information below. We will respond
                    to your request within 30 days.
                  </p>
                </div>

                {/* Data Security */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Data Security</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We take reasonable measures to protect the information we collect. Our Site is served over
                    HTTPS to ensure data transmitted between your browser and our servers is encrypted. However,
                    no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                  </p>
                </div>

                {/* Children's Privacy */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Children&apos;s Privacy</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Our Site is not directed at children under the age of 13. We do not knowingly collect personal
                    information from children under 13. If you believe we have collected information from a child
                    under 13, please contact us immediately.
                  </p>
                </div>

                {/* Changes to Policy */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Changes to This Policy</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We may update this Privacy Policy from time to time. When we make changes, we will update the
                    &quot;Last updated&quot; date at the top of this page. We encourage you to review this Privacy Policy
                    periodically to stay informed about how we are protecting your information.
                  </p>
                </div>

                {/* Contact Information */}
                <div className="mb-12">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Contact Us</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    If you have any questions about this Privacy Policy, your personal data, or would like to
                    exercise your rights, please contact us at:
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    <a
                      href="mailto:danny.bloomstine@iqeq.com"
                      className="text-foreground underline underline-offset-4 hover:text-muted-foreground"
                    >
                      danny.bloomstine@iqeq.com
                    </a>
                  </p>
                </div>

                {/* Back to Home */}
                <div className="pt-8 border-t border-border">
                  <Link
                    href="/"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    &larr; Back to Home
                  </Link>
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

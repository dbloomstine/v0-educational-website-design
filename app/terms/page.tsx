import { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageHero } from '@/components/layout'

export const metadata: Metadata = {
  title: 'Terms of Service - FundOpsHQ',
  description: 'Terms of Service for FundOpsHQ. Read about the terms and conditions governing your use of our educational fund operations resources.',
  openGraph: {
    title: 'Terms of Service - FundOpsHQ',
    description: 'Terms of Service for FundOpsHQ educational resources.',
    type: 'website',
    url: 'https://fundops.com/terms',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service - FundOpsHQ',
    description: 'Terms of Service for FundOpsHQ educational resources.',
  },
  alternates: {
    canonical: 'https://fundops.com/terms',
  },
}

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main-content" className="flex-1">
        <PageHero
          title="Terms of Service"
          subtitle="Please read these terms carefully before using FundOpsHQ."
        />

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <p className="text-sm text-muted-foreground mb-12">
                Last Updated: January 6, 2025
              </p>

              <div className="prose prose-invert prose-lg max-w-none space-y-12">
                {/* Acceptance of Terms */}
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-4">1. Acceptance of Terms</h2>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                      By accessing or using FundOpsHQ (the &quot;Site&quot;), you agree to be bound by these Terms of Service
                      (&quot;Terms&quot;). If you do not agree to all of these Terms, you may not access or use the Site.
                    </p>
                    <p>
                      Your continued use of the Site following any changes to these Terms constitutes your acceptance
                      of such changes. We encourage you to review these Terms periodically.
                    </p>
                  </div>
                </div>

                {/* Educational Purpose Disclaimer */}
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-4">2. Educational Purpose Disclaimer</h2>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                      <strong className="text-foreground">FundOpsHQ is an educational resource only.</strong> All content,
                      articles, guides, tools, and materials provided on this Site are intended solely for general
                      informational and educational purposes.
                    </p>
                    <p>
                      The information on this Site does NOT constitute:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Professional financial advice</li>
                      <li>Legal advice or legal opinions</li>
                      <li>Tax advice or tax planning recommendations</li>
                      <li>Investment advice or investment recommendations</li>
                      <li>Accounting advice</li>
                      <li>Any other form of professional advice</li>
                    </ul>
                    <p>
                      You should always consult with qualified professionals—including licensed attorneys, certified
                      public accountants, registered investment advisors, and other appropriate advisors—before making
                      any financial, legal, tax, or business decisions. The information provided on this Site should
                      not be used as a substitute for professional advice tailored to your specific situation.
                    </p>
                  </div>
                </div>

                {/* Use of Interactive Tools */}
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-4">3. Use of Interactive Tools</h2>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                      FundOpsHQ provides various interactive tools, calculators, and visualizers (collectively, &quot;Tools&quot;)
                      for educational and illustrative purposes only. These Tools are designed to help you understand
                      concepts related to fund operations and are not intended to provide precise calculations for
                      actual business decisions.
                    </p>
                    <p>
                      You acknowledge and agree that:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        Tool outputs are simplified illustrations and may not reflect the complexity of real-world scenarios
                      </li>
                      <li>
                        Results generated by Tools should not be relied upon for actual financial planning, reporting,
                        or decision-making
                      </li>
                      <li>
                        Tools may use assumptions, simplifications, or methodologies that differ from industry standards
                        or your specific circumstances
                      </li>
                      <li>
                        Any data you enter into Tools is processed locally in your browser and is your responsibility
                        to verify for accuracy
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Intellectual Property */}
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-4">4. Intellectual Property</h2>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                      All content on this Site, including but not limited to text, articles, graphics, logos, icons,
                      images, audio clips, digital downloads, data compilations, software, and the compilation thereof,
                      is the property of FundOpsHQ or its content suppliers and is protected by United States and
                      international copyright laws.
                    </p>
                    <p>
                      You may access, view, and print content from this Site for your personal, non-commercial,
                      educational use only. You may not:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Reproduce, distribute, or publicly display any content without prior written permission</li>
                      <li>Modify or create derivative works based on Site content</li>
                      <li>Use any content for commercial purposes without authorization</li>
                      <li>Remove any copyright, trademark, or other proprietary notices</li>
                    </ul>
                  </div>
                </div>

                {/* User Responsibilities */}
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-4">5. User Responsibilities</h2>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                      As a user of this Site, you agree to:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Use the Site only for lawful purposes and in accordance with these Terms</li>
                      <li>
                        Not attempt to gain unauthorized access to any portion of the Site, other accounts, computer
                        systems, or networks connected to the Site
                      </li>
                      <li>
                        Not use any automated means, including robots, spiders, or scrapers, to access the Site for
                        any purpose without our express written permission
                      </li>
                      <li>
                        Not interfere with or disrupt the Site or servers or networks connected to the Site
                      </li>
                      <li>
                        Verify any information obtained from the Site before relying on it for any purpose
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Limitation of Liability */}
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-4">6. Limitation of Liability</h2>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                      TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, FUNDOPSHQ AND ITS OWNER, OPERATOR, AFFILIATES,
                      AND THEIR RESPECTIVE OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY
                      INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Loss of profits, revenue, or business opportunities</li>
                      <li>Loss of data or goodwill</li>
                      <li>Cost of procurement of substitute services</li>
                      <li>Any damages arising from your use of or inability to use the Site</li>
                      <li>Any damages arising from reliance on any content or information obtained from the Site</li>
                    </ul>
                    <p>
                      This limitation applies regardless of the legal theory upon which such damages are sought,
                      whether in contract, tort, negligence, strict liability, or otherwise, even if FundOpsHQ has
                      been advised of the possibility of such damages.
                    </p>
                  </div>
                </div>

                {/* Disclaimer of Warranties */}
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-4">7. Disclaimer of Warranties</h2>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                      THE SITE AND ALL CONTENT, TOOLS, AND SERVICES PROVIDED THEREON ARE PROVIDED &quot;AS IS&quot; AND &quot;AS
                      AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                    </p>
                    <p>
                      TO THE FULLEST EXTENT PERMITTED BY LAW, FUNDOPSHQ DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED,
                      INCLUDING BUT NOT LIMITED TO:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Implied warranties of merchantability and fitness for a particular purpose</li>
                      <li>Warranties of title and non-infringement</li>
                      <li>Warranties that the Site will be uninterrupted, timely, secure, or error-free</li>
                      <li>Warranties regarding the accuracy, reliability, or completeness of any content</li>
                      <li>Warranties that defects will be corrected</li>
                    </ul>
                    <p>
                      FundOpsHQ does not warrant that the results obtained from using the Site or any Tools will be
                      accurate or reliable, or that the quality of any content will meet your expectations.
                    </p>
                  </div>
                </div>

                {/* Indemnification */}
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-4">8. Indemnification</h2>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                      You agree to indemnify, defend, and hold harmless FundOpsHQ and its owner, operator, affiliates,
                      and their respective officers, directors, employees, agents, licensors, and suppliers from and
                      against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees
                      (including reasonable attorneys&apos; fees) arising out of or relating to:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Your violation of these Terms</li>
                      <li>Your use of the Site or any content obtained from the Site</li>
                      <li>Your violation of any third-party rights, including intellectual property rights</li>
                      <li>Any claim that your use of the Site caused damage to a third party</li>
                    </ul>
                  </div>
                </div>

                {/* Governing Law */}
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-4">9. Governing Law</h2>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                      These Terms and your use of the Site shall be governed by and construed in accordance with
                      the laws of the State of New York, United States, without regard to its conflict of law principles.
                    </p>
                    <p>
                      Any legal action or proceeding arising out of or relating to these Terms or your use of the
                      Site shall be brought exclusively in the federal or state courts located in New York County,
                      New York, and you consent to the personal jurisdiction of such courts.
                    </p>
                  </div>
                </div>

                {/* Changes to Terms */}
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-4">10. Changes to Terms</h2>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                      FundOpsHQ reserves the right to modify or replace these Terms at any time at our sole discretion.
                      If we make material changes to these Terms, we will update the &quot;Last Updated&quot; date at the top
                      of this page.
                    </p>
                    <p>
                      Your continued use of the Site after any such changes constitutes your acceptance of the new
                      Terms. If you do not agree to the modified Terms, you should discontinue your use of the Site.
                    </p>
                  </div>
                </div>

                {/* Severability */}
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-4">11. Severability</h2>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                      If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court
                      of competent jurisdiction, such provision shall be modified to the minimum extent necessary
                      to make it valid and enforceable, or if modification is not possible, shall be severed from
                      these Terms. The remaining provisions shall continue in full force and effect.
                    </p>
                  </div>
                </div>

                {/* Entire Agreement */}
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-4">12. Entire Agreement</h2>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                      These Terms, together with our <Link href="/privacy" className="text-foreground underline underline-offset-4 hover:text-primary">Privacy Policy</Link>,
                      constitute the entire agreement between you and FundOpsHQ regarding your use of the Site and
                      supersede all prior and contemporaneous agreements, representations, warranties, and understandings.
                    </p>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-4">13. Contact Information</h2>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                      If you have any questions about these Terms of Service, please contact us at:
                    </p>
                    <p>
                      <a
                        href="mailto:danny.bloomstine@iqeq.com"
                        className="text-foreground underline underline-offset-4 hover:text-primary"
                      >
                        danny.bloomstine@iqeq.com
                      </a>
                    </p>
                  </div>
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

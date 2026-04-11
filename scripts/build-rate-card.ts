#!/usr/bin/env npx tsx
/**
 * Build the FundOps Daily sponsorship rate card as a standalone HTML
 * one-pager. Matches the newsletter's editorial brand (navy / cream /
 * amber / Georgia / mono) so it reads as a natural extension of the
 * product when a prospect opens it.
 *
 * Output is self-contained and print-friendly — Cmd+P in Chrome to
 * save as a PDF, or attach the HTML directly to an email.
 *
 * Usage:
 *   npx tsx scripts/build-rate-card.ts
 */

import { writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const OUTPUT_PATH = '/tmp/fundopshq-rate-card.html'

const NAVY = '#1E3A5F'
const NAVY_DEEP = '#0F1E33'
const CREAM = '#F8F5EC'
const AMBER = '#E6B045'
const INK = '#1E3A5F'
const INK_MUTED = '#5A6B82'
const HAIRLINE = '#D8D0BC'

const FONT_SERIF = `Georgia, 'Times New Roman', Times, serif`
const FONT_SANS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif`
const FONT_MONO = `ui-monospace, Menlo, Consolas, 'Courier New', monospace`

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FundOps Daily — Sponsorship Rate Card · Q2 2026</title>
  <style>
    @page { size: letter; margin: 0; }
    @media print {
      body { background: ${CREAM}; }
      .page { box-shadow: none; margin: 0; }
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      padding: 40px 20px;
      background: ${NAVY_DEEP};
      font-family: ${FONT_SANS};
      color: ${INK};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .page {
      max-width: 780px;
      margin: 0 auto;
      background: ${CREAM};
      box-shadow: 0 20px 60px -10px rgba(0,0,0,0.4);
    }

    /* ─── Masthead ─── */
    .masthead {
      background: ${NAVY};
      padding: 0;
    }
    .masthead-strip {
      padding: 16px 48px;
      border-bottom: 1px solid rgba(248,245,236,0.18);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .masthead-strip .eyebrow {
      font-family: ${FONT_MONO};
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      color: rgba(248,245,236,0.7);
      text-transform: uppercase;
    }
    .masthead-strip .eyebrow.amber { color: ${AMBER}; }
    .masthead-wordmark {
      padding: 28px 48px 26px;
      font-family: ${FONT_SERIF};
      font-size: 40px;
      font-weight: 700;
      letter-spacing: -0.5px;
      line-height: 1;
    }
    .masthead-wordmark .cream { color: ${CREAM}; }
    .masthead-wordmark .amber { color: ${AMBER}; font-style: italic; }
    .masthead-bottom {
      padding: 16px 48px;
      border-top: 1px solid rgba(248,245,236,0.18);
      font-family: ${FONT_MONO};
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      color: rgba(248,245,236,0.6);
      text-transform: uppercase;
      display: flex;
      justify-content: space-between;
    }
    .masthead-bottom .amber { color: ${AMBER}; }

    /* ─── Content sections ─── */
    .body {
      padding: 44px 48px 32px;
    }
    .body .eyebrow {
      font-family: ${FONT_MONO};
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 2px;
      color: ${INK_MUTED};
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .body h1 {
      margin: 0 0 24px;
      font-family: ${FONT_SERIF};
      font-size: 36px;
      font-weight: 700;
      color: ${INK};
      line-height: 1.15;
      letter-spacing: -0.3px;
    }
    .body h1 .amber {
      font-style: italic;
      color: ${AMBER};
    }
    .body h2 {
      margin: 0 0 16px;
      font-family: ${FONT_SERIF};
      font-size: 22px;
      font-weight: 700;
      color: ${INK};
      line-height: 1.25;
    }
    .body p {
      margin: 0 0 14px;
      font-size: 15px;
      line-height: 1.7;
      color: ${INK};
    }
    .body ul {
      margin: 0 0 24px;
      padding-left: 22px;
    }
    .body ul li {
      margin-bottom: 10px;
      font-size: 15px;
      line-height: 1.6;
      color: ${INK};
    }
    .body strong { color: ${INK}; font-weight: 700; }

    /* ─── Hero section ─── */
    .hero {
      padding-bottom: 28px;
      border-bottom: 1px solid ${HAIRLINE};
      margin-bottom: 32px;
    }
    .hero .lede {
      font-size: 16px;
      line-height: 1.65;
      color: ${INK};
      max-width: 620px;
    }

    /* ─── Section block ─── */
    .section {
      margin-bottom: 32px;
      padding-bottom: 28px;
      border-bottom: 1px solid ${HAIRLINE};
    }
    .section:last-child { border-bottom: none; }

    /* ─── Pricing table ─── */
    .pricing {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0 8px;
      font-family: ${FONT_SANS};
    }
    .pricing th {
      font-family: ${FONT_MONO};
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: ${INK_MUTED};
      text-transform: uppercase;
      text-align: left;
      padding: 10px 14px;
      border-bottom: 2px solid ${INK};
    }
    .pricing th.right { text-align: right; }
    .pricing td {
      padding: 16px 14px;
      border-bottom: 1px solid ${HAIRLINE};
      vertical-align: middle;
      font-size: 15px;
      line-height: 1.4;
    }
    .pricing tr:last-child td { border-bottom: none; }
    .pricing .label {
      font-family: ${FONT_SERIF};
      font-size: 18px;
      font-weight: 700;
      color: ${INK};
    }
    .pricing .detail {
      font-family: ${FONT_MONO};
      font-size: 11px;
      color: ${INK_MUTED};
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .pricing .price {
      font-family: ${FONT_SERIF};
      font-size: 22px;
      font-weight: 700;
      color: ${INK};
      text-align: right;
      white-space: nowrap;
    }
    .pricing .price .per {
      font-family: ${FONT_MONO};
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      color: ${INK_MUTED};
      text-transform: uppercase;
      display: block;
      margin-top: 2px;
    }
    .pricing tr.featured {
      background: rgba(230,176,69,0.12);
    }
    .pricing tr.featured td:first-child {
      border-left: 3px solid ${AMBER};
    }
    .pricing .tag {
      display: inline-block;
      font-family: ${FONT_MONO};
      font-size: 9px;
      font-weight: 700;
      padding: 3px 7px;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      background: ${AMBER};
      color: ${NAVY};
      border-radius: 2px;
      margin-left: 8px;
      vertical-align: middle;
    }

    /* ─── Audience callout ─── */
    .callout {
      border-left: 3px solid ${AMBER};
      padding: 4px 0 4px 18px;
      margin: 18px 0 4px;
    }
    .callout p { margin: 0; }
    .callout strong { color: ${INK}; }

    /* ─── Contact footer ─── */
    .contact-block {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px;
      background: ${NAVY};
      color: ${CREAM};
      margin-top: 12px;
      border-radius: 2px;
    }
    .contact-photo {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: ${AMBER};
      border: 3px solid ${AMBER};
      flex-shrink: 0;
    }
    .contact-info .name {
      font-family: ${FONT_SERIF};
      font-size: 20px;
      font-weight: 700;
      color: ${CREAM};
      line-height: 1.2;
    }
    .contact-info .title {
      font-family: ${FONT_MONO};
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 2px;
      color: rgba(248,245,236,0.65);
      text-transform: uppercase;
      margin: 4px 0 10px;
    }
    .contact-info .meta {
      font-family: ${FONT_MONO};
      font-size: 11px;
      color: ${AMBER};
      letter-spacing: 1px;
      line-height: 1.6;
    }
    .contact-info .meta a {
      color: ${AMBER};
      text-decoration: none;
    }

    /* ─── Footer ─── */
    .footer {
      background: ${NAVY_DEEP};
      padding: 18px 48px;
      font-family: ${FONT_MONO};
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 2px;
      color: rgba(248,245,236,0.45);
      text-transform: uppercase;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- ─── Masthead ─── -->
    <div class="masthead">
      <div class="masthead-strip">
        <span class="eyebrow">Vol. I &nbsp;·&nbsp; Q2 2026</span>
        <span class="eyebrow amber">Rate Card</span>
      </div>
      <div class="masthead-wordmark">
        <span class="cream">FundOps</span><span class="amber">Daily</span>
      </div>
      <div class="masthead-bottom">
        <span>Sponsorship Opportunities</span>
        <span class="amber">FUNDOPSHQ.COM</span>
      </div>
    </div>

    <!-- ─── Body ─── -->
    <div class="body">

      <!-- Hero -->
      <div class="hero">
        <div class="eyebrow">The Offer</div>
        <h1>Sponsor the <span class="amber">morning brief.</span></h1>
        <p class="lede">
          FundOps Daily is the editorial morning brief for <strong>GPs, LPs, and fund service providers</strong> working in and around private markets — sent every morning before 6am ET, covering fund launches, closes, LP commitments, exec moves, and M&amp;A across PE, VC, credit, real estate, infrastructure, and hedge. Small but sharply targeted. Recent subscribers include folks at First Citizens, SVB, DLA Piper, Petra Funds, and With Intelligence.
        </p>
      </div>

      <!-- Format -->
      <div class="section">
        <div class="eyebrow">Format</div>
        <h2>What a sponsorship looks like</h2>
        <ul>
          <li><strong>Co-sponsor model.</strong> A small group of 3–5 brands presented together in each edition, on equal footing. No single-brand takeover — your logo sits alongside other sponsors under a shared &ldquo;Presented By&rdquo; block.</li>
          <li><strong>Top and bottom placement.</strong> Your brand runs in both the presenting-sponsor block under the masthead and the expanded sponsor block above the footer — double exposure in every edition you&rsquo;re in.</li>
          <li><strong>Full sponsor card.</strong> Wordmark or logo, 2–3 sentence blurb, and a click-through CTA button (e.g. &ldquo;See open roles&rdquo;) landing on your destination URL of choice.</li>
          <li><strong>Editorial context.</strong> Presented inside a full morning brief of fund news — reader attention is already engaged when your message arrives.</li>
        </ul>
      </div>

      <!-- Pricing -->
      <div class="section">
        <div class="eyebrow">Launch Partner Rates &nbsp;·&nbsp; Q2 2026</div>
        <h2>Pricing</h2>
        <table class="pricing">
          <thead>
            <tr>
              <th>Package</th>
              <th>Cadence</th>
              <th class="right">Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div class="label">2-Week Run</div>
                <div class="detail">10 editions &middot; Tue–Sat</div>
              </td>
              <td class="detail">Entry</td>
              <td class="price">$1,500<span class="per">flat</span></td>
            </tr>
            <tr class="featured">
              <td>
                <div class="label">Monthly <span class="tag">Recommended</span></div>
                <div class="detail">20 editions &middot; full calendar month</div>
              </td>
              <td class="detail">Standard</td>
              <td class="price">$2,500<span class="per">/ month</span></td>
            </tr>
            <tr>
              <td>
                <div class="label">Quarterly</div>
                <div class="detail">60 editions &middot; 3 consecutive months</div>
              </td>
              <td class="detail">Best value</td>
              <td class="price">$5,000<span class="per">/ quarter</span></td>
            </tr>
            <tr>
              <td>
                <div class="label">FundOpsHQ Live bundle</div>
                <div class="detail">Add-on to any package above</div>
              </td>
              <td class="detail">Add-on</td>
              <td class="price">+ $1,500<span class="per">per cycle</span></td>
            </tr>
          </tbody>
        </table>
        <p style="font-size:13px;color:${INK_MUTED};margin-top:12px;line-height:1.6;">
          The Live bundle includes a verbal sponsor mention, a lower-third brand ID during the broadcast, and a show-notes link on YouTube and fundopshq.com for every episode in the cycle.
        </p>
      </div>

      <!-- Launch partner framing -->
      <div class="section">
        <div class="eyebrow">Why Now</div>
        <h2>Launch partner positioning</h2>
        <p>
          The rates above are the <strong>launch partner</strong> tier for the first five sponsors of FundOps Daily. Once the subscriber list crosses ~300 — currently growing steadily week over week — standard rates move up approximately 50%. Early sponsors lock in the launch rate for the full duration of their first contract, with right of first refusal on renewal at the same rate.
        </p>
        <div class="callout">
          <p>
            Launch partners are the brands their customers will remember as <strong>&ldquo;the ones who backed FundOpsHQ when it started.&rdquo;</strong> There are five slots at this tier and they will move quickly.
          </p>
        </div>
      </div>

      <!-- Contact -->
      <div class="section" style="border-bottom:none;padding-bottom:0;margin-bottom:0;">
        <div class="eyebrow">To Book</div>
        <h2>Let&rsquo;s talk</h2>
        <p>
          I respond personally to every inquiry, and I&rsquo;m happy to walk you through a recent edition on a 15-minute call before you commit to anything.
        </p>
        <div class="contact-block">
          <img class="contact-photo" src="https://fundopshq.com/danny-headshot-nobg.png" alt="Danny Bloomstine" width="68" height="68" />
          <div class="contact-info">
            <div class="name">Danny Bloomstine</div>
            <div class="title">Founder &middot; FundOpsHQ</div>
            <div class="meta">
              <a href="mailto:dbloomstine@gmail.com">dbloomstine@gmail.com</a><br>
              <a href="https://fundopshq.com">fundopshq.com</a>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ─── Footer ─── -->
    <div class="footer">
      FundOpsDaily &nbsp;·&nbsp; by FundOpsHQ &nbsp;·&nbsp; News &middot; Newsletter &middot; Live Show
    </div>

  </div>
</body>
</html>`

writeFileSync(OUTPUT_PATH, html, 'utf8')
console.log(`Wrote ${OUTPUT_PATH} (${(html.length / 1024).toFixed(1)} KB)`)

try {
  execSync(`open "${OUTPUT_PATH}"`)
  console.log('Opened in default browser.')
} catch {
  console.log(`Open manually: file://${OUTPUT_PATH}`)
}

/**
 * The seasonal O drawn inside the wordmark (lib/seasonal.ts). All four are in every logo, hidden; the CSS in
 * globals.css shows the one whose season <html data-season> names, and hides the plain O. The colours come from
 * <SeasonalDefs/>, defined once in the layout, so a logo drawn three times on a page does not repeat its ids.
 */
export function SeasonalO() {
  return (
    <>
      <g className="wm-season wm-halloween" transform="translate(132.8 35.4) scale(1.13) translate(-132.8 -35.4)">
        <ellipse cx="123.6" cy="21.6" rx="10.2" ry="13.4" fill="url(#fq-pks)" />
        <ellipse cx="142" cy="21.6" rx="10.2" ry="13.4" fill="url(#fq-pks)" />
        <ellipse cx="132.8" cy="21.4" rx="11.6" ry="13.9" fill="url(#fq-pk)" />
        <path d="M127.2 9.6 Q125 21.5 127.4 33.6" stroke="#B85A16" strokeOpacity=".45" strokeWidth=".8" fill="none" />
        <path d="M138.4 9.6 Q140.6 21.5 138.2 33.6" stroke="#B85A16" strokeOpacity=".45" strokeWidth=".8" fill="none" />
        <path d="M131.2 9.2 C131 5.6 132.2 2.6 135 0.4 L137.2 1.9 C135.3 3.7 134.6 6.1 134.7 9.2 Z" fill="#5E6B2E" />
        <path d="M135.6 3.2 C139 1.6 141.6 3.2 141 5.6 C140.4 4.2 138.6 3.6 136.6 4.6" fill="none" stroke="#5E6B2E" strokeWidth=".9" strokeLinecap="round" />
        <g className="wm-face" filter="url(#fq-glow)" fill="url(#fq-fire)" stroke="#7A3510" strokeWidth=".55" strokeLinejoin="round">
          <path d="M124 20 L128.2 13.2 L131.4 20 Z" />
          <path className="wm-eye" d="M134.2 20 L137.4 13.2 L141.6 20 Z" />
          <path className="wm-wink" d="M134.6 18 Q137.8 14.6 141 18" fill="none" stroke="url(#fq-fire)" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M123.8 23.4 Q132.8 32.4 141.8 23.4 Q139.6 25.6 137.8 25.4 L136.8 27.6 L134.8 25.8 Q132.8 26.4 130.8 25.8 L128.8 27.6 L127.8 25.4 Q126 25.6 123.8 23.4 Z" />
        </g>
      </g>
      <g className="wm-season wm-thanksgiving">
        <g transform="rotate(-12 132.8 18)">
          <path d="M132.8 1.5 L135.6 8.6 L141.6 5.4 L140.2 12.2 L148 12.6 L143.4 17.6 L148.6 22 L141 23 L142 30 L135 26.4 L133.6 34.6 L132 26.4 L125 30 L126 23 L118.4 22 L123.6 17.6 L119 12.6 L126.8 12.2 L125.4 5.4 L131.4 8.6 Z" fill="url(#fq-leaf)" />
          <path d="M133.3 34.6 L132.8 12 M132.9 20 L127 14.5 M132.9 20 L138.8 14.5 M133 26 L127.5 22.5 M133 26 L138.5 22.5" stroke="#8A3216" strokeOpacity=".55" strokeWidth=".7" fill="none" strokeLinecap="round" />
          <path d="M133.3 34.6 Q133.6 37.5 135.6 39" stroke="#7A4A1E" strokeWidth="1" fill="none" strokeLinecap="round" />
        </g>
      </g>
      <g className="wm-season wm-hanukkah">
        <circle cx="132.8" cy="17.8" r="16.6" fill="#8C5A12" />
        <circle cx="132.8" cy="17.4" r="16.4" fill="url(#fq-gold)" />
        <circle cx="132.8" cy="17.4" r="13.4" fill="none" stroke="#A9701A" strokeOpacity=".6" strokeWidth=".9" />
        <g fill="none" stroke="#9C6410" strokeWidth="1.5" strokeLinejoin="round" opacity=".85">
          <path d="M132.8 9.6 L139.6 21.4 L126 21.4 Z" />
          <path d="M132.8 25.2 L126 13.4 L139.6 13.4 Z" />
        </g>
        <ellipse cx="127" cy="10" rx="4.5" ry="2.2" fill="#FFF8D8" opacity=".55" transform="rotate(-30 127 10)" />
      </g>
      <g className="wm-season wm-christmas">
        <path d="M132.8 -6 L132.8 0.6" stroke="#C9B48A" strokeWidth=".8" />
        <rect x="129.6" y="0.4" width="6.4" height="4" rx="1" fill="url(#fq-gold)" />
        <circle cx="132.8" cy="19.6" r="15.6" fill="url(#fq-orn)" />
        <path d="M118.2 18.4 Q132.8 23.4 147.4 18.4" stroke="#E6B045" strokeWidth="1.6" fill="none" />
        <path d="M119.4 24.6 Q132.8 29.4 146.2 24.6" stroke="#E6B045" strokeWidth=".8" fill="none" opacity=".8" />
        <ellipse cx="126.6" cy="12.6" rx="4.2" ry="2.4" fill="#fff" opacity=".55" transform="rotate(-35 126.6 12.6)" />
      </g>
    </>
  )
}

/** The seasonal colours, once per page (an SVG with no size, kept in the layout; not display:none, which would void them). */
export function SeasonalDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
      <defs>
        <radialGradient id="fq-pk" cx="42%" cy="34%" r="70%"><stop offset="0" stopColor="#FFC56A" /><stop offset=".5" stopColor="#F0962F" /><stop offset="1" stopColor="#C9661B" /></radialGradient>
        <radialGradient id="fq-pks" cx="50%" cy="38%" r="72%"><stop offset="0" stopColor="#F3A140" /><stop offset="1" stopColor="#B85A16" /></radialGradient>
        <radialGradient id="fq-fire" cx="50%" cy="60%" r="65%"><stop offset="0" stopColor="#FFF4C2" /><stop offset=".55" stopColor="#FFD25E" /><stop offset="1" stopColor="#F59B2B" /></radialGradient>
        <filter id="fq-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <radialGradient id="fq-gold" cx="38%" cy="32%" r="75%"><stop offset="0" stopColor="#FFF0B8" /><stop offset=".45" stopColor="#E6B045" /><stop offset="1" stopColor="#A9701A" /></radialGradient>
        <radialGradient id="fq-orn" cx="36%" cy="32%" r="75%"><stop offset="0" stopColor="#FF8A7A" /><stop offset=".4" stopColor="#C8312B" /><stop offset="1" stopColor="#7E1717" /></radialGradient>
        <linearGradient id="fq-leaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F2B23A" /><stop offset=".55" stopColor="#E0702A" /><stop offset="1" stopColor="#B8401F" /></linearGradient>
      </defs>
    </svg>
  )
}

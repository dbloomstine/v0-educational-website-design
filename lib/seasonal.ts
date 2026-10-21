/**
 * Holiday marks (2026-10-21, Danny: "go for it. push it live"). The O in the FundOpsHQ wordmark changes with the
 * season, drawn in the house colours: a jack-o'-lantern, an autumn leaf, a Hanukkah gelt coin, a Christmas ornament.
 * Board item 63. Dates are Eastern and inclusive; a day in no window shows the plain O.
 *
 * The site picks the season in the browser (SEASON_SCRIPT, before paint), so a cached or static page still changes on
 * the right day. The email picks it from the edition's date (seasonOn).
 */
export type Season = 'halloween' | 'thanksgiving' | 'hanukkah' | 'christmas'

export const SEASONS: { season: Season; from: string; to: string }[] = [
  { season: 'halloween', from: '2026-10-21', to: '2026-10-31' },
  { season: 'thanksgiving', from: '2026-11-01', to: '2026-11-27' },
  // Hanukkah 2026 begins the evening of Dec 4 and ends Dec 12.
  { season: 'hanukkah', from: '2026-12-04', to: '2026-12-12' },
  { season: 'christmas', from: '2026-12-13', to: '2026-12-26' },
]

/** The season on a date (YYYY-MM-DD), or null. */
export function seasonOn(date: string): Season | null {
  const d = date.slice(0, 10)
  return SEASONS.find((s) => d >= s.from && d <= s.to)?.season ?? null
}

/** The seasonal O as a picture, for the email (which cannot draw the site's SVG): its address and its width at 30px tall. */
export const SEASON_O_IMAGE: Record<Season, { src: string; width: number }> = {
  halloween: { src: 'https://fundopshq.com/seasonal/o-pumpkin.png', width: 34 },
  thanksgiving: { src: 'https://fundopshq.com/seasonal/o-leaf.png', width: 25 },
  hanukkah: { src: 'https://fundopshq.com/seasonal/o-gelt.png', width: 30 },
  christmas: { src: 'https://fundopshq.com/seasonal/o-ornament.png', width: 23 },
}

/**
 * Runs in <head> before the page paints: sets <html data-season="…"> from today's date in New York.
 * `?season=halloween` (or `none`) overrides it, for checking a look on any day.
 */
export const SEASON_SCRIPT = `(function(){try{var q=new URLSearchParams(location.search).get('season');var s=null;if(q){s=q==='none'?null:q}else{var p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());var w=${JSON.stringify(SEASONS.map((s) => [s.from, s.to, s.season]))};for(var i=0;i<w.length;i++){if(p>=w[i][0]&&p<=w[i][1]){s=w[i][2];break}}}if(s)document.documentElement.setAttribute('data-season',s)}catch(e){}})();`

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

/** Today in New York as YYYY-MM-DD, built from the date's parts (a locale's own date format differs between browsers). */
export function todayInNewYork(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

/**
 * Runs in <head> before the page paints: sets (or clears) <html data-season="…"> from today's date in New York.
 * The server also stamps the season it saw when it made the page, so the mark shows even where this script cannot
 * run; this script corrects a page made on another day. `?season=halloween` (or `none`) overrides it, for checking.
 * It also plays the pumpkin's hover (leaves tumble out; globals.css) by setting `fq-play` for a moment.
 * 2026-10-21: the first version read the date from a locale format ('en-CA') that not every browser writes as
 * YYYY-MM-DD, and Danny saw a plain O; the date now comes from its parts.
 */
export const SEASON_SCRIPT = `(function(){try{var q=new URLSearchParams(location.search).get('season');var s=null;if(q){s=q==='none'?null:q}else{var f=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());var g=function(t){for(var i=0;i<f.length;i++){if(f[i].type===t)return f[i].value}return''};var p=g('year')+'-'+g('month')+'-'+g('day');var w=${JSON.stringify(SEASONS.map((s) => [s.from, s.to, s.season]))};for(var i=0;i<w.length;i++){if(p>=w[i][0]&&p<=w[i][1]){s=w[i][2];break}}}var h=document.documentElement;if(s)h.setAttribute('data-season',s);else h.removeAttribute('data-season');var play=function(e){var g=e.target&&e.target.closest&&e.target.closest('.wm-halloween');if(!g||g.classList.contains('fq-play'))return;g.classList.add('fq-play');setTimeout(function(){g.classList.remove('fq-play')},2400)};document.addEventListener('mouseover',play);document.addEventListener('touchstart',play,{passive:true})}catch(e){}})();`

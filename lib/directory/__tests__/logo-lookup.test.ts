import { describe, expect, it } from 'vitest'
import { candidatesOn, drawMode, headerImages, headerSvgs, iconCandidates, notAMark, pageNamesFirm, pixelStats, plainlyMoved, registrable, standaloneSvg } from '../logo-lookup'

const page = 'https://www.evercore.com/'

describe('logo lookup', () => {
  it('reads a domain the way firms are told apart', () => {
    expect(registrable('www.blackstone.com')).toBe('blackstone.com')
    expect(registrable('www.ardian.co.uk')).toBe('ardian.co.uk')
  })
  it('takes the header picture the page calls a logo, the one for a dark ground last, and nothing below the header', () => {
    const html = `<body><header><img src="/img/logo-white.svg" class="logo"><a href="/"><img src="/img/logo.svg" alt="Evercore logo"></a><img src="/hero.jpg"></header><main><img class="logo" src="/client-logo.png"></main>`
    expect(headerImages(html, page).map((c) => c.href)).toEqual(['https://www.evercore.com/img/logo.svg', 'https://www.evercore.com/img/logo-white.svg'])
  })
  it('takes an inline SVG in the home link, never a social icon or one linking away', () => {
    const svg = '<svg viewBox="0 0 200 40"><path d="M0 0h10v10z"/></svg>'
    const html = `<body><header><a href="/">${svg}</a><a href="https://linkedin.com/x" aria-label="LinkedIn">${svg}</a><button class="menu-toggle">${svg.replace('<svg', '<svg class="menu"')}</button></header>`
    const got = headerSvgs(html, page)
    expect(got).toHaveLength(1)
    expect(got[0].svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(got[0].svg).toContain('width="480"')
  })
  it('refuses a drawing that could run code or is favicon-sized', () => {
    expect(standaloneSvg('<svg viewBox="0 0 100 20"><script>x</script><path d="M0 0"/></svg>')).toBeNull()
    expect(standaloneSvg('<svg viewBox="0 0 16 16"><path d="M0 0"/></svg>')).toBeNull()
  })
  it('ranks icons: apple-touch-icon, then SVG, then a PNG of 96 px or more; never a 32 px favicon', () => {
    const html = `<link rel="icon" href="/f32.png" sizes="32x32" type="image/png"><link rel="icon" href="/f192.png" sizes="192x192" type="image/png"><link rel="icon" href="/i.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/a.png" sizes="180x180">`
    expect(iconCandidates(html, page).map((c) => c.via)).toEqual(['apple-touch-icon', 'svg-icon', 'png-icon'])
    expect(candidatesOn(html, page)).toHaveLength(3)
  })
  it('checks the page is the firm’s, and follows a move only to a domain carrying its name', () => {
    expect(pageNamesFirm('Evercore', page, '<title>Home</title>')).toBe(true)
    expect(pageNamesFirm('Vinson & Elkins', 'https://www.velaw.com/', '<title>Welcome</title>')).toBe(false)
    expect(plainlyMoved('Sax LLP (Sax Advisory Group)', 'https://saxadvisorygroup.com/')).toBe(true)
    expect(plainlyMoved('Evercore', 'https://example.com/')).toBe(false)
  })
  it('judges pixels: nothing drawn, a plain block, ink, plate and own', () => {
    const px = (cells: [number, number, number, number][]) => Uint8Array.from(cells.flat())
    const clear: [number, number, number, number] = [0, 0, 0, 0]
    const ink: [number, number, number, number] = [20, 30, 50, 255]
    const white: [number, number, number, number] = [255, 255, 255, 255]
    expect(notAMark(pixelStats(px([clear, clear])))).toMatch(/nothing/)
    expect(notAMark(pixelStats(px(Array(50).fill([120, 60, 200, 255]))))).toMatch(/block/)
    expect(drawMode(pixelStats(px([...Array(10).fill(clear), ...Array(10).fill(ink)])))).toBe('ink')
    expect(drawMode(pixelStats(px([...Array(10).fill(clear), ...Array(5).fill(ink), ...Array(5).fill(white)])))).toBe('plate')
    expect(drawMode(pixelStats(px([...Array(10).fill(white), ...Array(10).fill(ink)])))).toBe('own')
  })
})

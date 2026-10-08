import { describe, it, expect } from 'vitest'
import { isIrrelevantAtIngest } from '../ingest-worker'

describe('isIrrelevantAtIngest', () => {
  it('keeps English headlines that use words French shares', () => {
    expect(isIrrelevantAtIngest('Nuveen completes acquisition of Schroders', 'Private Equity Wire')).toBe(false)
    expect(isIrrelevantAtIngest('KKR to fund acquisition of fund administrator Gen II', 'Reuters')).toBe(false)
    expect(isIrrelevantAtIngest('Lance Capital closes debut fund at $300M', 'PE Hub')).toBe(false)
  })

  it('still drops headlines that are not in English', () => {
    expect(isIrrelevantAtIngest('Ardian annonce le closing de son fonds', 'Les Echos')).toBe(true)
    expect(isIrrelevantAtIngest('Eurazeo renforce sa société de gestion', 'CFNews')).toBe(true)
    expect(isIrrelevantAtIngest('EQT erwirbt Beteiligung an Softwarefirma', 'Handelsblatt')).toBe(true)
    expect(isIrrelevantAtIngest('MCH anuncia el cierre de su fondo', 'Expansión')).toBe(true)
  })
})

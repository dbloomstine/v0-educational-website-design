/**
 * Custom hooks barrel export
 */

export { useUrlState } from './use-url-state'
export { usePresets, type Preset } from './use-presets'
export { useExpandableSections, type UseExpandableSectionsOptions } from './use-expandable-sections'
export { usePersistedState, type UsePersistedStateOptions } from './use-persisted-state'
export {
  useJourneyMode,
  journeySlideVariants,
  journeyFloatVariants,
  journeyCelebrationVariants,
  CONFETTI_PRESETS,
  type JourneyStepBase,
  type UseJourneyModeOptions,
  type UseJourneyModeReturn,
  type ConfettiPreset,
} from './use-journey-mode'

/**
 * PostScript / linked font family names for StyleSheet `fontFamily`.
 * Files live in `src/assets/fonts/` and are linked via react-native.config.js.
 */
export const fonts = {
  playfairDisplay: 'PlayfairDisplay-Regular',
  ibmPlexMono: 'IBMPlexMono-Regular',
  ibmPlexMonoSemiBold: 'IBMPlexMono-SemiBold',
} as const;

export type Fonts = typeof fonts;

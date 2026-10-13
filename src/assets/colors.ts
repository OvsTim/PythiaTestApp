export const colors = {
  text: '#FFFFFF',
  text70: '#B7C0C6',
  textUnactive: '#6B6D78',
  danger: '#F66161',
  /** Soft red for "Not sent" / "Retry" on the error state screen. */
  notSent: '#E6A8A8',
  accent: '#FFFFFF',
  background: '#101010',
  lightAccent: '#1F2021',
  lightArea: 'rgba(255, 255, 255, 0.07)',
  lightBorder: 'rgba(255, 255, 255, 0.2)',
  /** Figma glass overlays (Message Input / title pill / back). */
  glassTintDark: 'rgba(0, 0, 0, 0.06)',
  glassTintLight: 'rgba(255, 255, 255, 0.06)',
  glassFallback: 'rgba(255, 255, 255, 0.08)',
  sendIdle: 'rgba(255, 255, 255, 0.12)',
  /** Vertical screen gradient from Figma "Background Linear" (`ChatBackground`). */
  backgroundLinear: {
    colors: ['#0D0D0F', '#292E36'] as const,
    locations: [0.51, 1] as const,
    start: {x: 0.5, y: 0},
    end: {x: 0.5, y: 1},
  },
} as const;

export type Colors = typeof colors;

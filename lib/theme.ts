export const theme = {
  colors: {
    bg: '#000000', // App background - true black for OLED
    surface: '#0B0B0B', // Cards and elevated surfaces
    muted: '#181818', // Secondary surfaces
    text: '#EDEDED', // Primary text
    textMuted: '#B3B3B3', // Secondary text
    primary: '#7AA2FF', // Accessible blue on black
    danger: '#FF5C5C', // Error/danger actions
    success: '#58D68D', // Success states
    border: '#222222', // Borders and dividers
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 16,
  },
  typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    fontWeight: {
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
  },
} as const;

export type Theme = typeof theme;

export const THEME_TOKENS = {
  colors: {
    brand: {
      primary: '#FE0000',
      hover: '#E00000',
      active: '#C70000',
      subtle: '#FFF0F0',
      muted: '#FDE8E8',
    },
    neutral: {
      dark: '#151515',
      text: '#171717',
      secondary: '#666666',
      muted: '#8E8E8E',
      border: '#E5E5E5',
      light: '#F7F7F7',
      surface: '#FFFFFF',
    },
    feedback: {
      success: '#16A34A',
      warning: '#F59E0B',
      error: '#DC2626',
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", Inter, sans-serif',
  },
  breakpoints: {
    xs: '360px',
    sm: '414px',
    md: '768px',
    tablet: '834px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1440px',
  },
} as const;

export type ThemeTokens = typeof THEME_TOKENS;

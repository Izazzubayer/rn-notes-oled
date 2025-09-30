import React from 'react';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';

// Custom theme configuration for dark mode
const customConfig = {
  ...config,
  tokens: {
    ...config.tokens,
    colors: {
      ...config.tokens.colors,
      // Custom dark theme colors
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
      },
      secondary: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
      },
      background: {
        0: '#000000',
        50: '#0a0a0a',
        100: '#1a1a1a',
        200: '#2a2a2a',
        300: '#3a3a3a',
        400: '#4a4a4a',
        500: '#5a5a5a',
        600: '#6a6a6a',
        700: '#7a7a7a',
        800: '#8a8a8a',
        900: '#9a9a9a',
      },
      text: {
        0: '#ffffff',
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
      },
    },
  },
  globalStyle: {
    variants: {
      hardShadow: {
        ...config.globalStyle.variants.hardShadow,
      },
      softShadow: {
        ...config.globalStyle.variants.softShadow,
      },
    },
  },
};

interface GluestackProviderProps {
  children: React.ReactNode;
}

export function GluestackProvider({ children }: GluestackProviderProps) {
  return (
    <GluestackUIProvider config={customConfig} colorMode="dark">
      {children}
    </GluestackUIProvider>
  );
}

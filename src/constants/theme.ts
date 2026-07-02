/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

const colors = {
  light: {
    text: '#2C1810',
    tint: "#C8843A",
    background: "#FAF7F2",
    foreground: "#2C1810",
    card: "#FFFFFF",
    cardForeground: "#2C1810",
    primary: "#C8843A",
    primaryForeground: "#FFFFFF",
    secondary: "#F5EDD8",
    secondaryForeground: "#2C1810",
    muted: "#EDE5D4",
    mutedForeground: "#9B8A72",
    accent: "#E8B86D",
    accentForeground: "#2C1810",
    destructive: "#D94F3D",
    destructiveForeground: "#FFFFFF",
    border: "#E2D4BE",
    input: "#E2D4BE",
    success: "#4A9B6F",
    successForeground: "#FFFFFF",
    warning: "#D4822A",
    warningForeground: "#FFFFFF",
    surfaceElevated: "#FFFCF8",

    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    tint: "#C8843A",
    background: "#FAF7F2",
    foreground: "#2C1810",
    card: "#FFFFFF",
    cardForeground: "#2C1810",
    primary: "#C8843A",
    primaryForeground: "#FFFFFF",
    secondary: "#F5EDD8",
    secondaryForeground: "#2C1810",
    muted: "#EDE5D4",
    mutedForeground: "#9B8A72",
    accent: "#E8B86D",
    accentForeground: "#2C1810",
    destructive: "#D94F3D",
    destructiveForeground: "#FFFFFF",
    border: "#E2D4BE",
    input: "#E2D4BE",
    success: "#4A9B6F",
    successForeground: "#FFFFFF",
    warning: "#D4822A",
    warningForeground: "#FFFFFF",
    surfaceElevated: "#FFFCF8",

    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} 

export default colors;

export type ThemeColor = keyof typeof colors.light & keyof typeof colors.dark

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

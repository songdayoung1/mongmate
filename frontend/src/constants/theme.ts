import { Platform, ViewStyle } from "react-native";

export const COLORS = {
  // Primary (Mint/Green)
  primary: "#0ACF83",
  primaryLight: "#E6FFFA",
  primaryDark: "#059669",
  
  // Secondary (Orange/Coffee)
  secondary: "#FF9F43",
  secondaryLight: "#FFF0E0",
  secondaryDark: "#E67E22",

  // Backgrounds
  background: "#F9FAFB",
  white: "#FFFFFF",
  surface: "#FFFFFF",
  
  // Text
  textMain: "#111827",
  textSub: "#6B7280",
  textMuted: "#9CA3AF",
  
  // States
  error: "#EF4444",
  divider: "#F3F4F6",
  border: "#E5E7EB",
  
  // Dark/Black
  black: "#000000",
};

export const SHADOWS = {
  soft: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  } as ViewStyle,
  medium: {
    shadowColor: COLORS.textMain,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  } as ViewStyle,
  strong: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  } as ViewStyle,
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  } as ViewStyle,
};

export const SIZES = {
  base: 8,
  small: 12,
  medium: 16,
  large: 20,
  xlarge: 24,
  xxlarge: 32,
  
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    circle: 999,
  }
};

export const FONTS = {
  // Can add font family config here if needed
  extraBold: "800",
  bold: "700",
  semiBold: "600",
  medium: "500",
  regular: "400",
};

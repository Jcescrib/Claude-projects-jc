// Theme constants for the Habit Tracker App

export const Colors = {
  // Primary palette
  primary: '#3B82F6', // Blue
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',

  // Secondary palette
  secondary: '#10B981', // Green
  secondaryDark: '#059669',
  secondaryLight: '#34D399',

  // Accent colors
  accent: '#F59E0B', // Amber for streaks
  accentLight: '#FBBF24',

  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Neutral colors
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  border: '#E2E8F0',

  // Text colors
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textOnPrimary: '#FFFFFF',

  // Special colors
  locked: '#94A3B8',
  safe: '#8B5CF6', // Purple for safe points
  streak: '#F59E0B',
  perfectDay: '#FBBF24',

  // Time of day colors
  morning: '#F59E0B',
  afternoon: '#3B82F6',
  night: '#6366F1',
};

export const DarkColors = {
  ...Colors,
  background: '#0F172A',
  surface: '#1E293B',
  surfaceVariant: '#334155',
  border: '#475569',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const TimeOfDayConfig = {
  Morning: {
    icon: '🌅',
    label: 'Morning',
    color: Colors.morning,
    hours: { start: 5, end: 12 },
  },
  Afternoon: {
    icon: '☀️',
    label: 'Afternoon',
    color: Colors.afternoon,
    hours: { start: 12, end: 18 },
  },
  Night: {
    icon: '🌙',
    label: 'Night',
    color: Colors.night,
    hours: { start: 18, end: 5 },
  },
};

export const DayOfWeekConfig = {
  Mon: { short: 'M', full: 'Monday' },
  Tue: { short: 'T', full: 'Tuesday' },
  Wed: { short: 'W', full: 'Wednesday' },
  Thu: { short: 'T', full: 'Thursday' },
  Fri: { short: 'F', full: 'Friday' },
  Sat: { short: 'S', full: 'Saturday' },
  Sun: { short: 'S', full: 'Sunday' },
};

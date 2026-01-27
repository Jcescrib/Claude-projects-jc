import { DayOfWeek, TimeOfDay, Habit, PointsSummary, Streak } from '../types';

// Get current day of week
export const getCurrentDayOfWeek = (): DayOfWeek => {
  const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date().getDay()];
};

// Get current time of day
export const getCurrentTimeOfDay = (): TimeOfDay => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 18) return 'Afternoon';
  return 'Night';
};

// Get today's date in YYYY-MM-DD format
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Format date for display
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Format date short
export const formatDateShort = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

// Format time
export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format timer display (seconds to MM:SS)
export const formatTimer = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Generate random multiplier between 1.0 and 2.0
export const generateRandomMultiplier = (): number => {
  return 1 + Math.random();
};

// Calculate points with multiplier
export const calculatePoints = (basePoints: number, multiplier: number): number => {
  return Math.round(basePoints * multiplier * 10) / 10;
};

// Check if habit should be shown for a specific day and time
export const shouldShowHabit = (
  habit: Habit,
  dayOfWeek: DayOfWeek,
  timeOfDay: TimeOfDay
): boolean => {
  return (
    habit.isActive &&
    habit.daysOfWeek.includes(dayOfWeek) &&
    habit.timesOfDay.includes(timeOfDay)
  );
};

// Filter habits for current day and time
export const filterHabitsForDayTime = (
  habits: Habit[],
  dayOfWeek: DayOfWeek,
  timeOfDay: TimeOfDay
): Habit[] => {
  return habits.filter((habit) => shouldShowHabit(habit, dayOfWeek, timeOfDay));
};

// Calculate points summary from streaks and safe points
export const calculatePointsSummary = (
  streaks: Streak[],
  safePointsTotal: number
): PointsSummary => {
  let locked = 0;
  let spendable = 0;

  for (const streak of streaks) {
    locked += streak.lockedPoints;
    spendable += streak.fixedPoints + streak.permanentPoints;
  }

  spendable += safePointsTotal;

  return {
    totalAvailable: spendable + locked,
    spendable,
    locked,
    safe: safePointsTotal,
  };
};

// Check if streak should be fixed (day 7)
export const shouldFixStreak = (currentStreak: number): boolean => {
  return currentStreak >= 7 && currentStreak < 21;
};

// Check if streak should be permanent (day 21)
export const shouldMakePermanent = (currentStreak: number): boolean => {
  return currentStreak >= 21;
};

// Check if yesterday was the last completed date
export const wasCompletedYesterday = (lastCompletedDate: string | null): boolean => {
  if (!lastCompletedDate) return false;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  return lastCompletedDate === yesterdayStr;
};

// Check if completed today
export const wasCompletedToday = (lastCompletedDate: string | null): boolean => {
  if (!lastCompletedDate) return false;
  return lastCompletedDate === getTodayDate();
};

// Parse CSV-safe string
export const escapeCSV = (str: string): string => {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Generate unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Clamp number between min and max
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// Get streak status text
export const getStreakStatusText = (streak: Streak): string => {
  if (streak.currentStreak === 0) {
    return 'No active streak';
  }
  if (streak.currentStreak >= 21) {
    return 'Consolidated habit!';
  }
  if (streak.currentStreak >= 7) {
    return `${streak.currentStreak} days (${streak.currentStreak - 7 + 1} days since fixed)`;
  }
  return `${streak.currentStreak} day${streak.currentStreak > 1 ? 's' : ''} (unlocks in ${7 - streak.currentStreak} days)`;
};

// Order days of week correctly
export const orderedDays: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Order times of day correctly
export const orderedTimes: TimeOfDay[] = ['Morning', 'Afternoon', 'Night'];

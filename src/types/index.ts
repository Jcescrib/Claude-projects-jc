// Type definitions for the Habit Tracker App

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type TimeOfDay = 'Morning' | 'Afternoon' | 'Night';
export type ResponseType = 'yes_no' | 'scale_1_5' | 'multiple_choice' | 'free_text';
export type RewardType = 'one_shot' | 'permanent';
export type RewardStatus = 'available' | 'unlocked' | 'insufficient';

export interface HabitStep {
  id: string;
  habitId: string;
  orderIndex: number;
  questionText: string;
  responseType: ResponseType;
  multipleChoiceOptions?: string[]; // For multiple_choice type
  timerEnabled: boolean;
  timerSeconds: number; // Timer duration in seconds
}

// Step input type without habitId (used during creation)
export interface HabitStepInput {
  id?: string;
  orderIndex: number;
  questionText: string;
  responseType: ResponseType;
  multipleChoiceOptions?: string[];
  timerEnabled: boolean;
  timerSeconds: number;
}

export interface Habit {
  id: string;
  name: string;
  isActive: boolean;
  daysOfWeek: DayOfWeek[];
  timesOfDay: TimeOfDay[];
  basePoints: number;
  steps: HabitStep[];
  createdAt: string;
  updatedAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  habitName: string;
  completedAt: string; // ISO date string
  timeOfDay: TimeOfDay;
  completed: boolean;
  pointsGenerated: number;
  multiplierUsed: number;
  stepResponses: StepResponse[];
}

export interface StepResponse {
  stepId: string;
  questionText: string;
  responseType: ResponseType;
  response: string | number | boolean;
  timerUsed: boolean;
  timerDuration?: number;
}

export interface Streak {
  habitId: string;
  currentStreak: number;
  lockedPoints: number;
  fixedPoints: number; // Points that have been fixed (day 7+)
  permanentPoints: number; // Points fixed at day 21
  lastCompletedDate: string | null;
  startDate: string | null;
}

export interface PointsSummary {
  totalAvailable: number;
  spendable: number;
  locked: number;
  safe: number;
}

export interface Reward {
  id: string;
  name: string;
  description?: string;
  cost: number;
  type: RewardType;
  status: RewardStatus;
  redeemedAt?: string;
  createdAt: string;
}

export interface SafePoints {
  total: number;
  lastUpdated: string;
}

export interface DailyStatus {
  date: string;
  isPerfectDay: boolean;
  habitsCompleted: number;
  totalHabits: number;
  bonusAwarded: boolean;
}

export interface AppSettings {
  perfectDayBonus: number;
  darkMode: boolean;
}

// Navigation types
export type RootTabParamList = {
  Today: undefined;
  Habits: undefined;
  Rewards: undefined;
};

export type HabitsStackParamList = {
  HabitsList: undefined;
  HabitForm: { habitId?: string };
  StepForm: { habitId: string; stepId?: string };
};

export type TodayStackParamList = {
  DailyView: undefined;
  HabitWizard: { habitId: string; timeOfDay: TimeOfDay };
  Progress: undefined;
};

export type RewardsStackParamList = {
  RewardsList: undefined;
  RewardForm: { rewardId?: string };
};

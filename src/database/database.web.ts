// Web database layer using localStorage
import { v4 as uuidv4 } from 'uuid';
import {
  Habit,
  HabitStep,
  HabitStepInput,
  HabitCompletion,
  Streak,
  Reward,
  SafePoints,
  DailyStatus,
  AppSettings,
  DayOfWeek,
  TimeOfDay,
} from '../types';

// Storage keys
const KEYS = {
  HABITS: 'habit_tracker_habits',
  STEPS: 'habit_tracker_steps',
  COMPLETIONS: 'habit_tracker_completions',
  STREAKS: 'habit_tracker_streaks',
  REWARDS: 'habit_tracker_rewards',
  SAFE_POINTS: 'habit_tracker_safe_points',
  DAILY_STATUS: 'habit_tracker_daily_status',
  SETTINGS: 'habit_tracker_settings',
};

// Helper functions
const getStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setStorage = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ==================== INITIALIZATION ====================

export const initDatabase = async (): Promise<void> => {
  // Initialize safe_points if not exists
  if (!localStorage.getItem(KEYS.SAFE_POINTS)) {
    setStorage<SafePoints>(KEYS.SAFE_POINTS, {
      total: 0,
      lastUpdated: new Date().toISOString(),
    });
  }

  // Initialize settings if not exists
  if (!localStorage.getItem(KEYS.SETTINGS)) {
    setStorage<AppSettings>(KEYS.SETTINGS, {
      perfectDayBonus: 15,
      darkMode: false,
    });
  }

  console.log('Web database initialized (localStorage)');
};

export const getDatabase = (): null => {
  // For web compatibility - returns null as we use localStorage directly
  return null;
};

// ==================== HABITS ====================

export const getAllHabits = async (): Promise<Habit[]> => {
  const habits = getStorage<Omit<Habit, 'steps'>[]>(KEYS.HABITS, []);
  const steps = getStorage<HabitStep[]>(KEYS.STEPS, []);

  return habits
    .map((habit) => ({
      ...habit,
      steps: steps
        .filter((s) => s.habitId === habit.id)
        .sort((a, b) => a.orderIndex - b.orderIndex),
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getHabitById = async (id: string): Promise<Habit | null> => {
  const habits = getStorage<Omit<Habit, 'steps'>[]>(KEYS.HABITS, []);
  const steps = getStorage<HabitStep[]>(KEYS.STEPS, []);

  const habit = habits.find((h) => h.id === id);
  if (!habit) return null;

  return {
    ...habit,
    steps: steps
      .filter((s) => s.habitId === id)
      .sort((a, b) => a.orderIndex - b.orderIndex),
  };
};

export const createHabit = async (
  habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'steps'> & { steps: HabitStepInput[] }
): Promise<Habit> => {
  const habits = getStorage<Omit<Habit, 'steps'>[]>(KEYS.HABITS, []);
  const allSteps = getStorage<HabitStep[]>(KEYS.STEPS, []);
  const streaks = getStorage<Streak[]>(KEYS.STREAKS, []);

  const now = new Date().toISOString();
  const habitId = uuidv4();

  const newHabit: Omit<Habit, 'steps'> = {
    id: habitId,
    name: habit.name,
    isActive: habit.isActive,
    daysOfWeek: habit.daysOfWeek,
    timesOfDay: habit.timesOfDay,
    basePoints: habit.basePoints,
    createdAt: now,
    updatedAt: now,
  };

  const newSteps: HabitStep[] = habit.steps.map((step, index) => ({
    id: uuidv4(),
    habitId,
    orderIndex: index,
    questionText: step.questionText,
    responseType: step.responseType,
    multipleChoiceOptions: step.multipleChoiceOptions,
    timerEnabled: step.timerEnabled,
    timerSeconds: step.timerSeconds,
  }));

  const newStreak: Streak = {
    habitId,
    currentStreak: 0,
    lockedPoints: 0,
    fixedPoints: 0,
    permanentPoints: 0,
    lastCompletedDate: null,
    startDate: null,
  };

  habits.push(newHabit);
  setStorage(KEYS.HABITS, habits);
  setStorage(KEYS.STEPS, [...allSteps, ...newSteps]);
  streaks.push(newStreak);
  setStorage(KEYS.STREAKS, streaks);

  return { ...newHabit, steps: newSteps };
};

export const updateHabit = async (
  id: string,
  updates: Partial<Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'steps'> & { steps?: HabitStepInput[] }>
): Promise<Habit | null> => {
  const habits = getStorage<Omit<Habit, 'steps'>[]>(KEYS.HABITS, []);
  let allSteps = getStorage<HabitStep[]>(KEYS.STEPS, []);

  const index = habits.findIndex((h) => h.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();

  habits[index] = {
    ...habits[index],
    ...updates,
    updatedAt: now,
  };

  if (updates.steps) {
    // Remove old steps
    allSteps = allSteps.filter((s) => s.habitId !== id);
    // Add new steps
    const newSteps: HabitStep[] = updates.steps.map((step, idx) => ({
      id: step.id || uuidv4(),
      habitId: id,
      orderIndex: idx,
      questionText: step.questionText,
      responseType: step.responseType,
      multipleChoiceOptions: step.multipleChoiceOptions,
      timerEnabled: step.timerEnabled,
      timerSeconds: step.timerSeconds,
    }));
    allSteps.push(...newSteps);
    setStorage(KEYS.STEPS, allSteps);
  }

  setStorage(KEYS.HABITS, habits);

  return getHabitById(id);
};

export const deleteHabit = async (id: string): Promise<void> => {
  let habits = getStorage<Omit<Habit, 'steps'>[]>(KEYS.HABITS, []);
  let steps = getStorage<HabitStep[]>(KEYS.STEPS, []);
  let completions = getStorage<HabitCompletion[]>(KEYS.COMPLETIONS, []);
  let streaks = getStorage<Streak[]>(KEYS.STREAKS, []);

  habits = habits.filter((h) => h.id !== id);
  steps = steps.filter((s) => s.habitId !== id);
  completions = completions.filter((c) => c.habitId !== id);
  streaks = streaks.filter((s) => s.habitId !== id);

  setStorage(KEYS.HABITS, habits);
  setStorage(KEYS.STEPS, steps);
  setStorage(KEYS.COMPLETIONS, completions);
  setStorage(KEYS.STREAKS, streaks);
};

export const duplicateHabit = async (id: string): Promise<Habit | null> => {
  const habit = await getHabitById(id);
  if (!habit) return null;

  return createHabit({
    name: `${habit.name} (Copy)`,
    isActive: habit.isActive,
    daysOfWeek: habit.daysOfWeek,
    timesOfDay: habit.timesOfDay,
    basePoints: habit.basePoints,
    steps: habit.steps.map((s) => ({
      orderIndex: s.orderIndex,
      questionText: s.questionText,
      responseType: s.responseType,
      multipleChoiceOptions: s.multipleChoiceOptions,
      timerEnabled: s.timerEnabled,
      timerSeconds: s.timerSeconds,
    })),
  });
};

// ==================== HABIT STEPS ====================

export const getHabitSteps = async (habitId: string): Promise<HabitStep[]> => {
  const steps = getStorage<HabitStep[]>(KEYS.STEPS, []);
  return steps
    .filter((s) => s.habitId === habitId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
};

export const createHabitStep = async (
  step: Omit<HabitStep, 'id'> & { id?: string }
): Promise<HabitStep> => {
  const steps = getStorage<HabitStep[]>(KEYS.STEPS, []);
  const newStep: HabitStep = {
    ...step,
    id: step.id || uuidv4(),
  };
  steps.push(newStep);
  setStorage(KEYS.STEPS, steps);
  return newStep;
};

// ==================== HABIT COMPLETIONS ====================

export const getCompletionsForDate = async (date: string): Promise<HabitCompletion[]> => {
  const completions = getStorage<HabitCompletion[]>(KEYS.COMPLETIONS, []);
  const targetDate = date.split('T')[0];
  return completions.filter((c) => c.completedAt.split('T')[0] === targetDate);
};

export const isHabitCompletedToday = async (
  habitId: string,
  timeOfDay: TimeOfDay
): Promise<boolean> => {
  const today = new Date().toISOString().split('T')[0];
  const completions = getStorage<HabitCompletion[]>(KEYS.COMPLETIONS, []);

  return completions.some(
    (c) =>
      c.habitId === habitId &&
      c.completedAt.split('T')[0] === today &&
      c.timeOfDay === timeOfDay &&
      c.completed
  );
};

export const createHabitCompletion = async (
  completion: Omit<HabitCompletion, 'id'>
): Promise<HabitCompletion> => {
  const completions = getStorage<HabitCompletion[]>(KEYS.COMPLETIONS, []);
  const newCompletion: HabitCompletion = {
    ...completion,
    id: uuidv4(),
  };
  completions.push(newCompletion);
  setStorage(KEYS.COMPLETIONS, completions);
  return newCompletion;
};

export const getAllCompletions = async (): Promise<HabitCompletion[]> => {
  return getStorage<HabitCompletion[]>(KEYS.COMPLETIONS, []).sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
};

// ==================== STREAKS ====================

export const getStreak = async (habitId: string): Promise<Streak | null> => {
  const streaks = getStorage<Streak[]>(KEYS.STREAKS, []);
  return streaks.find((s) => s.habitId === habitId) || null;
};

export const getAllStreaks = async (): Promise<Streak[]> => {
  return getStorage<Streak[]>(KEYS.STREAKS, []);
};

export const updateStreak = async (
  habitId: string,
  updates: Partial<Streak>
): Promise<void> => {
  const streaks = getStorage<Streak[]>(KEYS.STREAKS, []);
  const index = streaks.findIndex((s) => s.habitId === habitId);

  if (index !== -1) {
    streaks[index] = { ...streaks[index], ...updates };
    setStorage(KEYS.STREAKS, streaks);
  }
};

export const resetStreak = async (habitId: string): Promise<number> => {
  const streak = await getStreak(habitId);
  const lostPoints = streak?.lockedPoints || 0;

  await updateStreak(habitId, {
    currentStreak: 0,
    lockedPoints: 0,
    startDate: null,
    lastCompletedDate: null,
  });

  return lostPoints;
};

// ==================== SAFE POINTS ====================

export const getSafePoints = async (): Promise<SafePoints> => {
  return getStorage<SafePoints>(KEYS.SAFE_POINTS, {
    total: 0,
    lastUpdated: new Date().toISOString(),
  });
};

export const addSafePoints = async (amount: number): Promise<SafePoints> => {
  const safePoints = await getSafePoints();
  const updated: SafePoints = {
    total: safePoints.total + amount,
    lastUpdated: new Date().toISOString(),
  };
  setStorage(KEYS.SAFE_POINTS, updated);
  return updated;
};

export const subtractSafePoints = async (amount: number): Promise<SafePoints> => {
  const safePoints = await getSafePoints();
  const updated: SafePoints = {
    total: Math.max(0, safePoints.total - amount),
    lastUpdated: new Date().toISOString(),
  };
  setStorage(KEYS.SAFE_POINTS, updated);
  return updated;
};

// ==================== REWARDS ====================

export const getAllRewards = async (): Promise<Reward[]> => {
  return getStorage<Reward[]>(KEYS.REWARDS, []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const createReward = async (
  reward: Omit<Reward, 'id' | 'status' | 'createdAt'>
): Promise<Reward> => {
  const rewards = getStorage<Reward[]>(KEYS.REWARDS, []);
  const newReward: Reward = {
    ...reward,
    id: uuidv4(),
    status: 'available',
    createdAt: new Date().toISOString(),
  };
  rewards.push(newReward);
  setStorage(KEYS.REWARDS, rewards);
  return newReward;
};

export const updateReward = async (
  id: string,
  updates: Partial<Omit<Reward, 'id' | 'createdAt'>>
): Promise<Reward | null> => {
  const rewards = getStorage<Reward[]>(KEYS.REWARDS, []);
  const index = rewards.findIndex((r) => r.id === id);

  if (index === -1) return null;

  rewards[index] = { ...rewards[index], ...updates };
  setStorage(KEYS.REWARDS, rewards);
  return rewards[index];
};

export const deleteReward = async (id: string): Promise<void> => {
  let rewards = getStorage<Reward[]>(KEYS.REWARDS, []);
  rewards = rewards.filter((r) => r.id !== id);
  setStorage(KEYS.REWARDS, rewards);
};

export const getRedeemedRewards = async (): Promise<Reward[]> => {
  const rewards = getStorage<Reward[]>(KEYS.REWARDS, []);
  return rewards
    .filter((r) => r.status === 'unlocked' || r.redeemedAt)
    .sort((a, b) => {
      if (!a.redeemedAt) return 1;
      if (!b.redeemedAt) return -1;
      return new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime();
    });
};

// ==================== DAILY STATUS ====================

export const getDailyStatus = async (date: string): Promise<DailyStatus | null> => {
  const statuses = getStorage<DailyStatus[]>(KEYS.DAILY_STATUS, []);
  return statuses.find((s) => s.date === date) || null;
};

export const updateDailyStatus = async (
  date: string,
  updates: Partial<DailyStatus>
): Promise<void> => {
  const statuses = getStorage<DailyStatus[]>(KEYS.DAILY_STATUS, []);
  const index = statuses.findIndex((s) => s.date === date);

  if (index === -1) {
    statuses.push({
      date,
      isPerfectDay: updates.isPerfectDay || false,
      habitsCompleted: updates.habitsCompleted || 0,
      totalHabits: updates.totalHabits || 0,
      bonusAwarded: updates.bonusAwarded || false,
    });
  } else {
    statuses[index] = { ...statuses[index], ...updates };
  }

  setStorage(KEYS.DAILY_STATUS, statuses);
};

// ==================== APP SETTINGS ====================

export const getAppSettings = async (): Promise<AppSettings> => {
  return getStorage<AppSettings>(KEYS.SETTINGS, {
    perfectDayBonus: 15,
    darkMode: false,
  });
};

export const updateAppSettings = async (
  updates: Partial<AppSettings>
): Promise<AppSettings> => {
  const settings = await getAppSettings();
  const updated: AppSettings = { ...settings, ...updates };
  setStorage(KEYS.SETTINGS, updated);
  return updated;
};

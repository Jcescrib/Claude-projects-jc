import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import {
  Habit,
  HabitCompletion,
  Streak,
  Reward,
  PointsSummary,
  AppSettings,
  TimeOfDay,
  DayOfWeek,
  StepResponse,
  HabitStepInput,
} from '../types';
import * as db from '../database/database';
import {
  getCurrentDayOfWeek,
  getCurrentTimeOfDay,
  getTodayDate,
  generateRandomMultiplier,
  calculatePoints,
  calculatePointsSummary,
  wasCompletedYesterday,
  wasCompletedToday,
  filterHabitsForDayTime,
} from '../utils/helpers';
import * as Haptics from '../utils/haptics';

interface AppContextType {
  // State
  isLoading: boolean;
  habits: Habit[];
  streaks: Streak[];
  rewards: Reward[];
  pointsSummary: PointsSummary;
  settings: AppSettings;
  todayCompletions: HabitCompletion[];
  currentTimeOfDay: TimeOfDay;
  currentDayOfWeek: DayOfWeek;

  // Habit actions
  loadHabits: () => Promise<void>;
  createHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'steps'> & { steps: HabitStepInput[] }) => Promise<Habit>;
  updateHabit: (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'steps'> & { steps?: HabitStepInput[] }>) => Promise<Habit | null>;
  deleteHabit: (id: string) => Promise<void>;
  duplicateHabit: (id: string) => Promise<Habit | null>;

  // Completion actions
  completeHabit: (
    habit: Habit,
    timeOfDay: TimeOfDay,
    stepResponses: StepResponse[]
  ) => Promise<{ points: number; multiplier: number; isPerfectDay: boolean; perfectDayBonus: number }>;
  isHabitCompletedToday: (habitId: string, timeOfDay: TimeOfDay) => boolean;

  // Reward actions
  loadRewards: () => Promise<void>;
  createReward: (reward: Omit<Reward, 'id' | 'status' | 'createdAt'>) => Promise<Reward>;
  updateReward: (id: string, updates: Partial<Omit<Reward, 'id' | 'createdAt'>>) => Promise<Reward | null>;
  deleteReward: (id: string) => Promise<void>;
  redeemReward: (reward: Reward) => Promise<boolean>;

  // Settings actions
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;

  // Utility
  getHabitsForCurrentTime: () => Habit[];
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [safePoints, setSafePoints] = useState(0);
  const [settings, setSettings] = useState<AppSettings>({ perfectDayBonus: 15, darkMode: false });
  const [todayCompletions, setTodayCompletions] = useState<HabitCompletion[]>([]);
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<TimeOfDay>(getCurrentTimeOfDay());
  const [currentDayOfWeek] = useState<DayOfWeek>(getCurrentDayOfWeek());

  const pointsSummary = calculatePointsSummary(streaks, safePoints);

  // Initialize database and load data
  useEffect(() => {
    const init = async () => {
      try {
        await db.initDatabase();
        await refreshData();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Update time of day periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeOfDay(getCurrentTimeOfDay());
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Check for missed habits (streak loss)
  useEffect(() => {
    const checkMissedHabits = async () => {
      const today = getTodayDate();
      const lostStreaks: { habitName: string; days: number; lostPoints: number }[] = [];

      for (const habit of habits) {
        if (!habit.isActive) continue;

        const streak = streaks.find(s => s.habitId === habit.id);
        if (!streak || streak.currentStreak === 0) continue;

        // If there's an active streak but not completed today or yesterday, it's lost
        if (
          streak.lastCompletedDate &&
          !wasCompletedToday(streak.lastCompletedDate) &&
          !wasCompletedYesterday(streak.lastCompletedDate)
        ) {
          // Track lost streaks for notification
          lostStreaks.push({
            habitName: habit.name,
            days: streak.currentStreak,
            lostPoints: streak.lockedPoints,
          });

          // Streak is broken - reset it
          await db.resetStreak(habit.id);
        }
      }

      // Reload streaks after checking
      const updatedStreaks = await db.getAllStreaks();
      setStreaks(updatedStreaks);

      // Notify user about lost streaks with haptic feedback
      if (lostStreaks.length > 0) {
        // Trigger haptic warning for streak loss
        Haptics.streakLossVibration();

        const message = lostStreaks.length === 1
          ? `Your ${lostStreaks[0].days}-day streak for "${lostStreaks[0].habitName}" was broken. ${lostStreaks[0].lostPoints > 0 ? `You lost ${Math.round(lostStreaks[0].lostPoints)} locked points.` : ''}`
          : `${lostStreaks.length} streaks were broken due to missed habits. Keep going - you can rebuild them!`;

        setTimeout(() => {
          Alert.alert(
            'Streak Lost',
            message,
            [{ text: 'OK', style: 'default' }]
          );
        }, 500);
      }
    };

    if (habits.length > 0 && streaks.length > 0) {
      checkMissedHabits();
    }
  }, [habits.length]);

  const refreshData = useCallback(async () => {
    try {
      const [loadedHabits, loadedStreaks, loadedRewards, loadedSafePoints, loadedSettings, loadedCompletions] =
        await Promise.all([
          db.getAllHabits(),
          db.getAllStreaks(),
          db.getAllRewards(),
          db.getSafePoints(),
          db.getAppSettings(),
          db.getCompletionsForDate(getTodayDate()),
        ]);

      setHabits(loadedHabits);
      setStreaks(loadedStreaks);
      setRewards(loadedRewards);
      setSafePoints(loadedSafePoints.total);
      setSettings(loadedSettings);
      setTodayCompletions(loadedCompletions);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, []);

  const loadHabits = useCallback(async () => {
    const loadedHabits = await db.getAllHabits();
    setHabits(loadedHabits);
  }, []);

  const createHabit = useCallback(async (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'steps'> & { steps: HabitStepInput[] }) => {
    const newHabit = await db.createHabit(habit);
    await refreshData();
    return newHabit;
  }, [refreshData]);

  const updateHabit = useCallback(async (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'steps'> & { steps?: HabitStepInput[] }>) => {
    const updatedHabit = await db.updateHabit(id, updates);
    await refreshData();
    return updatedHabit;
  }, [refreshData]);

  const deleteHabit = useCallback(async (id: string) => {
    await db.deleteHabit(id);
    await refreshData();
  }, [refreshData]);

  const duplicateHabit = useCallback(async (id: string) => {
    const newHabit = await db.duplicateHabit(id);
    await refreshData();
    return newHabit;
  }, [refreshData]);

  const completeHabit = useCallback(async (
    habit: Habit,
    timeOfDay: TimeOfDay,
    stepResponses: StepResponse[]
  ) => {
    const today = getTodayDate();
    const multiplier = generateRandomMultiplier();
    const points = calculatePoints(habit.basePoints, multiplier);

    // Create completion record
    await db.createHabitCompletion({
      habitId: habit.id,
      habitName: habit.name,
      completedAt: new Date().toISOString(),
      timeOfDay,
      completed: true,
      pointsGenerated: points,
      multiplierUsed: multiplier,
      stepResponses,
    });

    // Update streak
    const streak = streaks.find(s => s.habitId === habit.id);
    const wasYesterday = streak ? wasCompletedYesterday(streak.lastCompletedDate) : false;
    const wasToday = streak ? wasCompletedToday(streak.lastCompletedDate) : false;

    if (!wasToday) {
      let newStreak = 1;
      let lockedPoints = points;
      let fixedPoints = streak?.fixedPoints || 0;
      let permanentPoints = streak?.permanentPoints || 0;
      let reachedMilestone = false;

      if (wasYesterday && streak) {
        newStreak = streak.currentStreak + 1;
        lockedPoints = streak.lockedPoints + points;

        // Check for day 7 milestone
        if (newStreak === 7) {
          // Move locked points to fixed
          fixedPoints += lockedPoints;
          lockedPoints = 0;
          reachedMilestone = true;
        } else if (newStreak > 7 && newStreak < 21) {
          // After day 7, points go directly to fixed
          fixedPoints += points;
          lockedPoints = streak.lockedPoints;
        }

        // Check for day 21 milestone
        if (newStreak === 21) {
          // Move all to permanent
          permanentPoints += fixedPoints + lockedPoints;
          fixedPoints = 0;
          lockedPoints = 0;
          reachedMilestone = true;
        } else if (newStreak > 21) {
          // After day 21, points go directly to permanent
          permanentPoints += points;
          lockedPoints = streak.lockedPoints;
          fixedPoints = streak.fixedPoints;
        }
      }

      await db.updateStreak(habit.id, {
        currentStreak: newStreak,
        lockedPoints,
        fixedPoints,
        permanentPoints,
        lastCompletedDate: today,
        startDate: newStreak === 1 ? today : (streak?.startDate || today),
      });

      // Trigger milestone haptic if reached day 7 or day 21
      if (reachedMilestone) {
        Haptics.milestoneAchievement();
      }
    }

    // Check for perfect day
    const activeHabitsToday = filterHabitsForDayTime(habits, currentDayOfWeek, timeOfDay);
    const completionsToday = await db.getCompletionsForDate(today);
    const completedIds = new Set(completionsToday.filter(c => c.completed).map(c => c.habitId));
    completedIds.add(habit.id); // Include current completion

    const allCompleted = activeHabitsToday.every(h => completedIds.has(h.id));

    let isPerfectDay = false;
    let perfectDayBonus = 0;

    if (allCompleted && activeHabitsToday.length > 0) {
      const dailyStatus = await db.getDailyStatus(today);

      if (!dailyStatus?.bonusAwarded) {
        isPerfectDay = true;
        perfectDayBonus = settings.perfectDayBonus;

        // Add safe points for perfect day
        await db.addSafePoints(perfectDayBonus);

        // Record perfect day completion
        await db.createHabitCompletion({
          habitId: 'perfect_day',
          habitName: 'Perfect Day',
          completedAt: new Date().toISOString(),
          timeOfDay,
          completed: true,
          pointsGenerated: perfectDayBonus,
          multiplierUsed: 1,
          stepResponses: [],
        });

        // Update daily status
        await db.updateDailyStatus(today, {
          isPerfectDay: true,
          habitsCompleted: activeHabitsToday.length,
          totalHabits: activeHabitsToday.length,
          bonusAwarded: true,
        });
      }
    }

    await refreshData();

    return { points, multiplier, isPerfectDay, perfectDayBonus };
  }, [habits, streaks, settings.perfectDayBonus, currentDayOfWeek, refreshData]);

  const isHabitCompletedTodayFn = useCallback((habitId: string, timeOfDay: TimeOfDay): boolean => {
    return todayCompletions.some(
      c => c.habitId === habitId && c.timeOfDay === timeOfDay && c.completed
    );
  }, [todayCompletions]);

  const loadRewards = useCallback(async () => {
    const loadedRewards = await db.getAllRewards();
    setRewards(loadedRewards);
  }, []);

  const createReward = useCallback(async (reward: Omit<Reward, 'id' | 'status' | 'createdAt'>) => {
    const newReward = await db.createReward(reward);
    await loadRewards();
    return newReward;
  }, [loadRewards]);

  const updateRewardFn = useCallback(async (id: string, updates: Partial<Omit<Reward, 'id' | 'createdAt'>>) => {
    const updatedReward = await db.updateReward(id, updates);
    await loadRewards();
    return updatedReward;
  }, [loadRewards]);

  const deleteReward = useCallback(async (id: string) => {
    await db.deleteReward(id);
    await loadRewards();
  }, [loadRewards]);

  const redeemReward = useCallback(async (reward: Reward): Promise<boolean> => {
    if (pointsSummary.spendable < reward.cost) {
      return false;
    }

    // Subtract points (first from safe, then from fixed)
    let remaining = reward.cost;

    if (safePoints >= remaining) {
      await db.subtractSafePoints(remaining);
    } else {
      // Use all safe points first
      if (safePoints > 0) {
        await db.subtractSafePoints(safePoints);
        remaining -= safePoints;
      }

      // Then subtract from fixed points in streaks
      for (const streak of streaks) {
        if (remaining <= 0) break;

        const available = streak.fixedPoints + streak.permanentPoints;
        if (available > 0) {
          const toSubtract = Math.min(available, remaining);

          // First subtract from fixed, then permanent
          let newFixed = streak.fixedPoints;
          let newPermanent = streak.permanentPoints;

          if (streak.fixedPoints >= toSubtract) {
            newFixed -= toSubtract;
          } else {
            const fromPermanent = toSubtract - streak.fixedPoints;
            newFixed = 0;
            newPermanent -= fromPermanent;
          }

          await db.updateStreak(streak.habitId, {
            fixedPoints: newFixed,
            permanentPoints: newPermanent,
          });

          remaining -= toSubtract;
        }
      }
    }

    // Update reward status
    if (reward.type === 'one_shot') {
      // Delete one-shot rewards after redemption
      await db.deleteReward(reward.id);
    } else {
      // Mark permanent rewards as unlocked
      await db.updateReward(reward.id, {
        status: 'unlocked',
        redeemedAt: new Date().toISOString(),
      });
    }

    await refreshData();
    return true;
  }, [pointsSummary.spendable, safePoints, streaks, refreshData]);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    const newSettings = await db.updateAppSettings(updates);
    setSettings(newSettings);
  }, []);

  const getHabitsForCurrentTime = useCallback(() => {
    return filterHabitsForDayTime(habits, currentDayOfWeek, currentTimeOfDay);
  }, [habits, currentDayOfWeek, currentTimeOfDay]);

  const value: AppContextType = {
    isLoading,
    habits,
    streaks,
    rewards,
    pointsSummary,
    settings,
    todayCompletions,
    currentTimeOfDay,
    currentDayOfWeek,
    loadHabits,
    createHabit,
    updateHabit,
    deleteHabit,
    duplicateHabit,
    completeHabit,
    isHabitCompletedToday: isHabitCompletedTodayFn,
    loadRewards,
    createReward,
    updateReward: updateRewardFn,
    deleteReward,
    redeemReward,
    updateSettings,
    getHabitsForCurrentTime,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

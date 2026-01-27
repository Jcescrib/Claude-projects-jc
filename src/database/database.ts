import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';
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
  StepResponse,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

let db: SQLite.SQLiteDatabase | null = null;

export const initDatabase = async (): Promise<void> => {
  db = await SQLite.openDatabaseAsync('habit_tracker.db');
  await db.execAsync(CREATE_TABLES_SQL);
};

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return db;
};

// ==================== HABITS ====================

export const getAllHabits = async (): Promise<Habit[]> => {
  const database = getDatabase();
  const habits = await database.getAllAsync<any>('SELECT * FROM habits ORDER BY created_at DESC');

  const habitsWithSteps = await Promise.all(
    habits.map(async (habit) => {
      const steps = await getHabitSteps(habit.id);
      return {
        id: habit.id,
        name: habit.name,
        isActive: habit.is_active === 1,
        daysOfWeek: JSON.parse(habit.days_of_week) as DayOfWeek[],
        timesOfDay: JSON.parse(habit.times_of_day) as TimeOfDay[],
        basePoints: habit.base_points,
        steps,
        createdAt: habit.created_at,
        updatedAt: habit.updated_at,
      };
    })
  );

  return habitsWithSteps;
};

export const getHabitById = async (id: string): Promise<Habit | null> => {
  const database = getDatabase();
  const habit = await database.getFirstAsync<any>('SELECT * FROM habits WHERE id = ?', [id]);

  if (!habit) return null;

  const steps = await getHabitSteps(id);

  return {
    id: habit.id,
    name: habit.name,
    isActive: habit.is_active === 1,
    daysOfWeek: JSON.parse(habit.days_of_week) as DayOfWeek[],
    timesOfDay: JSON.parse(habit.times_of_day) as TimeOfDay[],
    basePoints: habit.base_points,
    steps,
    createdAt: habit.created_at,
    updatedAt: habit.updated_at,
  };
};

export const createHabit = async (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'steps'> & { steps: HabitStepInput[] }): Promise<Habit> => {
  const database = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  await database.runAsync(
    `INSERT INTO habits (id, name, is_active, days_of_week, times_of_day, base_points, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      habit.name,
      habit.isActive ? 1 : 0,
      JSON.stringify(habit.daysOfWeek),
      JSON.stringify(habit.timesOfDay),
      habit.basePoints,
      now,
      now,
    ]
  );

  // Create steps
  for (let i = 0; i < habit.steps.length; i++) {
    await createHabitStep({ ...habit.steps[i], habitId: id, orderIndex: i });
  }

  // Initialize streak for this habit
  await database.runAsync(
    `INSERT INTO streaks (habit_id, current_streak, locked_points, fixed_points, permanent_points)
     VALUES (?, 0, 0, 0, 0)`,
    [id]
  );

  return (await getHabitById(id))!;
};

export const updateHabit = async (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'steps'> & { steps?: HabitStepInput[] }>): Promise<Habit | null> => {
  const database = getDatabase();
  const habit = await getHabitById(id);

  if (!habit) return null;

  const now = new Date().toISOString();

  const fields: string[] = ['updated_at = ?'];
  const values: any[] = [now];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.isActive !== undefined) {
    fields.push('is_active = ?');
    values.push(updates.isActive ? 1 : 0);
  }
  if (updates.daysOfWeek !== undefined) {
    fields.push('days_of_week = ?');
    values.push(JSON.stringify(updates.daysOfWeek));
  }
  if (updates.timesOfDay !== undefined) {
    fields.push('times_of_day = ?');
    values.push(JSON.stringify(updates.timesOfDay));
  }
  if (updates.basePoints !== undefined) {
    fields.push('base_points = ?');
    values.push(updates.basePoints);
  }

  values.push(id);

  await database.runAsync(
    `UPDATE habits SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  // Update steps if provided
  if (updates.steps !== undefined) {
    // Delete existing steps
    await database.runAsync('DELETE FROM habit_steps WHERE habit_id = ?', [id]);
    // Create new steps
    for (let i = 0; i < updates.steps.length; i++) {
      await createHabitStep({ ...updates.steps[i], habitId: id, orderIndex: i });
    }
  }

  return getHabitById(id);
};

export const deleteHabit = async (id: string): Promise<void> => {
  const database = getDatabase();
  await database.runAsync('DELETE FROM habits WHERE id = ?', [id]);
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
    steps: habit.steps.map(s => ({
      ...s,
      id: uuidv4(),
    })),
  });
};

// ==================== HABIT STEPS ====================

export const getHabitSteps = async (habitId: string): Promise<HabitStep[]> => {
  const database = getDatabase();
  const steps = await database.getAllAsync<any>(
    'SELECT * FROM habit_steps WHERE habit_id = ? ORDER BY order_index',
    [habitId]
  );

  return steps.map((step) => ({
    id: step.id,
    habitId: step.habit_id,
    orderIndex: step.order_index,
    questionText: step.question_text,
    responseType: step.response_type,
    multipleChoiceOptions: step.multiple_choice_options ? JSON.parse(step.multiple_choice_options) : undefined,
    timerEnabled: step.timer_enabled === 1,
    timerSeconds: step.timer_seconds,
  }));
};

export const createHabitStep = async (step: Omit<HabitStep, 'id'> & { id?: string }): Promise<HabitStep> => {
  const database = getDatabase();
  const id = step.id || uuidv4();

  await database.runAsync(
    `INSERT INTO habit_steps (id, habit_id, order_index, question_text, response_type, multiple_choice_options, timer_enabled, timer_seconds)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      step.habitId,
      step.orderIndex,
      step.questionText,
      step.responseType,
      step.multipleChoiceOptions ? JSON.stringify(step.multipleChoiceOptions) : null,
      step.timerEnabled ? 1 : 0,
      step.timerSeconds,
    ]
  );

  return { ...step, id };
};

// ==================== HABIT COMPLETIONS ====================

export const getCompletionsForDate = async (date: string): Promise<HabitCompletion[]> => {
  const database = getDatabase();
  const completions = await database.getAllAsync<any>(
    `SELECT * FROM habit_completions WHERE date(completed_at) = date(?)`,
    [date]
  );

  return completions.map((c) => ({
    id: c.id,
    habitId: c.habit_id,
    habitName: c.habit_name,
    completedAt: c.completed_at,
    timeOfDay: c.time_of_day as TimeOfDay,
    completed: c.completed === 1,
    pointsGenerated: c.points_generated,
    multiplierUsed: c.multiplier_used,
    stepResponses: c.step_responses ? JSON.parse(c.step_responses) : [],
  }));
};

export const isHabitCompletedToday = async (habitId: string, timeOfDay: TimeOfDay): Promise<boolean> => {
  const database = getDatabase();
  const today = new Date().toISOString().split('T')[0];

  const result = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM habit_completions
     WHERE habit_id = ? AND date(completed_at) = ? AND time_of_day = ? AND completed = 1`,
    [habitId, today, timeOfDay]
  );

  return (result?.count || 0) > 0;
};

export const createHabitCompletion = async (completion: Omit<HabitCompletion, 'id'>): Promise<HabitCompletion> => {
  const database = getDatabase();
  const id = uuidv4();

  await database.runAsync(
    `INSERT INTO habit_completions (id, habit_id, habit_name, completed_at, time_of_day, completed, points_generated, multiplier_used, step_responses)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      completion.habitId,
      completion.habitName,
      completion.completedAt,
      completion.timeOfDay,
      completion.completed ? 1 : 0,
      completion.pointsGenerated,
      completion.multiplierUsed,
      JSON.stringify(completion.stepResponses),
    ]
  );

  return { ...completion, id };
};

// ==================== STREAKS ====================

export const getStreak = async (habitId: string): Promise<Streak | null> => {
  const database = getDatabase();
  const streak = await database.getFirstAsync<any>(
    'SELECT * FROM streaks WHERE habit_id = ?',
    [habitId]
  );

  if (!streak) return null;

  return {
    habitId: streak.habit_id,
    currentStreak: streak.current_streak,
    lockedPoints: streak.locked_points,
    fixedPoints: streak.fixed_points,
    permanentPoints: streak.permanent_points,
    lastCompletedDate: streak.last_completed_date,
    startDate: streak.start_date,
  };
};

export const getAllStreaks = async (): Promise<Streak[]> => {
  const database = getDatabase();
  const streaks = await database.getAllAsync<any>('SELECT * FROM streaks');

  return streaks.map((s) => ({
    habitId: s.habit_id,
    currentStreak: s.current_streak,
    lockedPoints: s.locked_points,
    fixedPoints: s.fixed_points,
    permanentPoints: s.permanent_points,
    lastCompletedDate: s.last_completed_date,
    startDate: s.start_date,
  }));
};

export const updateStreak = async (habitId: string, updates: Partial<Streak>): Promise<void> => {
  const database = getDatabase();

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.currentStreak !== undefined) {
    fields.push('current_streak = ?');
    values.push(updates.currentStreak);
  }
  if (updates.lockedPoints !== undefined) {
    fields.push('locked_points = ?');
    values.push(updates.lockedPoints);
  }
  if (updates.fixedPoints !== undefined) {
    fields.push('fixed_points = ?');
    values.push(updates.fixedPoints);
  }
  if (updates.permanentPoints !== undefined) {
    fields.push('permanent_points = ?');
    values.push(updates.permanentPoints);
  }
  if (updates.lastCompletedDate !== undefined) {
    fields.push('last_completed_date = ?');
    values.push(updates.lastCompletedDate);
  }
  if (updates.startDate !== undefined) {
    fields.push('start_date = ?');
    values.push(updates.startDate);
  }

  if (fields.length === 0) return;

  values.push(habitId);

  await database.runAsync(
    `UPDATE streaks SET ${fields.join(', ')} WHERE habit_id = ?`,
    values
  );
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
  const database = getDatabase();
  const result = await database.getFirstAsync<any>('SELECT * FROM safe_points WHERE id = 1');

  return {
    total: result?.total || 0,
    lastUpdated: result?.last_updated || new Date().toISOString(),
  };
};

export const addSafePoints = async (amount: number): Promise<SafePoints> => {
  const database = getDatabase();
  const now = new Date().toISOString();

  await database.runAsync(
    'UPDATE safe_points SET total = total + ?, last_updated = ? WHERE id = 1',
    [amount, now]
  );

  return getSafePoints();
};

export const subtractSafePoints = async (amount: number): Promise<SafePoints> => {
  const database = getDatabase();
  const now = new Date().toISOString();

  await database.runAsync(
    'UPDATE safe_points SET total = MAX(0, total - ?), last_updated = ? WHERE id = 1',
    [amount, now]
  );

  return getSafePoints();
};

// ==================== REWARDS ====================

export const getAllRewards = async (): Promise<Reward[]> => {
  const database = getDatabase();
  const rewards = await database.getAllAsync<any>('SELECT * FROM rewards ORDER BY created_at DESC');

  return rewards.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    cost: r.cost,
    type: r.type,
    status: r.status,
    redeemedAt: r.redeemed_at,
    createdAt: r.created_at,
  }));
};

export const createReward = async (reward: Omit<Reward, 'id' | 'status' | 'createdAt'>): Promise<Reward> => {
  const database = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString();

  await database.runAsync(
    `INSERT INTO rewards (id, name, description, cost, type, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'available', ?)`,
    [id, reward.name, reward.description || null, reward.cost, reward.type, now]
  );

  return {
    id,
    name: reward.name,
    description: reward.description,
    cost: reward.cost,
    type: reward.type,
    status: 'available',
    createdAt: now,
  };
};

export const updateReward = async (id: string, updates: Partial<Omit<Reward, 'id' | 'createdAt'>>): Promise<Reward | null> => {
  const database = getDatabase();

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.cost !== undefined) {
    fields.push('cost = ?');
    values.push(updates.cost);
  }
  if (updates.type !== undefined) {
    fields.push('type = ?');
    values.push(updates.type);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.redeemedAt !== undefined) {
    fields.push('redeemed_at = ?');
    values.push(updates.redeemedAt);
  }

  if (fields.length === 0) return null;

  values.push(id);

  await database.runAsync(
    `UPDATE rewards SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  const reward = await database.getFirstAsync<any>('SELECT * FROM rewards WHERE id = ?', [id]);

  if (!reward) return null;

  return {
    id: reward.id,
    name: reward.name,
    description: reward.description,
    cost: reward.cost,
    type: reward.type,
    status: reward.status,
    redeemedAt: reward.redeemed_at,
    createdAt: reward.created_at,
  };
};

export const deleteReward = async (id: string): Promise<void> => {
  const database = getDatabase();
  await database.runAsync('DELETE FROM rewards WHERE id = ?', [id]);
};

// ==================== DAILY STATUS ====================

export const getDailyStatus = async (date: string): Promise<DailyStatus | null> => {
  const database = getDatabase();
  const status = await database.getFirstAsync<any>(
    'SELECT * FROM daily_status WHERE date = ?',
    [date]
  );

  if (!status) return null;

  return {
    date: status.date,
    isPerfectDay: status.is_perfect_day === 1,
    habitsCompleted: status.habits_completed,
    totalHabits: status.total_habits,
    bonusAwarded: status.bonus_awarded === 1,
  };
};

export const updateDailyStatus = async (date: string, updates: Partial<DailyStatus>): Promise<void> => {
  const database = getDatabase();

  // Check if exists
  const existing = await getDailyStatus(date);

  if (!existing) {
    await database.runAsync(
      `INSERT INTO daily_status (date, is_perfect_day, habits_completed, total_habits, bonus_awarded)
       VALUES (?, ?, ?, ?, ?)`,
      [
        date,
        updates.isPerfectDay ? 1 : 0,
        updates.habitsCompleted || 0,
        updates.totalHabits || 0,
        updates.bonusAwarded ? 1 : 0,
      ]
    );
  } else {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.isPerfectDay !== undefined) {
      fields.push('is_perfect_day = ?');
      values.push(updates.isPerfectDay ? 1 : 0);
    }
    if (updates.habitsCompleted !== undefined) {
      fields.push('habits_completed = ?');
      values.push(updates.habitsCompleted);
    }
    if (updates.totalHabits !== undefined) {
      fields.push('total_habits = ?');
      values.push(updates.totalHabits);
    }
    if (updates.bonusAwarded !== undefined) {
      fields.push('bonus_awarded = ?');
      values.push(updates.bonusAwarded ? 1 : 0);
    }

    if (fields.length > 0) {
      values.push(date);
      await database.runAsync(
        `UPDATE daily_status SET ${fields.join(', ')} WHERE date = ?`,
        values
      );
    }
  }
};

// ==================== APP SETTINGS ====================

export const getAppSettings = async (): Promise<AppSettings> => {
  const database = getDatabase();
  const settings = await database.getFirstAsync<any>('SELECT * FROM app_settings WHERE id = 1');

  return {
    perfectDayBonus: settings?.perfect_day_bonus || 15,
    darkMode: settings?.dark_mode === 1,
  };
};

export const updateAppSettings = async (updates: Partial<AppSettings>): Promise<AppSettings> => {
  const database = getDatabase();

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.perfectDayBonus !== undefined) {
    fields.push('perfect_day_bonus = ?');
    values.push(updates.perfectDayBonus);
  }
  if (updates.darkMode !== undefined) {
    fields.push('dark_mode = ?');
    values.push(updates.darkMode ? 1 : 0);
  }

  if (fields.length > 0) {
    await database.runAsync(
      `UPDATE app_settings SET ${fields.join(', ')} WHERE id = 1`,
      values
    );
  }

  return getAppSettings();
};

// ==================== EXPORT DATA ====================

export const getAllCompletions = async (): Promise<HabitCompletion[]> => {
  const database = getDatabase();
  const completions = await database.getAllAsync<any>(
    'SELECT * FROM habit_completions ORDER BY completed_at DESC'
  );

  return completions.map((c) => ({
    id: c.id,
    habitId: c.habit_id,
    habitName: c.habit_name,
    completedAt: c.completed_at,
    timeOfDay: c.time_of_day as TimeOfDay,
    completed: c.completed === 1,
    pointsGenerated: c.points_generated,
    multiplierUsed: c.multiplier_used,
    stepResponses: c.step_responses ? JSON.parse(c.step_responses) : [],
  }));
};

export const getRedeemedRewards = async (): Promise<Reward[]> => {
  const database = getDatabase();
  const rewards = await database.getAllAsync<any>(
    `SELECT * FROM rewards WHERE status = 'unlocked' OR redeemed_at IS NOT NULL ORDER BY redeemed_at DESC`
  );

  return rewards.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    cost: r.cost,
    type: r.type,
    status: r.status,
    redeemedAt: r.redeemed_at,
    createdAt: r.created_at,
  }));
};

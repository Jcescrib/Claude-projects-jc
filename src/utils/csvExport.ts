import { Paths, File } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { HabitCompletion, Streak, Reward, PointsSummary } from '../types';
import { escapeCSV, getTodayDate } from './helpers';
import * as db from '../database/database';

export interface ExportData {
  completions: HabitCompletion[];
  streaks: Streak[];
  rewards: Reward[];
  pointsSummary: PointsSummary;
}

export const generateCSVContent = async (): Promise<string> => {
  // Fetch all data
  const completions = await db.getAllCompletions();
  const streaks = await db.getAllStreaks();
  const habits = await db.getAllHabits();
  const rewards = await db.getRedeemedRewards();
  const safePoints = await db.getSafePoints();

  // Build CSV content
  let csv = '';

  // Header section
  csv += '# HABIT TRACKER EXPORT\n';
  csv += `# Generated: ${new Date().toISOString()}\n`;
  csv += '\n';

  // Completions section
  csv += '# HABIT COMPLETIONS\n';
  csv += 'date,time,habit,completed,points_generated,points_type,current_streak\n';

  completions.forEach((completion) => {
    const streak = streaks.find((s) => s.habitId === completion.habitId);
    const date = completion.completedAt.split('T')[0];
    const time = new Date(completion.completedAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    let pointsType = 'streak';
    if (completion.habitId === 'perfect_day') {
      pointsType = 'safe';
    } else if (!completion.completed) {
      pointsType = 'streak_lost';
    }

    csv += `${date},${time},${escapeCSV(completion.habitName)},${completion.completed ? 1 : 0},${completion.pointsGenerated.toFixed(1)},${pointsType},${streak?.currentStreak ?? 'N/A'}\n`;
  });

  csv += '\n';

  // Summary section
  csv += '# POINTS SUMMARY\n';
  let totalSpendable = safePoints.total;
  let totalLocked = 0;

  streaks.forEach((streak) => {
    totalSpendable += streak.fixedPoints + streak.permanentPoints;
    totalLocked += streak.lockedPoints;
  });

  csv += `total_spendable,${totalSpendable.toFixed(1)}\n`;
  csv += `total_locked,${totalLocked.toFixed(1)}\n`;
  csv += `safe_points,${safePoints.total.toFixed(1)}\n`;
  csv += '\n';

  // Streaks section
  csv += '# CURRENT STREAKS\n';
  csv += 'habit,current_streak,locked_points,fixed_points,permanent_points,last_completed\n';

  habits.forEach((habit) => {
    const streak = streaks.find((s) => s.habitId === habit.id);
    if (streak) {
      csv += `${escapeCSV(habit.name)},${streak.currentStreak},${streak.lockedPoints.toFixed(1)},${streak.fixedPoints.toFixed(1)},${streak.permanentPoints.toFixed(1)},${streak.lastCompletedDate || 'N/A'}\n`;
    }
  });

  csv += '\n';

  // Redeemed rewards section
  if (rewards.length > 0) {
    csv += '# REDEEMED REWARDS\n';
    csv += 'reward,cost,type,redeemed_date\n';

    rewards.forEach((reward) => {
      const redeemedDate = reward.redeemedAt
        ? new Date(reward.redeemedAt).toISOString().split('T')[0]
        : 'N/A';
      csv += `${escapeCSV(reward.name)},${reward.cost},${reward.type},${redeemedDate}\n`;
    });
  }

  return csv;
};

export const exportToCSV = async (): Promise<boolean> => {
  try {
    const csv = await generateCSVContent();
    const today = getTodayDate();
    const fileName = `habit_tracker_export_${today}.csv`;

    // Create file in the document directory using new API
    const file = new File(Paths.document, fileName);

    // Write the content to the file
    await file.write(csv);

    // Check if sharing is available
    const canShare = await isAvailableAsync();

    if (canShare) {
      await shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Habit Tracker Data',
        UTI: 'public.comma-separated-values-text',
      });
      return true;
    } else {
      console.log('Sharing is not available on this device');
      return false;
    }
  } catch (error) {
    console.error('Failed to export CSV:', error);
    return false;
  }
};

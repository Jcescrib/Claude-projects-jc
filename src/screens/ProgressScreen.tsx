import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { Card, PointsDisplay, ProgressBar } from '../components';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../constants/theme';
import { getStreakStatusText } from '../utils/helpers';

export const ProgressScreen: React.FC = () => {
  const { habits, streaks, pointsSummary } = useApp();

  const activeHabits = useMemo(() => habits.filter((h) => h.isActive), [habits]);

  const stats = useMemo(() => {
    let longestStreak = 0;
    let totalStreakDays = 0;
    let habitsAt7Days = 0;
    let habitsAt21Days = 0;

    streaks.forEach((streak) => {
      if (streak.currentStreak > longestStreak) {
        longestStreak = streak.currentStreak;
      }
      totalStreakDays += streak.currentStreak;
      if (streak.currentStreak >= 7) habitsAt7Days++;
      if (streak.currentStreak >= 21) habitsAt21Days++;
    });

    return {
      longestStreak,
      totalStreakDays,
      habitsAt7Days,
      habitsAt21Days,
      totalHabits: habits.length,
      activeHabits: activeHabits.length,
    };
  }, [habits, activeHabits, streaks]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>My Progress</Text>

        <PointsDisplay pointsSummary={pointsSummary} />

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{stats.longestStreak}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statEmoji}>📊</Text>
            <Text style={styles.statValue}>{stats.totalStreakDays}</Text>
            <Text style={styles.statLabel}>Total Streak Days</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statEmoji}>✅</Text>
            <Text style={styles.statValue}>{stats.habitsAt7Days}</Text>
            <Text style={styles.statLabel}>7+ Day Habits</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statValue}>{stats.habitsAt21Days}</Text>
            <Text style={styles.statLabel}>Consolidated (21+)</Text>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>Habit Streaks</Text>

        {activeHabits.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No active habits yet. Create some habits to start tracking your progress!
            </Text>
          </Card>
        ) : (
          activeHabits.map((habit) => {
            const streak = streaks.find((s) => s.habitId === habit.id);
            const currentStreak = streak?.currentStreak || 0;
            const progress = Math.min(currentStreak / 21, 1);

            return (
              <Card key={habit.id} style={styles.habitCard}>
                <View style={styles.habitHeader}>
                  <Text style={styles.habitName}>{habit.name}</Text>
                  {currentStreak > 0 && (
                    <View style={styles.streakBadge}>
                      <Text style={styles.streakBadgeText}>
                        {currentStreak} 🔥
                      </Text>
                    </View>
                  )}
                </View>

                <ProgressBar
                  progress={progress}
                  color={
                    currentStreak >= 21
                      ? Colors.success
                      : currentStreak >= 7
                      ? Colors.primary
                      : Colors.accent
                  }
                  height={8}
                  containerStyle={styles.habitProgress}
                />

                <View style={styles.habitMilestones}>
                  <View style={styles.milestone}>
                    <View
                      style={[
                        styles.milestoneMarker,
                        currentStreak >= 7 && styles.milestoneMarkerActive,
                      ]}
                    >
                      <Text style={styles.milestoneCheck}>
                        {currentStreak >= 7 ? '✓' : ''}
                      </Text>
                    </View>
                    <Text style={styles.milestoneText}>Day 7</Text>
                  </View>

                  <View style={styles.milestone}>
                    <View
                      style={[
                        styles.milestoneMarker,
                        currentStreak >= 21 && styles.milestoneMarkerActive,
                      ]}
                    >
                      <Text style={styles.milestoneCheck}>
                        {currentStreak >= 21 ? '✓' : ''}
                      </Text>
                    </View>
                    <Text style={styles.milestoneText}>Day 21</Text>
                  </View>
                </View>

                <View style={styles.habitStatus}>
                  <Text style={styles.habitStatusText}>
                    {getStreakStatusText(streak || {
                      habitId: habit.id,
                      currentStreak: 0,
                      lockedPoints: 0,
                      fixedPoints: 0,
                      permanentPoints: 0,
                      lastCompletedDate: null,
                      startDate: null,
                    })}
                  </Text>
                </View>

                {streak && (streak.lockedPoints > 0 || streak.fixedPoints > 0 || streak.permanentPoints > 0) && (
                  <View style={styles.pointsBreakdown}>
                    {streak.lockedPoints > 0 && (
                      <View style={styles.pointItem}>
                        <Text style={styles.pointIcon}>🔒</Text>
                        <Text style={styles.pointValue}>
                          {Math.round(streak.lockedPoints)} locked
                        </Text>
                      </View>
                    )}
                    {streak.fixedPoints > 0 && (
                      <View style={styles.pointItem}>
                        <Text style={styles.pointIcon}>✅</Text>
                        <Text style={styles.pointValue}>
                          {Math.round(streak.fixedPoints)} fixed
                        </Text>
                      </View>
                    )}
                    {streak.permanentPoints > 0 && (
                      <View style={styles.pointItem}>
                        <Text style={styles.pointIcon}>🏆</Text>
                        <Text style={styles.pointValue}>
                          {Math.round(streak.permanentPoints)} permanent
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  habitCard: {
    marginBottom: Spacing.md,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  habitName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  streakBadge: {
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  streakBadgeText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.accent,
  },
  habitProgress: {
    marginBottom: Spacing.sm,
  },
  habitMilestones: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.sm,
  },
  milestone: {
    alignItems: 'center',
  },
  milestoneMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneMarkerActive: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  milestoneCheck: {
    color: Colors.textOnPrimary,
    fontSize: 12,
    fontWeight: FontWeights.bold,
  },
  milestoneText: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  habitStatus: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  habitStatusText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  pointsBreakdown: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  pointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  pointIcon: {
    fontSize: 14,
  },
  pointValue: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
});

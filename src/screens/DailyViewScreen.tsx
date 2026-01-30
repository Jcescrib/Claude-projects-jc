import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { HabitCard, EmptyState, PointsDisplay } from '../components';
import { Colors, Spacing, FontSizes, FontWeights, Shadows, BorderRadius, TimeOfDayConfig } from '../constants/theme';
import { TodayStackParamList, TimeOfDay, Habit } from '../types';
import { formatDate, filterHabitsForDayTime, orderedTimes } from '../utils/helpers';

type NavigationProp = NativeStackNavigationProp<TodayStackParamList, 'DailyView'>;

export const DailyViewScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    habits,
    streaks,
    pointsSummary,
    currentDayOfWeek,
    currentTimeOfDay,
    isHabitCompletedToday,
    refreshData,
  } = useApp();

  const [selectedTime, setSelectedTime] = useState<TimeOfDay>(currentTimeOfDay);
  const [refreshing, setRefreshing] = useState(false);

  const isRefreshing: boolean = refreshing === true;

  const filteredHabits = useMemo(() => {
    return filterHabitsForDayTime(habits, currentDayOfWeek, selectedTime);
  }, [habits, currentDayOfWeek, selectedTime]);

  const completedCount = useMemo(() => {
    return filteredHabits.filter((h) => isHabitCompletedToday(h.id, selectedTime)).length;
  }, [filteredHabits, isHabitCompletedToday, selectedTime]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const handleHabitPress = useCallback((habit: Habit) => {
    const isCompleted = isHabitCompletedToday(habit.id, selectedTime);
    if (!isCompleted) {
      navigation.navigate('HabitWizard', { habitId: habit.id, timeOfDay: selectedTime });
    }
  }, [isHabitCompletedToday, selectedTime, navigation]);

  const renderTimeTab = useCallback((time: TimeOfDay, index: number) => {
    const config = TimeOfDayConfig[time];
    const isSelected = selectedTime === time;
    const isCurrent = time === currentTimeOfDay;

    const tabStyle = [
      styles.timeTab,
      isSelected ? styles.timeTabSelected : null,
      isSelected ? { backgroundColor: config.color } : null,
      index > 0 ? { marginLeft: Spacing.sm } : null,
    ];

    const labelStyle = [
      styles.timeTabLabel,
      isSelected ? styles.timeTabLabelSelected : null,
    ];

    return (
      <TouchableOpacity
        key={time}
        onPress={() => setSelectedTime(time)}
        style={tabStyle}
        activeOpacity={0.7}
      >
        <Text style={styles.timeTabEmoji}>{config.icon}</Text>
        <Text style={labelStyle}>{config.label}</Text>
        {isCurrent && !isSelected ? (
          <View style={[styles.currentDot, { backgroundColor: config.color }]} />
        ) : null}
      </TouchableOpacity>
    );
  }, [selectedTime, currentTimeOfDay]);

  const renderHabit = useCallback(({ item }: { item: Habit }) => {
    const streak = streaks.find((s) => s.habitId === item.id);
    const isCompleted: boolean = isHabitCompletedToday(item.id, selectedTime) === true;

    return (
      <HabitCard
        habit={item}
        streak={streak}
        isCompleted={isCompleted}
        onPress={() => handleHabitPress(item)}
      />
    );
  }, [streaks, isHabitCompletedToday, selectedTime, handleHabitPress]);

  const progressWidth = filteredHabits.length > 0
    ? `${(completedCount / filteredHabits.length) * 100}%`
    : '0%';

  const ListHeader = useMemo(() => (
    <View style={styles.headerContainer}>
      <Text style={styles.dateText}>{formatDate(new Date())}</Text>

      <PointsDisplay pointsSummary={pointsSummary} compact={true} />

      <View style={styles.timeTabsContainer}>
        {orderedTimes.map((time, index) => renderTimeTab(time, index))}
      </View>

      {filteredHabits.length > 0 ? (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {completedCount} of {filteredHabits.length} completed
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: progressWidth as any,
                  backgroundColor: TimeOfDayConfig[selectedTime].color,
                },
              ]}
            />
          </View>
        </View>
      ) : null}
    </View>
  ), [pointsSummary, filteredHabits.length, completedCount, selectedTime, renderTimeTab, progressWidth]);

  if (filteredHabits.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {ListHeader}
        <EmptyState
          emoji="🌟"
          title="No habits for this time"
          description={`You don't have any habits scheduled for ${selectedTime.toLowerCase()}. Create new habits or check another time of day.`}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filteredHabits}
        keyExtractor={(item) => item.id}
        renderItem={renderHabit}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  headerContainer: {
    marginBottom: Spacing.lg,
  },
  dateText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  timeTabsContainer: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  timeTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    shadowColor: Shadows.sm.shadowColor,
    shadowOffset: Shadows.sm.shadowOffset,
    shadowOpacity: Shadows.sm.shadowOpacity,
    shadowRadius: Shadows.sm.shadowRadius,
    elevation: Shadows.sm.elevation,
  },
  timeTabSelected: {
    shadowColor: Shadows.md.shadowColor,
    shadowOffset: Shadows.md.shadowOffset,
    shadowOpacity: Shadows.md.shadowOpacity,
    shadowRadius: Shadows.md.shadowRadius,
    elevation: Shadows.md.elevation,
  },
  timeTabEmoji: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  timeTabLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },
  timeTabLabelSelected: {
    color: Colors.textOnPrimary,
  },
  currentDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressContainer: {
    marginTop: Spacing.sm,
  },
  progressText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
});

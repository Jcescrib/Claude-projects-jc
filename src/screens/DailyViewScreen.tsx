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
    if (!isHabitCompletedToday(habit.id, selectedTime)) {
      navigation.navigate('HabitWizard', { habitId: habit.id, timeOfDay: selectedTime });
    }
  }, [isHabitCompletedToday, selectedTime, navigation]);

  const renderTimeTab = useCallback((time: TimeOfDay) => {
    const config = TimeOfDayConfig[time];
    const isSelected = selectedTime === time;
    const isCurrent = time === currentTimeOfDay;

    return (
      <TouchableOpacity
        key={time}
        onPress={() => setSelectedTime(time)}
        style={[
          styles.timeTab,
          isSelected && styles.timeTabSelected,
          isSelected && { backgroundColor: config.color },
        ]}
        activeOpacity={0.7}
      >
        <Text style={styles.timeTabEmoji}>{config.icon}</Text>
        <Text
          style={[
            styles.timeTabLabel,
            isSelected && styles.timeTabLabelSelected,
          ]}
        >
          {config.label}
        </Text>
        {isCurrent && !isSelected && (
          <View style={[styles.currentDot, { backgroundColor: config.color }]} />
        )}
      </TouchableOpacity>
    );
  }, [selectedTime, currentTimeOfDay]);

  const renderHabit = useCallback(({ item }: { item: Habit }) => {
    const streak = streaks.find((s) => s.habitId === item.id);
    const completed = isHabitCompletedToday(item.id, selectedTime);

    return (
      <View>
        <HabitCard
          habit={item}
          streak={streak}
          isCompleted={completed === true}
          onPress={() => handleHabitPress(item)}
        />
      </View>
    );
  }, [streaks, isHabitCompletedToday, selectedTime, handleHabitPress]);

  const ListHeader = useMemo(() => (
    <View style={styles.headerContainer}>
      <Text style={styles.dateText}>{formatDate(new Date())}</Text>

      <PointsDisplay pointsSummary={pointsSummary} compact />

      <View style={styles.timeTabsContainer}>
        {orderedTimes.map(renderTimeTab)}
      </View>

      {filteredHabits.length > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {completedCount} of {filteredHabits.length} completed
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(completedCount / filteredHabits.length) * 100}%`,
                  backgroundColor: TimeOfDayConfig[selectedTime].color,
                },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  ), [pointsSummary, filteredHabits.length, completedCount, selectedTime, renderTimeTab]);

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
        showsVerticalScrollIndicator={false === true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing === true}
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
    gap: Spacing.sm,
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
    ...Shadows.sm,
  },
  timeTabSelected: {
    ...Shadows.md,
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
    height: '100%',
    borderRadius: 3,
  },
});

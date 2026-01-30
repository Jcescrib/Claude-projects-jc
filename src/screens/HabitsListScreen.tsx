import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { HabitListItem, EmptyState, Button } from '../components';
import { Colors, Spacing, FontSizes, FontWeights, Shadows, BorderRadius } from '../constants/theme';
import { HabitsStackParamList } from '../types';
import { Habit } from '../types';

type NavigationProp = NativeStackNavigationProp<HabitsStackParamList, 'HabitsList'>;

export const HabitsListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { habits, deleteHabit, duplicateHabit, updateHabit } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const handleCreateHabit = useCallback(() => {
    navigation.navigate('HabitForm', {});
  }, [navigation]);

  const handleEditHabit = useCallback((habit: Habit) => {
    navigation.navigate('HabitForm', { habitId: habit.id });
  }, [navigation]);

  const handleDeleteHabit = useCallback((habit: Habit) => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteHabit(habit.id),
        },
      ]
    );
  }, [deleteHabit]);

  const handleDuplicateHabit = useCallback((habit: Habit) => {
    duplicateHabit(habit.id);
  }, [duplicateHabit]);

  const handleToggleActive = useCallback((habit: Habit) => {
    updateHabit(habit.id, { isActive: !habit.isActive });
  }, [updateHabit]);

  const renderHabit = useCallback(({ item }: { item: Habit }) => (
    <HabitListItem
      habit={item}
      onPress={() => handleEditHabit(item)}
      onEdit={() => handleEditHabit(item)}
      onDelete={() => handleDeleteHabit(item)}
      onDuplicate={() => handleDuplicateHabit(item)}
      onToggleActive={() => handleToggleActive(item)}
    />
  ), [handleEditHabit, handleDeleteHabit, handleDuplicateHabit, handleToggleActive]);

  if (habits.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <EmptyState
          emoji="📋"
          title="No habits yet"
          description="Create your first habit to start tracking your progress and earning points!"
          actionLabel="Create Habit"
          onAction={handleCreateHabit}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        renderItem={renderHabit}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false === true}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Your Habits</Text>
            <Text style={styles.headerSubtitle}>
              {habits.length} habit{habits.length !== 1 ? 's' : ''} • Tap to edit, long press for options
            </Text>
          </View>
        }
      />

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreateHabit}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  fabContainer: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  fabText: {
    fontSize: 32,
    fontWeight: FontWeights.regular,
    color: Colors.textOnPrimary,
    lineHeight: 36,
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSizes, FontWeights, Shadows } from '../constants/theme';
import { Habit, Streak } from '../types';

interface HabitCardProps {
  habit: Habit;
  streak?: Streak;
  isCompleted?: boolean;
  estimatedPoints?: number;
  onPress: () => void;
  onLongPress?: () => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  streak,
  isCompleted = false,
  estimatedPoints,
  onPress,
  onLongPress,
}) => {
  const getStreakDisplay = () => {
    if (!streak || streak.currentStreak === 0) return null;

    return (
      <View style={styles.streakBadge}>
        <Text style={styles.streakText}>{streak.currentStreak}🔥</Text>
      </View>
    );
  };

  const getPointsDisplay = () => {
    if (isCompleted) {
      return <Text style={styles.completedText}>Completed ✓</Text>;
    }

    const points = estimatedPoints || habit.basePoints;
    return (
      <View style={styles.pointsContainer}>
        <Text style={styles.pointsText}>{points}</Text>
        <Text style={styles.pointsLabel}>pts</Text>
      </View>
    );
  };

  return (
    <View>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
        disabled={isCompleted === true}
        style={[
          styles.container,
          isCompleted && styles.containerCompleted,
        ]}
      >
        <View style={styles.leftSection}>
          <View style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}>
            {isCompleted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.name, isCompleted && styles.nameCompleted]} numberOfLines={1}>
              {habit.name}
            </Text>
            {habit.steps.length > 0 && (
              <Text style={styles.stepsCount}>
                {habit.steps.length} step{habit.steps.length > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.rightSection}>
          {getStreakDisplay()}
          {getPointsDisplay()}
        </View>
      </TouchableOpacity>
    </View>
  );
};

interface HabitListItemProps {
  habit: Habit;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleActive: () => void;
}

export const HabitListItem: React.FC<HabitListItemProps> = ({
  habit,
  onPress,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleActive,
}) => {
  const [showActions, setShowActions] = React.useState(false);

  return (
    <View style={styles.listItemContainer}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={() => setShowActions(!showActions)}
        activeOpacity={0.7}
        style={[styles.listItem, !habit.isActive && styles.listItemInactive]}
      >
        <View style={styles.listItemLeft}>
          <Text style={[styles.listItemName, !habit.isActive && styles.listItemNameInactive]}>
            {habit.name}
          </Text>
          <View style={styles.listItemDetails}>
            <Text style={styles.listItemDetail}>
              {habit.daysOfWeek.join(', ')}
            </Text>
            <Text style={styles.listItemDot}>•</Text>
            <Text style={styles.listItemDetail}>
              {habit.timesOfDay.join(', ')}
            </Text>
            <Text style={styles.listItemDot}>•</Text>
            <Text style={styles.listItemDetail}>{habit.basePoints} pts</Text>
          </View>
        </View>

        <View style={styles.listItemRight}>
          <Text style={styles.listItemSteps}>
            {habit.steps.length} steps
          </Text>
          {!habit.isActive && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>Inactive</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {showActions && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onDuplicate}>
            <Text style={styles.actionText}>Duplicate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onToggleActive}>
            <Text style={styles.actionText}>{habit.isActive ? 'Deactivate' : 'Activate'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  containerCompleted: {
    backgroundColor: Colors.surfaceVariant,
    opacity: 0.8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  checkboxCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkmark: {
    color: Colors.textOnPrimary,
    fontSize: 14,
    fontWeight: FontWeights.bold,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  nameCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  stepsCount: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  streakBadge: {
    backgroundColor: Colors.accent + '20',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  streakText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.accent,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  pointsText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
  pointsLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
  },
  completedText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.success,
  },

  // List item styles
  listItemContainer: {
    marginBottom: Spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  listItemInactive: {
    opacity: 0.6,
  },
  listItemLeft: {
    flex: 1,
  },
  listItemName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  listItemNameInactive: {
    color: Colors.textSecondary,
  },
  listItemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  listItemDetail: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
  },
  listItemDot: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    marginHorizontal: Spacing.xs,
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  listItemSteps: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  inactiveBadge: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginTop: Spacing.xs,
  },
  inactiveBadgeText: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  actionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.sm,
  },
  actionText: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeights.medium,
  },
  deleteButton: {
    backgroundColor: Colors.error + '15',
  },
  deleteText: {
    color: Colors.error,
  },
});

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors, BorderRadius, Spacing, FontSizes, FontWeights, Shadows } from '../constants/theme';
import { PointsSummary } from '../types';

interface PointsDisplayProps {
  pointsSummary: PointsSummary;
  compact?: boolean;
  containerStyle?: ViewStyle;
}

export const PointsDisplay: React.FC<PointsDisplayProps> = ({
  pointsSummary,
  compact = false,
  containerStyle,
}) => {
  if (compact) {
    return (
      <View style={[styles.compactContainer, containerStyle]}>
        <View style={styles.compactItem}>
          <Text style={styles.compactEmoji}>🏆</Text>
          <Text style={styles.compactValue}>{Math.round(pointsSummary.spendable)}</Text>
        </View>
        <View style={styles.compactDivider} />
        <View style={styles.compactItem}>
          <Text style={styles.compactEmoji}>🛡️</Text>
          <Text style={[styles.compactValue, { color: Colors.safe }]}>
            {Math.round(pointsSummary.safe)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.row}>
        <View style={styles.mainPoints}>
          <Text style={styles.emoji}>💰</Text>
          <View>
            <Text style={styles.mainValue}>{Math.round(pointsSummary.totalAvailable)}</Text>
            <Text style={styles.mainLabel}>Total Points</Text>
          </View>
        </View>
      </View>

      <View style={styles.breakdown}>
        <View style={styles.breakdownItem}>
          <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.breakdownLabel}>Spendable</Text>
          <Text style={styles.breakdownValue}>{Math.round(pointsSummary.spendable)} pts</Text>
        </View>

        <View style={styles.breakdownItem}>
          <View style={[styles.dot, { backgroundColor: Colors.locked }]} />
          <Text style={styles.breakdownLabel}>Locked</Text>
          <Text style={styles.breakdownValue}>{Math.round(pointsSummary.locked)} pts</Text>
        </View>

        <View style={styles.breakdownItem}>
          <View style={[styles.dot, { backgroundColor: Colors.safe }]} />
          <Text style={styles.breakdownLabel}>Safe</Text>
          <Text style={[styles.breakdownValue, { color: Colors.safe }]}>
            {Math.round(pointsSummary.safe)} pts 🛡️
          </Text>
        </View>
      </View>
    </View>
  );
};

interface PointsAnimationProps {
  points: number;
  type: 'earned' | 'lost' | 'safe';
  onAnimationComplete?: () => void;
}

export const PointsAnimation: React.FC<PointsAnimationProps> = ({
  points,
  type,
  onAnimationComplete,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withSequence(
      withSpring(1.2, { damping: 10, stiffness: 100 }),
      withSpring(1, { damping: 15 })
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(1, { duration: 1500 }),
      withTiming(0, { duration: 300 })
    );
    translateY.value = withTiming(-50, { duration: 2000 });

    const timeout = setTimeout(() => {
      onAnimationComplete?.();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [scale, opacity, translateY, onAnimationComplete]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const getColor = () => {
    switch (type) {
      case 'earned':
        return Colors.success;
      case 'lost':
        return Colors.error;
      case 'safe':
        return Colors.safe;
      default:
        return Colors.primary;
    }
  };

  const getText = () => {
    const prefix = type === 'lost' ? '-' : '+';
    const emoji = type === 'safe' ? '🛡️' : type === 'earned' ? '🎉' : '💔';
    return `${prefix}${Math.round(points)} pts ${emoji}`;
  };

  return (
    <Animated.View style={[styles.animationContainer, animatedStyle]}>
      <Text style={[styles.animationText, { color: getColor() }]}>{getText()}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  mainPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emoji: {
    fontSize: 32,
  },
  mainValue: {
    fontSize: FontSizes.xxxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  mainLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  breakdown: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.sm,
  },
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  compactEmoji: {
    fontSize: 16,
  },
  compactValue: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  compactDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  animationContainer: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Shadows.lg,
  },
  animationText: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
});

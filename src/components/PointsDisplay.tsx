import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle, Animated } from 'react-native';
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
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(translateYAnim, {
        toValue: -50,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      onAnimationComplete?.();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [scaleAnim, opacityAnim, translateYAnim, onAnimationComplete]);

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
    <Animated.View style={[
      styles.animationContainer,
      {
        transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
        opacity: opacityAnim,
      }
    ]}>
      <Text style={[styles.animationText, { color: getColor() }]}>{getText()}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: Shadows.md.shadowColor,
    shadowOffset: Shadows.md.shadowOffset,
    shadowOpacity: Shadows.md.shadowOpacity,
    shadowRadius: Shadows.md.shadowRadius,
    elevation: Shadows.md.elevation,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  mainPoints: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 32,
    marginRight: Spacing.sm,
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
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
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
    shadowColor: Shadows.sm.shadowColor,
    shadowOffset: Shadows.sm.shadowOffset,
    shadowOpacity: Shadows.sm.shadowOpacity,
    shadowRadius: Shadows.sm.shadowRadius,
    elevation: Shadows.sm.elevation,
  },
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactEmoji: {
    fontSize: 16,
    marginRight: Spacing.xs,
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
    shadowColor: Shadows.lg.shadowColor,
    shadowOffset: Shadows.lg.shadowOffset,
    shadowOpacity: Shadows.lg.shadowOpacity,
    shadowRadius: Shadows.lg.shadowRadius,
    elevation: Shadows.lg.elevation,
  },
  animationText: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
});

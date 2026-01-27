import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, BorderRadius, Spacing, FontSizes, FontWeights } from '../constants/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  backgroundColor?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
  containerStyle?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = Colors.primary,
  backgroundColor = Colors.surfaceVariant,
  height = 8,
  showLabel = false,
  label,
  containerStyle,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(`${clampedProgress * 100}%`, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      }),
    };
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {(showLabel || label) && (
        <View style={styles.labelContainer}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showLabel && (
            <Text style={styles.percentage}>{Math.round(clampedProgress * 100)}%</Text>
          )}
        </View>
      )}
      <View style={[styles.track, { backgroundColor, height, borderRadius: height / 2 }]}>
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: color, height, borderRadius: height / 2 },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },
  percentage: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  track: {
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});

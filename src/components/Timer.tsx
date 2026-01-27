import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
} from 'react-native-reanimated';
import { Colors, BorderRadius, Spacing, FontSizes, FontWeights } from '../constants/theme';
import { Button } from './Button';
import { formatTimer } from '../utils/helpers';

interface TimerProps {
  totalSeconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
  containerStyle?: ViewStyle;
}

export const Timer: React.FC<TimerProps> = ({
  totalSeconds,
  onComplete,
  autoStart = false,
  containerStyle,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const pulse = useSharedValue(1);

  const progress = (totalSeconds - remainingSeconds) / totalSeconds;

  const startTimer = useCallback(() => {
    setIsRunning(true);
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    );
  }, [pulse]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    pulse.value = withTiming(1, { duration: 200 });
  }, [pulse]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setIsComplete(false);
    setRemainingSeconds(totalSeconds);
    pulse.value = withTiming(1, { duration: 200 });
  }, [totalSeconds, pulse]);

  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            pulse.value = withTiming(1, { duration: 200 });
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, remainingSeconds, onComplete, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const getStatusColor = () => {
    if (isComplete) return Colors.success;
    if (isRunning) return Colors.primary;
    return Colors.textSecondary;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.timerDisplay, animatedStyle]}>
        <Text style={[styles.timerText, { color: getStatusColor() }]}>
          {formatTimer(remainingSeconds)}
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: getStatusColor(),
              },
            ]}
          />
        </View>
      </Animated.View>

      <View style={styles.buttonContainer}>
        {!isComplete && (
          <>
            {!isRunning ? (
              <Button
                title="Start"
                onPress={startTimer}
                variant="primary"
                size="sm"
              />
            ) : (
              <Button
                title="Pause"
                onPress={pauseTimer}
                variant="outline"
                size="sm"
              />
            )}
            {remainingSeconds < totalSeconds && (
              <Button
                title="Reset"
                onPress={resetTimer}
                variant="ghost"
                size="sm"
                style={styles.resetButton}
              />
            )}
          </>
        )}
        {isComplete && (
          <Text style={styles.completeText}>Time complete!</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.lg,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  timerText: {
    fontSize: FontSizes.xxxl,
    fontWeight: FontWeights.bold,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    width: 120,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  resetButton: {
    marginLeft: Spacing.xs,
  },
  completeText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.success,
  },
});

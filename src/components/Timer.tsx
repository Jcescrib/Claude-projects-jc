import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ViewStyle, Animated } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSizes, FontWeights } from '../constants/theme';
import { Button } from './Button';
import { formatTimer } from '../utils/helpers';

interface TimerProps {
  totalSeconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
  containerStyle?: ViewStyle;
}

export const Timer: React.FC<TimerProps> = (props) => {
  const { totalSeconds, onComplete, autoStart, containerStyle } = props;

  const shouldAutoStart: boolean = autoStart === true;

  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(shouldAutoStart);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const progress = (totalSeconds - remainingSeconds) / totalSeconds;

  const startTimer = useCallback(() => {
    setIsRunning(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [pulseAnim]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setIsComplete(false);
    setRemainingSeconds(totalSeconds);
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [totalSeconds, pulseAnim]);

  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            pulseAnim.stopAnimation();
            if (onComplete) {
              onComplete();
            }
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
  }, [isRunning, remainingSeconds, onComplete, pulseAnim]);

  const getStatusColor = (): string => {
    if (isComplete) return Colors.success;
    if (isRunning) return Colors.primary;
    return Colors.textSecondary;
  };

  const containerStyles = [styles.container, containerStyle];
  const timerTextStyles = [styles.timerText, { color: getStatusColor() }];
  const progressFillStyles = [
    styles.progressFill,
    {
      width: `${progress * 100}%` as const,
      backgroundColor: getStatusColor(),
    },
  ];

  const showResetButton: boolean = remainingSeconds < totalSeconds;

  return (
    <View style={containerStyles}>
      <Animated.View style={[styles.timerDisplay, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={timerTextStyles}>
          {formatTimer(remainingSeconds)}
        </Text>
        <View style={styles.progressTrack}>
          <View style={progressFillStyles} />
        </View>
      </Animated.View>

      <View style={styles.buttonContainer}>
        {isComplete ? (
          <Text style={styles.completeText}>Time complete!</Text>
        ) : (
          <>
            {isRunning ? (
              <Button
                title="Pause"
                onPress={pauseTimer}
                variant="outline"
                size="sm"
              />
            ) : (
              <Button
                title="Start"
                onPress={startTimer}
                variant="primary"
                size="sm"
              />
            )}
            {showResetButton ? (
              <Button
                title="Reset"
                onPress={resetTimer}
                variant="ghost"
                size="sm"
                style={styles.resetButton}
              />
            ) : null}
          </>
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
    fontFamily: 'monospace',
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
    height: 4,
    borderRadius: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetButton: {
    marginLeft: Spacing.sm,
  },
  completeText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.success,
  },
});

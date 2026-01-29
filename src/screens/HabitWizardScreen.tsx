import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { Button, ProgressBar, Timer, Card } from '../components';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../constants/theme';
import { TodayStackParamList, HabitStep, StepResponse } from '../types';

type RouteProps = RouteProp<TodayStackParamList, 'HabitWizard'>;

export const HabitWizardScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { habits, completeHabit } = useApp();

  const habit = habits.find((h) => h.id === route.params.habitId);
  const timeOfDay = route.params.timeOfDay;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, any>>(new Map());
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionData, setCompletionData] = useState<{
    points: number;
    multiplier: number;
    isPerfectDay: boolean;
    perfectDayBonus: number;
  } | null>(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const currentStep = useMemo(() => {
    if (!habit || habit.steps.length === 0) return null;
    return habit.steps[currentStepIndex];
  }, [habit, currentStepIndex]);

  const progress = useMemo(() => {
    if (!habit || habit.steps.length === 0) return 1;
    return (currentStepIndex + 1) / habit.steps.length;
  }, [habit, currentStepIndex]);

  // Slide animation when step changes
  useEffect(() => {
    slideAnim.setValue(50);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [currentStepIndex, slideAnim]);

  const handleSetResponse = useCallback((stepId: string, value: any) => {
    setResponses((prev) => new Map(prev).set(stepId, value));
  }, []);

  const handleNext = useCallback(async () => {
    if (!habit) return;

    if (currentStepIndex < habit.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Complete the habit
      const stepResponses: StepResponse[] = habit.steps.map((step) => ({
        stepId: step.id,
        questionText: step.questionText,
        responseType: step.responseType,
        response: responses.get(step.id) ?? true,
        timerUsed: step.timerEnabled,
        timerDuration: step.timerSeconds,
      }));

      try {
        const result = await completeHabit(habit, timeOfDay, stepResponses);
        setCompletionData(result);
        setShowCompletion(true);

        // Trigger celebration animation
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.2,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }),
        ]).start();

        Animated.sequence([
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay(1500),
          Animated.timing(confettiAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      } catch (error) {
        Alert.alert('Error', 'Failed to complete habit. Please try again.');
      }
    }
  }, [habit, currentStepIndex, responses, completeHabit, timeOfDay, scaleAnim, confettiAnim]);

  const handleFinish = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (!habit) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Habit not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  if (showCompletion && completionData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completionContainer}>
          <Animated.View style={[styles.confetti, { opacity: confettiAnim }]}>
            <Text style={styles.confettiEmoji}>🎉 🎊 ✨ 🌟 🎉</Text>
          </Animated.View>

          <Animated.View style={[styles.completionContent, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.completionEmoji}>🏆</Text>
            <Text style={styles.completionTitle}>Habit Completed!</Text>
            <Text style={styles.habitName}>{habit.name}</Text>

            <Card style={styles.pointsCard}>
              <Text style={styles.pointsLabel}>Points Earned</Text>
              <Text style={styles.pointsValue}>
                +{completionData.points.toFixed(1)}
              </Text>
              <Text style={styles.multiplierText}>
                {habit.basePoints} × {completionData.multiplier.toFixed(2)} multiplier
              </Text>
            </Card>

            {completionData.isPerfectDay && (
              <View style={styles.perfectDayCard}>
                <Text style={styles.perfectDayEmoji}>🌟</Text>
                <Text style={styles.perfectDayTitle}>PERFECT DAY!</Text>
                <Text style={styles.perfectDayBonus}>
                  +{completionData.perfectDayBonus} safe points 🛡️
                </Text>
              </View>
            )}

            <Button
              title="Done"
              onPress={handleFinish}
              style={styles.doneButton}
              fullWidth
            />
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  // No steps - just complete immediately
  if (habit.steps.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noStepsContainer}>
          <Text style={styles.habitTitle}>{habit.name}</Text>
          <Text style={styles.noStepsText}>
            This habit has no steps. Tap complete to finish.
          </Text>
          <Button
            title="Complete Habit"
            onPress={handleNext}
            style={styles.completeButton}
          />
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="ghost"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
        <Text style={styles.habitTitle} numberOfLines={1}>
          {habit.name}
        </Text>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>
            {currentStepIndex + 1}/{habit.steps.length}
          </Text>
        </View>
      </View>

      <ProgressBar
        progress={progress}
        color={Colors.primary}
        height={4}
        containerStyle={styles.progressBar}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {currentStep && (
          <Animated.View
            key={currentStep.id}
            style={{ transform: [{ translateX: slideAnim }] }}
          >
            <StepContent
              step={currentStep}
              response={responses.get(currentStep.id)}
              onResponseChange={(value) => handleSetResponse(currentStep.id, value)}
            />
          </Animated.View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={currentStepIndex < habit.steps.length - 1 ? 'Next' : 'Complete'}
          onPress={handleNext}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

interface StepContentProps {
  step: HabitStep;
  response: any;
  onResponseChange: (value: any) => void;
}

const StepContent: React.FC<StepContentProps> = ({
  step,
  response,
  onResponseChange,
}) => {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.questionText}>{step.questionText}</Text>

      {step.timerEnabled && (
        <Timer
          totalSeconds={step.timerSeconds}
          containerStyle={styles.timer}
        />
      )}

      <View style={styles.responseContainer}>
        {step.responseType === 'yes_no' && (
          <YesNoResponse value={response} onChange={onResponseChange} />
        )}
        {step.responseType === 'scale_1_5' && (
          <ScaleResponse value={response} onChange={onResponseChange} />
        )}
        {step.responseType === 'multiple_choice' && step.multipleChoiceOptions && (
          <MultipleChoiceResponse
            options={step.multipleChoiceOptions}
            value={response}
            onChange={onResponseChange}
          />
        )}
        {step.responseType === 'free_text' && (
          <FreeTextResponse value={response} onChange={onResponseChange} />
        )}
      </View>
    </View>
  );
};

const YesNoResponse: React.FC<{
  value: boolean | undefined;
  onChange: (value: boolean) => void;
}> = ({ value, onChange }) => (
  <View style={styles.yesNoContainer}>
    <TouchableOpacity
      style={[styles.yesNoButton, value === true && styles.yesNoButtonSelected]}
      onPress={() => onChange(true)}
    >
      <Text style={[styles.yesNoText, value === true && styles.yesNoTextSelected]}>
        ✓ Yes
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.yesNoButton, value === false && styles.yesNoButtonNo]}
      onPress={() => onChange(false)}
    >
      <Text style={[styles.yesNoText, value === false && styles.yesNoTextSelected]}>
        ✗ No
      </Text>
    </TouchableOpacity>
  </View>
);

const ScaleResponse: React.FC<{
  value: number | undefined;
  onChange: (value: number) => void;
}> = ({ value, onChange }) => (
  <View style={styles.scaleContainer}>
    {[1, 2, 3, 4, 5].map((num) => (
      <TouchableOpacity
        key={num}
        style={[styles.scaleButton, value === num && styles.scaleButtonSelected]}
        onPress={() => onChange(num)}
      >
        <Text style={[styles.scaleText, value === num && styles.scaleTextSelected]}>
          {num}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const MultipleChoiceResponse: React.FC<{
  options: string[];
  value: string | undefined;
  onChange: (value: string) => void;
}> = ({ options, value, onChange }) => (
  <View style={styles.multipleChoiceContainer}>
    {options.map((option, index) => (
      <TouchableOpacity
        key={index}
        style={[
          styles.multipleChoiceButton,
          value === option && styles.multipleChoiceButtonSelected,
        ]}
        onPress={() => onChange(option)}
      >
        <Text
          style={[
            styles.multipleChoiceText,
            value === option && styles.multipleChoiceTextSelected,
          ]}
        >
          {option}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const FreeTextResponse: React.FC<{
  value: string | undefined;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => (
  <TextInput
    style={styles.freeTextInput}
    value={value || ''}
    onChangeText={onChange}
    placeholder="Enter your response..."
    placeholderTextColor={Colors.textTertiary}
    multiline={true}
    numberOfLines={4}
    textAlignVertical="top"
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 28,
    color: Colors.textSecondary,
    lineHeight: 32,
  },
  habitTitle: {
    flex: 1,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  stepIndicator: {
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  stepText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },
  progressBar: {
    marginHorizontal: 0,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  stepContainer: {
    flex: 1,
  },
  questionText: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    lineHeight: 28,
  },
  timer: {
    marginBottom: Spacing.lg,
  },
  responseContainer: {
    marginTop: Spacing.md,
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  yesNoContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  yesNoButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  yesNoButtonSelected: {
    backgroundColor: Colors.success + '20',
    borderColor: Colors.success,
  },
  yesNoButtonNo: {
    backgroundColor: Colors.error + '20',
    borderColor: Colors.error,
  },
  yesNoText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  yesNoTextSelected: {
    color: Colors.success,
  },
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  scaleButton: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  scaleButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  scaleText: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  scaleTextSelected: {
    color: Colors.textOnPrimary,
  },
  multipleChoiceContainer: {
    gap: Spacing.sm,
  },
  multipleChoiceButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  multipleChoiceButtonSelected: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  multipleChoiceText: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  multipleChoiceTextSelected: {
    color: Colors.primary,
    fontWeight: FontWeights.semibold,
  },
  freeTextInput: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noStepsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  noStepsText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  completeButton: {
    marginBottom: Spacing.md,
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  confetti: {
    position: 'absolute',
    top: 100,
  },
  confettiEmoji: {
    fontSize: 40,
    letterSpacing: 20,
  },
  completionContent: {
    alignItems: 'center',
    width: '100%',
  },
  completionEmoji: {
    fontSize: 80,
    marginBottom: Spacing.md,
  },
  completionTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  habitName: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  pointsCard: {
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  pointsLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: FontWeights.bold,
    color: Colors.success,
  },
  multiplierText: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  perfectDayCard: {
    backgroundColor: Colors.perfectDay + '20',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.perfectDay,
  },
  perfectDayEmoji: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  perfectDayTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.accent,
    marginBottom: Spacing.xs,
  },
  perfectDayBonus: {
    fontSize: FontSizes.md,
    color: Colors.safe,
    fontWeight: FontWeights.semibold,
  },
  doneButton: {
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: FontSizes.lg,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
});

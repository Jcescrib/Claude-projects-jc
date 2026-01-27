import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../context/AppContext';
import { Input, Toggle, MultiSelect, Button, Card } from '../components';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../constants/theme';
import { HabitsStackParamList, Habit, HabitStep, DayOfWeek, TimeOfDay, ResponseType } from '../types';
import { orderedDays, orderedTimes } from '../utils/helpers';

type NavigationProp = NativeStackNavigationProp<HabitsStackParamList, 'HabitForm'>;
type RouteProps = RouteProp<HabitsStackParamList, 'HabitForm'>;

const dayOptions = orderedDays.map((day) => ({
  value: day,
  label: day,
  shortLabel: day.charAt(0),
}));

const timeOptions = orderedTimes.map((time) => ({
  value: time,
  label: time,
}));

const responseTypeOptions: { value: ResponseType; label: string }[] = [
  { value: 'yes_no', label: 'Yes/No' },
  { value: 'scale_1_5', label: 'Scale 1-5' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'free_text', label: 'Free Text' },
];

const emptyStep = {
  questionText: '',
  responseType: 'yes_no' as ResponseType,
  timerEnabled: false,
  timerSeconds: 180,
  multipleChoiceOptions: undefined as string[] | undefined,
};

export const HabitFormScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { habits, createHabit, updateHabit: updateHabitFn } = useApp();

  const editingHabit = route.params?.habitId
    ? habits.find((h) => h.id === route.params.habitId)
    : undefined;

  const [name, setName] = useState(editingHabit?.name || '');
  const [isActive, setIsActive] = useState(editingHabit?.isActive ?? true);
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>(
    editingHabit?.daysOfWeek || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  );
  const [timesOfDay, setTimesOfDay] = useState<TimeOfDay[]>(
    editingHabit?.timesOfDay || ['Morning']
  );
  const [basePoints, setBasePoints] = useState(
    editingHabit?.basePoints?.toString() || '3'
  );
  const [steps, setSteps] = useState<(Omit<HabitStep, 'habitId'> & { id: string })[]>(
    editingHabit?.steps.map((s) => ({ ...s })) || []
  );

  const [showStepForm, setShowStepForm] = useState(false);
  const [editingStep, setEditingStep] = useState<(Omit<HabitStep, 'habitId'> & { id: string }) | null>(null);
  const [stepFormData, setStepFormData] = useState<Omit<HabitStep, 'id' | 'habitId' | 'orderIndex'>>(emptyStep);
  const [multipleChoiceText, setMultipleChoiceText] = useState('');

  const isEditing = !!editingHabit;

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }
    if (daysOfWeek.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }
    if (timesOfDay.length === 0) {
      Alert.alert('Error', 'Please select at least one time of day');
      return;
    }

    const points = parseInt(basePoints, 10) || 3;

    const habitData = {
      name: name.trim(),
      isActive,
      daysOfWeek,
      timesOfDay,
      basePoints: points,
      steps: steps.map((s, index) => ({
        ...s,
        orderIndex: index,
      })),
    };

    try {
      if (isEditing) {
        await updateHabitFn(editingHabit.id, habitData);
      } else {
        await createHabit(habitData);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save habit. Please try again.');
    }
  }, [name, isActive, daysOfWeek, timesOfDay, basePoints, steps, isEditing, editingHabit, createHabit, updateHabitFn, navigation]);

  const handleAddStep = useCallback(() => {
    setEditingStep(null);
    setStepFormData(emptyStep);
    setMultipleChoiceText('');
    setShowStepForm(true);
  }, []);

  const handleEditStep = useCallback((step: Omit<HabitStep, 'habitId'> & { id: string }) => {
    setEditingStep(step);
    setStepFormData({
      questionText: step.questionText,
      responseType: step.responseType,
      multipleChoiceOptions: step.multipleChoiceOptions,
      timerEnabled: step.timerEnabled,
      timerSeconds: step.timerSeconds,
    });
    setMultipleChoiceText(step.multipleChoiceOptions?.join('\n') || '');
    setShowStepForm(true);
  }, []);

  const handleSaveStep = useCallback(() => {
    if (!stepFormData.questionText.trim()) {
      Alert.alert('Error', 'Please enter a question');
      return;
    }

    const options =
      stepFormData.responseType === 'multiple_choice'
        ? multipleChoiceText.split('\n').filter((o) => o.trim())
        : undefined;

    if (stepFormData.responseType === 'multiple_choice' && (!options || options.length < 2)) {
      Alert.alert('Error', 'Please enter at least 2 options for multiple choice');
      return;
    }

    const newStep = {
      id: editingStep?.id || uuidv4(),
      orderIndex: editingStep?.orderIndex ?? steps.length,
      questionText: stepFormData.questionText.trim(),
      responseType: stepFormData.responseType,
      multipleChoiceOptions: options,
      timerEnabled: stepFormData.timerEnabled,
      timerSeconds: stepFormData.timerSeconds,
    };

    if (editingStep) {
      setSteps(steps.map((s) => (s.id === editingStep.id ? newStep : s)));
    } else {
      setSteps([...steps, newStep]);
    }

    setShowStepForm(false);
    setEditingStep(null);
    setStepFormData(emptyStep);
    setMultipleChoiceText('');
  }, [stepFormData, multipleChoiceText, editingStep, steps]);

  const handleDeleteStep = useCallback((stepId: string) => {
    Alert.alert(
      'Delete Step',
      'Are you sure you want to delete this step?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setSteps(steps.filter((s) => s.id !== stepId)),
        },
      ]
    );
  }, [steps]);

  const handleMoveStep = useCallback((index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;

    const newSteps = [...steps];
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    setSteps(newSteps);
  }, [steps]);

  if (showStepForm) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.sectionTitle}>
              {editingStep ? 'Edit Step' : 'Add Step'}
            </Text>

            <Input
              label="Question/Instructions"
              value={stepFormData.questionText}
              onChangeText={(text) =>
                setStepFormData({ ...stepFormData, questionText: text })
              }
              placeholder="e.g., Did you complete this task?"
              multiline
            />

            <View style={styles.section}>
              <Text style={styles.label}>Response Type</Text>
              <View style={styles.responseTypeContainer}>
                {responseTypeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.responseTypeOption,
                      stepFormData.responseType === option.value &&
                        styles.responseTypeOptionSelected,
                    ]}
                    onPress={() =>
                      setStepFormData({ ...stepFormData, responseType: option.value })
                    }
                  >
                    <Text
                      style={[
                        styles.responseTypeText,
                        stepFormData.responseType === option.value &&
                          styles.responseTypeTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {stepFormData.responseType === 'multiple_choice' && (
              <Input
                label="Options (one per line)"
                value={multipleChoiceText}
                onChangeText={setMultipleChoiceText}
                placeholder="Option 1\nOption 2\nOption 3"
                multiline
                numberOfLines={4}
              />
            )}

            <Toggle
              label="Enable Timer"
              value={stepFormData.timerEnabled}
              onValueChange={(value) =>
                setStepFormData({ ...stepFormData, timerEnabled: value })
              }
            />

            {stepFormData.timerEnabled && (
              <View style={styles.timerInput}>
                <Input
                  label="Timer Duration (seconds)"
                  value={stepFormData.timerSeconds.toString()}
                  onChangeText={(text) =>
                    setStepFormData({
                      ...stepFormData,
                      timerSeconds: parseInt(text, 10) || 0,
                    })
                  }
                  keyboardType="numeric"
                />
                <Text style={styles.timerHint}>
                  {Math.floor(stepFormData.timerSeconds / 60)}m{' '}
                  {stepFormData.timerSeconds % 60}s
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.buttonRow}>
            <Button
              title="Cancel"
              onPress={() => {
                setShowStepForm(false);
                setEditingStep(null);
              }}
              variant="outline"
              style={styles.flex}
            />
            <Button
              title={editingStep ? 'Update Step' : 'Add Step'}
              onPress={handleSaveStep}
              style={styles.flex}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Input
            label="Habit Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g., Morning Meditation"
          />

          <Toggle
            label="Active"
            value={isActive}
            onValueChange={setIsActive}
          />

          <MultiSelect
            label="Days of the Week"
            options={dayOptions}
            selectedValues={daysOfWeek}
            onSelectionChange={setDaysOfWeek}
            compact
          />

          <MultiSelect
            label="Times of Day"
            options={timeOptions}
            selectedValues={timesOfDay}
            onSelectionChange={setTimesOfDay}
          />

          <Input
            label="Base Points"
            value={basePoints}
            onChangeText={setBasePoints}
            keyboardType="numeric"
            placeholder="3"
          />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Steps ({steps.length})</Text>
              <Button
                title="+ Add"
                onPress={handleAddStep}
                variant="ghost"
                size="sm"
              />
            </View>

            {steps.length === 0 ? (
              <Card variant="outlined" style={styles.emptySteps}>
                <Text style={styles.emptyStepsText}>
                  No steps yet. Add steps to create a guided flow for this habit.
                </Text>
              </Card>
            ) : (
              steps.map((step, index) => (
                <Card key={step.id} style={styles.stepCard}>
                  <View style={styles.stepHeader}>
                    <Text style={styles.stepNumber}>Step {index + 1}</Text>
                    <View style={styles.stepActions}>
                      {index > 0 && (
                        <TouchableOpacity
                          onPress={() => handleMoveStep(index, 'up')}
                          style={styles.stepAction}
                        >
                          <Text style={styles.stepActionText}>↑</Text>
                        </TouchableOpacity>
                      )}
                      {index < steps.length - 1 && (
                        <TouchableOpacity
                          onPress={() => handleMoveStep(index, 'down')}
                          style={styles.stepAction}
                        >
                          <Text style={styles.stepActionText}>↓</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <Text style={styles.stepQuestion} numberOfLines={2}>
                    {step.questionText}
                  </Text>
                  <View style={styles.stepMeta}>
                    <Text style={styles.stepMetaText}>
                      {responseTypeOptions.find((o) => o.value === step.responseType)?.label}
                    </Text>
                    {step.timerEnabled && (
                      <Text style={styles.stepMetaText}>
                        • Timer: {Math.floor(step.timerSeconds / 60)}m
                      </Text>
                    )}
                  </View>
                  <View style={styles.stepButtons}>
                    <TouchableOpacity
                      onPress={() => handleEditStep(step)}
                      style={styles.stepEditButton}
                    >
                      <Text style={styles.stepEditText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteStep(step.id)}
                      style={styles.stepDeleteButton}
                    >
                      <Text style={styles.stepDeleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            )}
          </View>
        </ScrollView>

        <View style={styles.buttonRow}>
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.flex}
          />
          <Button
            title={isEditing ? 'Save Changes' : 'Create Habit'}
            onPress={handleSave}
            style={styles.flex}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  responseTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  responseTypeOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  responseTypeOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  responseTypeText: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
  responseTypeTextSelected: {
    color: Colors.textOnPrimary,
  },
  timerInput: {
    marginTop: Spacing.sm,
  },
  timerHint: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  emptySteps: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyStepsText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  stepCard: {
    marginBottom: Spacing.sm,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  stepNumber: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.primary,
  },
  stepActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  stepAction: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepActionText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  stepQuestion: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  stepMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  stepMetaText: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
  },
  stepButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  stepEditButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  stepEditText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: FontWeights.medium,
  },
  stepDeleteButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  stepDeleteText: {
    fontSize: FontSizes.sm,
    color: Colors.error,
    fontWeight: FontWeights.medium,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});

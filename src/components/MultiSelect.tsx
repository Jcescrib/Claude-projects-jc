import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSizes, FontWeights } from '../constants/theme';

interface MultiSelectOption<T> {
  value: T;
  label: string;
  shortLabel?: string;
}

interface MultiSelectProps<T> {
  label?: string;
  options: MultiSelectOption<T>[];
  selectedValues: T[];
  onSelectionChange: (values: T[]) => void;
  containerStyle?: ViewStyle;
  compact?: boolean;
}

export function MultiSelect<T extends string>({
  label,
  options,
  selectedValues,
  onSelectionChange,
  containerStyle,
  compact = false,
}: MultiSelectProps<T>) {
  const toggleOption = (value: T) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter((v) => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => toggleOption(option.value)}
              activeOpacity={0.7}
              style={[
                styles.option,
                compact && styles.optionCompact,
                isSelected && styles.optionSelected,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  compact && styles.optionTextCompact,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {compact ? option.shortLabel || option.label : option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  option: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionCompact: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    minWidth: 40,
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  optionTextCompact: {
    fontSize: FontSizes.sm,
  },
  optionTextSelected: {
    color: Colors.textOnPrimary,
  },
});

import React from 'react';
import { View, Text, Switch, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, FontSizes, FontWeights } from '../constants/theme';

interface ToggleProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  containerStyle?: ViewStyle;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  value,
  onValueChange,
  disabled = false,
  containerStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
      <Switch
        value={Boolean(value)}
        onValueChange={onValueChange}
        disabled={Boolean(disabled)}
        trackColor={{ false: Colors.surfaceVariant, true: Colors.primaryLight }}
        thumbColor={Boolean(value) ? Colors.primary : Colors.surface}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
    flex: 1,
  },
  labelDisabled: {
    color: Colors.textTertiary,
  },
});

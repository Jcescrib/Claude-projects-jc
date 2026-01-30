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

export const Toggle: React.FC<ToggleProps> = (props) => {
  const { label, value, onValueChange, disabled, containerStyle } = props;

  // Explicitly convert to boolean to avoid any type issues with New Architecture
  const isOn: boolean = value === true;
  const isDisabled: boolean = disabled === true;

  const labelStyles = [
    styles.label,
    isDisabled ? styles.labelDisabled : null,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={labelStyles}>{label}</Text>
      <Switch
        value={isOn}
        onValueChange={onValueChange}
        disabled={isDisabled}
        trackColor={{
          false: Colors.surfaceVariant,
          true: Colors.primaryLight
        }}
        thumbColor={isOn ? Colors.primary : Colors.surface}
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

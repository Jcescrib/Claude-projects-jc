import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
} from 'react-native';
import { Colors, BorderRadius, Spacing, FontSizes, FontWeights } from '../constants/theme';

interface InputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  style?: TextStyle;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: ReturnKeyTypeOptions;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  onSubmitEditing?: (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  testID?: string;
}

export const Input: React.FC<InputProps> = (props) => {
  const {
    label,
    error,
    containerStyle,
    style,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    returnKeyType,
    multiline,
    numberOfLines,
    maxLength,
    secureTextEntry,
    autoCapitalize,
    onSubmitEditing,
    onBlur,
    onFocus,
    testID,
  } = props;

  // Explicitly convert boolean props to actual boolean values
  const isMultiline = multiline === true;
  const isSecure = secureTextEntry === true;

  const inputStyles = [
    styles.input,
    error ? styles.inputError : null,
    isMultiline ? styles.multilineInput : null,
    style,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={inputStyles}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        multiline={isMultiline}
        numberOfLines={isMultiline ? (numberOfLines || 4) : undefined}
        maxLength={maxLength}
        secureTextEntry={isSecure}
        autoCapitalize={autoCapitalize}
        onSubmitEditing={onSubmitEditing}
        onBlur={onBlur}
        onFocus={onFocus}
        testID={testID}
        textAlignVertical={isMultiline ? 'top' : 'auto'}
        autoCorrect={false}
        spellCheck={false}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: {
    borderColor: Colors.error,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: FontSizes.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});

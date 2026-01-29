import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Colors, BorderRadius, Spacing, FontSizes, FontWeights } from '../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  multiline,
  editable,
  secureTextEntry,
  autoFocus,
  autoCorrect,
  autoCapitalize,
  selectTextOnFocus,
  contextMenuHidden,
  caretHidden,
  showSoftInputOnFocus,
  ...restProps
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          multiline === true && styles.multilineInput,
          style,
        ]}
        placeholderTextColor={Colors.textTertiary}
        multiline={multiline === true}
        editable={editable !== false}
        secureTextEntry={secureTextEntry === true}
        autoFocus={autoFocus === true}
        autoCorrect={autoCorrect !== false}
        autoCapitalize={autoCapitalize}
        selectTextOnFocus={selectTextOnFocus === true}
        contextMenuHidden={contextMenuHidden === true}
        caretHidden={caretHidden === true}
        showSoftInputOnFocus={showSoftInputOnFocus !== false}
        {...restProps}
      />
      {error && <Text style={styles.error}>{error}</Text>}
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

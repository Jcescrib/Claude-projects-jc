import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, BorderRadius, Spacing, FontSizes, FontWeights, Shadows } from '../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = (props) => {
  const {
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled,
    loading,
    icon,
    style,
    textStyle,
    fullWidth,
  } = props;

  // Explicitly convert to boolean
  const isDisabled: boolean = disabled === true;
  const isLoading: boolean = loading === true;
  const isFullWidth: boolean = fullWidth === true;
  const shouldDisable: boolean = isDisabled || isLoading;

  const getBackgroundColor = (): string => {
    if (isDisabled) return Colors.surfaceVariant;
    switch (variant) {
      case 'primary':
        return Colors.primary;
      case 'secondary':
        return Colors.secondary;
      case 'danger':
        return Colors.error;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return Colors.primary;
    }
  };

  const getTextColor = (): string => {
    if (isDisabled) return Colors.textTertiary;
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return Colors.textOnPrimary;
      case 'outline':
        return Colors.primary;
      case 'ghost':
        return Colors.textPrimary;
      default:
        return Colors.textOnPrimary;
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, minHeight: 36 };
      case 'lg':
        return { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, minHeight: 56 };
      default:
        return { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, minHeight: 48 };
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'sm':
        return FontSizes.sm;
      case 'lg':
        return FontSizes.lg;
      default:
        return FontSizes.md;
    }
  };

  const buttonStyles: ViewStyle[] = [
    styles.button,
    getSizeStyles(),
    {
      backgroundColor: getBackgroundColor(),
      borderColor: variant === 'outline' ? Colors.primary : 'transparent',
      borderWidth: variant === 'outline' ? 2 : 0,
    },
    isFullWidth ? styles.fullWidth : null,
    variant !== 'ghost' ? Shadows.sm : null,
    style,
  ].filter((s): s is ViewStyle => s !== null);

  const textStyles: TextStyle[] = [
    styles.text,
    { color: getTextColor(), fontSize: getFontSize() },
    icon ? styles.textWithIcon : null,
    textStyle,
  ].filter((s): s is TextStyle => s !== null);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={shouldDisable}
      activeOpacity={0.7}
      style={buttonStyles}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: FontWeights.semibold,
    textAlign: 'center',
  },
  textWithIcon: {
    marginLeft: Spacing.sm,
  },
});

import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'default',
}) => {
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          shadowColor: Shadows.lg.shadowColor,
          shadowOffset: Shadows.lg.shadowOffset,
          shadowOpacity: Shadows.lg.shadowOpacity,
          shadowRadius: Shadows.lg.shadowRadius,
          elevation: Shadows.lg.elevation,
        };
      case 'outlined':
        return { borderWidth: 1, borderColor: Colors.border };
      default:
        return {
          shadowColor: Shadows.md.shadowColor,
          shadowOffset: Shadows.md.shadowOffset,
          shadowOpacity: Shadows.md.shadowOpacity,
          shadowRadius: Shadows.md.shadowRadius,
          elevation: Shadows.md.elevation,
        };
    }
  };

  const content = (
    <View style={[styles.card, getVariantStyles(), style]}>{children}</View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
});

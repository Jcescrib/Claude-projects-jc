import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Web doesn't support haptics, so we need to check platform
const isHapticsSupported = Platform.OS !== 'web';

/**
 * Haptic feedback utilities for gamification
 * Provides various vibration patterns for different app events
 */

// Light tap for button presses and selections
export const lightTap = async (): Promise<void> => {
  if (!isHapticsSupported) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    console.log('Haptics not available');
  }
};

// Medium tap for confirmations
export const mediumTap = async (): Promise<void> => {
  if (!isHapticsSupported) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.log('Haptics not available');
  }
};

// Heavy tap for important actions
export const heavyTap = async (): Promise<void> => {
  if (!isHapticsSupported) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    console.log('Haptics not available');
  }
};

// Success notification - for completing habits, achieving milestones
export const successNotification = async (): Promise<void> => {
  if (!isHapticsSupported) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.log('Haptics not available');
  }
};

// Warning notification - for potential issues
export const warningNotification = async (): Promise<void> => {
  if (!isHapticsSupported) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    console.log('Haptics not available');
  }
};

// Error notification - for failures, streak loss
export const errorNotification = async (): Promise<void> => {
  if (!isHapticsSupported) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    console.log('Haptics not available');
  }
};

// Selection change - for toggles and selections
export const selectionChange = async (): Promise<void> => {
  if (!isHapticsSupported) return;
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    console.log('Haptics not available');
  }
};

// Custom pattern for celebration (multiple quick taps)
export const celebrationPattern = async (): Promise<void> => {
  if (!isHapticsSupported) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.log('Haptics not available');
  }
};

// Perfect day celebration (longer celebration pattern)
export const perfectDayCelebration = async (): Promise<void> => {
  if (!isHapticsSupported) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((resolve) => setTimeout(resolve, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((resolve) => setTimeout(resolve, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((resolve) => setTimeout(resolve, 150));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.log('Haptics not available');
  }
};

// Streak loss vibration (warning pattern)
export const streakLossVibration = async (): Promise<void> => {
  if (!isHapticsSupported) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    await new Promise((resolve) => setTimeout(resolve, 200));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((resolve) => setTimeout(resolve, 200));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    console.log('Haptics not available');
  }
};

// Reward redemption celebration
export const rewardRedemption = async (): Promise<void> => {
  if (!isHapticsSupported) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.log('Haptics not available');
  }
};

// Milestone achievement (7 days, 21 days)
export const milestoneAchievement = async (): Promise<void> => {
  if (!isHapticsSupported) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.log('Haptics not available');
  }
};

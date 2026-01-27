import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Colors, FontSizes, FontWeights } from './src/constants/theme';

// Loading screen component
const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <Text style={styles.loadingEmoji}>🎯</Text>
    <Text style={styles.loadingTitle}>Habit Tracker</Text>
    <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
    <Text style={styles.loadingText}>Loading your habits...</Text>
  </View>
);

// Error boundary fallback
const ErrorScreen: React.FC<{ error: string }> = ({ error }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorEmoji}>😕</Text>
    <Text style={styles.errorTitle}>Something went wrong</Text>
    <Text style={styles.errorText}>{error}</Text>
  </View>
);

// Main App content
const AppContent: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Small delay to ensure smooth app initialization
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return <ErrorScreen error={error} />;
  }

  if (!isReady) {
    return <LoadingScreen />;
  }

  return <AppNavigator />;
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <AppContent />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: 24,
  },
  spinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  errorText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

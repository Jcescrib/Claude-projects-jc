import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  DailyViewScreen,
  HabitWizardScreen,
  HabitsListScreen,
  HabitFormScreen,
  RewardsScreen,
  ProgressScreen,
} from '../screens';
import { Colors, FontSizes, FontWeights, Spacing } from '../constants/theme';
import { RootTabParamList, HabitsStackParamList, TodayStackParamList, RewardsStackParamList } from '../types';
import { exportToCSV } from '../utils/csvExport';

const Tab = createBottomTabNavigator<RootTabParamList>();
const TodayStack = createNativeStackNavigator<TodayStackParamList>();
const HabitsStack = createNativeStackNavigator<HabitsStackParamList>();
const RewardsStack = createNativeStackNavigator<RewardsStackParamList>();

// Today Stack Navigator
const TodayStackNavigator: React.FC = () => {
  return (
    <TodayStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: FontWeights.semibold },
        headerShadowVisible: false,
      }}
    >
      <TodayStack.Screen
        name="DailyView"
        component={DailyViewScreen}
        options={({ navigation }) => ({
          title: 'Today',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Progress')}
              style={styles.headerButton}
            >
              <Text style={styles.headerButtonText}>📊</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <TodayStack.Screen
        name="HabitWizard"
        component={HabitWizardScreen}
        options={{
          title: 'Complete Habit',
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <TodayStack.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          title: 'My Progress',
        }}
      />
    </TodayStack.Navigator>
  );
};

// Habits Stack Navigator
const HabitsStackNavigator: React.FC = () => {
  return (
    <HabitsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: FontWeights.semibold },
        headerShadowVisible: false,
      }}
    >
      <HabitsStack.Screen
        name="HabitsList"
        component={HabitsListScreen}
        options={{
          title: 'Habits',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleExport}
              style={styles.headerButton}
            >
              <Text style={styles.headerButtonText}>📤</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <HabitsStack.Screen
        name="HabitForm"
        component={HabitFormScreen}
        options={({ route }) => ({
          title: route.params?.habitId ? 'Edit Habit' : 'New Habit',
        })}
      />
    </HabitsStack.Navigator>
  );
};

// Rewards Stack Navigator
const RewardsStackNavigator: React.FC = () => {
  return (
    <RewardsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: FontWeights.semibold },
        headerShadowVisible: false,
      }}
    >
      <RewardsStack.Screen
        name="RewardsList"
        component={RewardsScreen}
        options={{
          headerShown: false,
        }}
      />
    </RewardsStack.Navigator>
  );
};

const handleExport = async () => {
  try {
    const success = await exportToCSV();
    if (!success) {
      Alert.alert(
        'Export Failed',
        'Unable to export data. Please try again.'
      );
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to export data');
  }
};

// Tab Bar Icon Component
const TabBarIcon: React.FC<{ focused: boolean; emoji: string }> = ({
  focused,
  emoji,
}) => (
  <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
    {emoji}
  </Text>
);

// Main App Navigator
export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textTertiary,
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tab.Screen
          name="Today"
          component={TodayStackNavigator}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon focused={focused} emoji="📅" />
            ),
          }}
        />
        <Tab.Screen
          name="Habits"
          component={HabitsStackNavigator}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon focused={focused} emoji="⚙️" />
            ),
          }}
        />
        <Tab.Screen
          name="Rewards"
          component={RewardsStackNavigator}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon focused={focused} emoji="🎁" />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    height: 60,
  },
  tabBarLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    marginTop: 2,
  },
  tabIcon: {
    fontSize: 24,
    opacity: 0.6,
  },
  tabIconFocused: {
    opacity: 1,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  headerButtonText: {
    fontSize: 20,
  },
});

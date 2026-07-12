import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { useApp } from '../context/AppContext';
import { ActiveWorkoutScreen } from '../screens/ActiveWorkoutScreen';
import { CustomSplitBuilderScreen } from '../screens/CustomSplitBuilderScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { AssessmentScreen } from '../screens/onboarding/AssessmentScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { PaywallScreen } from '../screens/PaywallScreen';
import { PhotoCompareScreen } from '../screens/PhotoCompareScreen';
import { PlanScreen } from '../screens/PlanScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { SessionDetailScreen } from '../screens/SessionDetailScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { WorkoutDetailScreen } from '../screens/WorkoutDetailScreen';
import { colors } from '../theme';
import { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Today: 'today-outline',
  Plan: 'calendar-outline',
  Progress: 'trending-up-outline',
  Profile: 'person-circle-outline',
};

const TAB_ICONS_ACTIVE: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Today: 'today',
  Plan: 'calendar',
  Progress: 'trending-up',
  Profile: 'person-circle',
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 84,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={focused ? TAB_ICONS_ACTIVE[route.name] : TAB_ICONS[route.name]}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Plan" component={PlanScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.surface,
    border: colors.border,
    text: colors.text,
    primary: colors.accent,
  },
};

export function AppNavigator() {
  const { state } = useApp();

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { fontSize: 16, fontWeight: '600', color: colors.text },
          headerTintColor: colors.accent,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        {!state.onboardingComplete ? (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Assessment" component={AssessmentScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="ActiveWorkout"
              component={ActiveWorkoutScreen}
              options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
            />
            <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} options={{ title: 'Workout' }} />
            <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
            <Stack.Screen name="SessionDetail" component={SessionDetailScreen} options={{ title: 'Session' }} />
            <Stack.Screen
              name="CustomSplitBuilder"
              component={CustomSplitBuilderScreen}
              options={{ title: 'Custom Split' }}
            />
            <Stack.Screen name="PhotoCompare" component={PhotoCompareScreen} options={{ title: 'Progress Check' }} />
          </>
        )}
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{ headerShown: false, presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

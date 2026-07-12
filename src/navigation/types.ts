import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { WorkoutType } from '../types';

export type TabParamList = {
  Today: undefined;
  Plan: undefined;
  Progress: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Assessment: undefined;
  Paywall: { source: 'onboarding' | 'upgrade' };
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  ActiveWorkout: undefined;
  WorkoutDetail: { type: WorkoutType };
  History: undefined;
  SessionDetail: { id: string };
  CustomSplitBuilder: { editId?: string } | undefined;
  PhotoCompare: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

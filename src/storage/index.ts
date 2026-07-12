import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppState } from '../types';
import { migrate } from './migrations';

const STORAGE_KEY = 'sblftr/app-state';

/** Load and migrate persisted state. Never throws; falls back to defaults. */
export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) return migrate(null);
    return migrate(JSON.parse(raw));
  } catch {
    // Corrupt JSON or storage failure: start clean rather than crash-loop.
    return migrate(null);
  }
}

/** Persist state. Failures are swallowed — losing one write beats crashing mid-set. */
export async function saveState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Best effort only.
  }
}

export async function clearState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best effort only.
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';

import { buildDefaultState } from '../defaultState';
import { clearState, loadState, saveState } from '..';

describe('AsyncStorage rehydration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns defaults when nothing is stored', async () => {
    const state = await loadState();
    expect(state.onboardingComplete).toBe(false);
    expect(state.schedule).toHaveLength(7);
  });

  it('round-trips saved state and clears activeWorkout on load', async () => {
    const state = buildDefaultState();
    state.user = 'Alex';
    state.premium = true;
    state.activeWorkout = {
      id: 'w',
      type: 'push',
      name: 'Push',
      startedAt: new Date().toISOString(),
      exercises: [],
    };
    await saveState(state);

    const loaded = await loadState();
    expect(loaded.user).toBe('Alex');
    expect(loaded.premium).toBe(true);
    // Required: in-progress workouts never survive a full restart.
    expect(loaded.activeWorkout).toBeNull();
  });

  it('recovers from corrupt JSON', async () => {
    await AsyncStorage.setItem('sblftr/app-state', '{not json');
    const state = await loadState();
    expect(state.schedule).toHaveLength(7);
    expect(state.user).toBeNull();
  });

  it('clearState removes persisted data', async () => {
    await saveState({ ...buildDefaultState(), user: 'Alex' });
    await clearState();
    const state = await loadState();
    expect(state.user).toBeNull();
  });
});

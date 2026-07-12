import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PremiumBadge } from '../components/Premium';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { Stepper } from '../components/Stepper';
import { useApp } from '../context/AppContext';
import { RootStackParamList, TabParamList } from '../navigation/types';
import { clearState } from '../storage';
import { buildDefaultState } from '../storage/defaultState';
import { colors, radii, spacing, type } from '../theme';
import { confirmDestructive } from '../utils/confirm';
import { dateKey, simulatedNow } from '../utils/date';
import { buildTestData } from '../utils/testData';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

const DEV_UNLOCK_TAPS = 7;

export function ProfileScreen({ navigation }: Props) {
  const { state, dispatch } = useApp();
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [unlockHint, setUnlockHint] = useState<string | null>(null);

  const initials = (state.user ?? 'S B')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  const onAvatarPress = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
      setUnlockHint(null);
    }, 1600);

    if (state.devMode) return;
    const remaining = DEV_UNLOCK_TAPS - tapCount.current;
    if (remaining <= 0) {
      dispatch({ type: 'SET_DEV_MODE', enabled: true });
      setUnlockHint(null);
      tapCount.current = 0;
      Alert.alert('Developer mode unlocked', 'Date simulation, test data and premium toggling are now available below.');
    } else if (remaining <= 3) {
      setUnlockHint(`${remaining} more tap${remaining === 1 ? '' : 's'} for developer mode`);
    }
  };

  const injectTestData = () => {
    Alert.alert('Inject test data', 'Adds sample workout history, weight logs and records for testing. Existing data is kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Inject',
        onPress: () => {
          const test = buildTestData(simulatedNow(state.devOffset));
          dispatch({
            type: 'INJECT_TEST_DATA',
            patch: {
              history: [...test.history, ...state.history],
              weightLog: [...test.weightLog, ...state.weightLog].sort(
                (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
              ),
            },
          });
        },
      },
    ]);
  };

  const resetApp = () => {
    confirmDestructive({
      title: 'Reset the app?',
      message: 'All workouts, weight logs, photos and settings on this device will be erased. This cannot be undone.',
      confirmLabel: 'Erase everything',
      onConfirm: () => {
        void clearState();
        dispatch({ type: 'RESET_APP', state: buildDefaultState() });
      },
    });
  };

  const legal = (doc: string) => {
    Alert.alert(doc, `The ${doc} will be linked here before release.`);
  };

  return (
    <Screen>
      <View style={styles.profileHeader}>
        <Pressable
          onPress={onAvatarPress}
          accessibilityRole="button"
          accessibilityLabel="Profile picture"
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={type.title}>{state.user ?? 'Lifter'}</Text>
          <View style={styles.planRow}>
            {state.premium ? (
              <>
                <PremiumBadge />
                <Text style={type.caption}>Premium plan</Text>
              </>
            ) : (
              <Text style={type.caption}>Free plan</Text>
            )}
          </View>
        </View>
      </View>
      {unlockHint ? <Text style={[type.caption, styles.unlockHint]}>{unlockHint}</Text> : null}

      {!state.premium ? (
        <Card
          onPress={() => navigation.navigate('Paywall', { source: 'upgrade' })}
          accessibilityLabel="Upgrade to Premium"
          style={styles.upgradeCard}
        >
          <View style={styles.rowCenter}>
            <Ionicons name="star" size={20} color={colors.premium} />
            <View style={{ flex: 1 }}>
              <Text style={type.bodyStrong}>Upgrade to Premium</Text>
              <Text style={type.caption}>Personalized split, AI assessment and progress analysis.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </View>
        </Card>
      ) : null}

      <SectionHeader title="Training settings" />
      <Card>
        <View style={styles.settingRow}>
          <Text style={[type.bodyStrong, { flex: 1 }]}>Units</Text>
          <View style={styles.unitToggle}>
            {(['lb', 'kg'] as const).map((u) => (
              <Pressable
                key={u}
                onPress={() => dispatch({ type: 'SET_UNITS', units: u })}
                accessibilityRole="radio"
                accessibilityState={{ selected: state.units === u }}
                accessibilityLabel={`Use ${u === 'lb' ? 'pounds' : 'kilograms'}`}
                style={[styles.unitOption, state.units === u ? styles.unitOptionActive : null]}
              >
                <Text style={[type.bodyStrong, state.units === u ? { color: colors.textInverse } : null]}>{u}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.divider} />
        <Stepper
          label="Default rest timer"
          value={`${state.restDefault}s`}
          onIncrement={() => dispatch({ type: 'SET_REST_DEFAULT', seconds: state.restDefault + 15 })}
          onDecrement={() => dispatch({ type: 'SET_REST_DEFAULT', seconds: state.restDefault - 15 })}
          incrementHint="Adds 15 seconds"
          decrementHint="Removes 15 seconds"
        />
      </Card>

      {state.premium ? (
        <>
          <SectionHeader title="My plan" />
          <Card
            onPress={() => navigation.navigate('CustomSplitBuilder', undefined)}
            accessibilityLabel="Open the custom split builder"
          >
            <View style={styles.rowCenter}>
              <Ionicons name="construct-outline" size={20} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={type.bodyStrong}>Custom split builder</Text>
                <Text style={type.caption}>Design and manage your own training weeks.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>
          </Card>
        </>
      ) : null}

      <SectionHeader title="About" />
      <Card>
        <LinkRow label="Privacy Policy" onPress={() => legal('Privacy Policy')} />
        <View style={styles.divider} />
        <LinkRow label="Terms of Service" onPress={() => legal('Terms of Service')} />
        <View style={styles.divider} />
        <LinkRow
          label="How your data is handled"
          onPress={() =>
            Alert.alert(
              'Your data',
              'Everything you log lives on this device. Photos are only sent to our AI analysis service when you explicitly start an assessment or comparison — never automatically.'
            )
          }
        />
      </Card>

      {state.devMode ? (
        <>
          <SectionHeader title="Developer" />
          <Card style={styles.devCard}>
            <Text style={[type.caption, { marginBottom: spacing.md, color: colors.warning }]}>
              Development controls — not part of the production experience.
            </Text>
            <View style={styles.settingRow}>
              <Text style={[type.bodyStrong, { flex: 1 }]}>Premium (testing)</Text>
              <Switch
                value={state.premium}
                onValueChange={(v) => dispatch({ type: 'SET_PREMIUM', premium: v })}
                trackColor={{ false: colors.surfaceRaised, true: colors.accentDim }}
                thumbColor={state.premium ? colors.accent : colors.textTertiary}
                accessibilityLabel="Toggle premium for testing"
              />
            </View>
            <View style={styles.divider} />
            <Stepper
              label={`Simulated date · ${dateKey(simulatedNow(state.devOffset))}`}
              value={`${state.devOffset >= 0 ? '+' : ''}${state.devOffset}d`}
              onIncrement={() => dispatch({ type: 'SET_DEV_OFFSET', days: state.devOffset + 1 })}
              onDecrement={() => dispatch({ type: 'SET_DEV_OFFSET', days: state.devOffset - 1 })}
            />
            <View style={styles.divider} />
            <Button label="Inject test data" onPress={injectTestData} variant="secondary" size="medium" />
            <Button
              label="Disable developer mode"
              onPress={() => dispatch({ type: 'SET_DEV_MODE', enabled: false })}
              variant="ghost"
              size="medium"
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        </>
      ) : null}

      <View style={{ marginTop: spacing.xl }}>
        <Button label="Reset app data" onPress={resetApp} variant="danger" size="medium" />
      </View>
    </Screen>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.linkRow, pressed ? { opacity: 0.7 } : null]}
    >
      <Text style={[type.bodyStrong, { flex: 1 }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.lg },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  avatarText: { ...type.title, color: colors.accent },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  unlockHint: { color: colors.info, marginTop: spacing.sm },
  upgradeCard: { marginTop: spacing.lg, borderColor: colors.premiumDim },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  settingRow: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.md },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    padding: 3,
  },
  unitOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    minWidth: 52,
    alignItems: 'center',
  },
  unitOptionActive: { backgroundColor: colors.accent },
  linkRow: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  devCard: { borderColor: colors.warning, borderStyle: 'dashed' },
});

import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { PremiumGate } from '../components/Premium';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { Sheet } from '../components/Sheet';
import { TextField } from '../components/TextField';
import { WeightChart } from '../components/WeightChart';
import { useApp } from '../context/AppContext';
import { RootStackParamList, TabParamList } from '../navigation/types';
import { deletePhotoFile, persistPhoto, pickPhoto } from '../services/photos';
import { colors, hitSlop, radii, spacing, type } from '../theme';
import { WeightEntry } from '../types';
import { confirmDestructive } from '../utils/confirm';
import { formatMediumDate, simulatedNow } from '../utils/date';
import { uid } from '../utils/id';
import { formatWeight, fromDisplayWeight, parseNumericInput } from '../utils/units';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Progress'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function ProgressScreen({ navigation }: Props) {
  const { state, dispatch } = useApp();
  const { width } = useWindowDimensions();
  const [logOpen, setLogOpen] = useState(false);
  const [weightText, setWeightText] = useState('');
  const [weightError, setWeightError] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);

  const startingWeight = state.weightLbs;
  const currentWeight = state.weightLog.length > 0 ? state.weightLog[0].weightLbs : startingWeight;

  // Chart data: logged entries, or the onboarding starting weight as a single point.
  const chartEntries: WeightEntry[] =
    state.weightLog.length > 0
      ? state.weightLog
      : startingWeight !== null
        ? [{ id: 'start', dateISO: new Date().toISOString(), weightLbs: startingWeight }]
        : [];

  const logWeight = () => {
    const value = parseNumericInput(weightText);
    if (value === null || value <= 0) {
      setWeightError(`Enter your weight in ${state.units}.`);
      return;
    }
    dispatch({
      type: 'LOG_WEIGHT',
      entry: {
        id: uid(),
        dateISO: simulatedNow(state.devOffset).toISOString(),
        weightLbs: fromDisplayWeight(value, state.units),
      },
    });
    setWeightText('');
    setWeightError(null);
    setLogOpen(false);
  };

  const deleteEntry = (entry: WeightEntry) => {
    confirmDestructive({
      title: 'Delete weight entry?',
      message: `${formatWeight(entry.weightLbs, state.units)} on ${formatMediumDate(entry.dateISO)} will be removed.`,
      confirmLabel: 'Delete',
      onConfirm: () => dispatch({ type: 'DELETE_WEIGHT', id: entry.id }),
    });
  };

  const addProgressPhoto = async () => {
    setPhotoBusy(true);
    setPhotoNotice(null);
    const result = await pickPhoto();
    if (result.status === 'picked') {
      const id = uid();
      const storedUri = await persistPhoto(result.photo.uri, id);
      dispatch({
        type: 'ADD_PHOTO',
        photo: { id, uri: storedUri, dateISO: simulatedNow(state.devOffset).toISOString(), pose: 'progress' },
      });
    } else if (result.status === 'denied') {
      setPhotoNotice('Photo access is off — enable it in Settings to add progress photos.');
    } else if (result.status === 'error') {
      setPhotoNotice(result.message);
    }
    setPhotoBusy(false);
  };

  const deletePhoto = (id: string, uri: string) => {
    confirmDestructive({
      title: 'Delete photo?',
      message: 'This progress photo will be removed from your device.',
      confirmLabel: 'Delete',
      onConfirm: () => {
        dispatch({ type: 'DELETE_PHOTO', id });
        void deletePhotoFile(uri);
      },
    });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={type.title}>Progress</Text>
      </View>

      <View style={styles.statRow}>
        <Card style={styles.statCard}>
          <Text style={type.label}>Starting</Text>
          <Text style={[type.stat, { marginTop: spacing.xs }]}>
            {startingWeight !== null ? formatWeight(startingWeight, state.units, false) : '—'}
          </Text>
          <Text style={type.caption}>{state.units}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={type.label}>Current</Text>
          <Text style={[type.stat, { marginTop: spacing.xs, color: colors.accent }]}>
            {currentWeight !== null ? formatWeight(currentWeight, state.units, false) : '—'}
          </Text>
          <Text style={type.caption}>{state.units}</Text>
        </Card>
      </View>

      <SectionHeader title="Body weight" action={{ label: 'Log weight', onPress: () => setLogOpen(true) }} />
      {chartEntries.length > 0 ? (
        <Card>
          <WeightChart entries={chartEntries} units={state.units} width={width - spacing.xl * 2 - spacing.lg * 2} />
        </Card>
      ) : (
        <EmptyState
          icon="scale-outline"
          title="No weight data yet"
          message="Log your first weigh-in to start the trend line."
          action={{ label: 'Log weight', onPress: () => setLogOpen(true) }}
        />
      )}

      {state.weightLog.length > 0 ? (
        <Card style={{ marginTop: spacing.md }}>
          {state.weightLog.slice(0, 30).map((entry, index) => (
            <View key={entry.id} style={[styles.logRow, index > 0 ? styles.logRowBorder : null]}>
              <View style={{ flex: 1 }}>
                <Text style={type.bodyStrong}>{formatWeight(entry.weightLbs, state.units)}</Text>
                <Text style={type.caption}>{formatMediumDate(entry.dateISO)}</Text>
              </View>
              <Pressable
                onPress={() => deleteEntry(entry)}
                hitSlop={hitSlop}
                accessibilityRole="button"
                accessibilityLabel={`Delete weight entry from ${formatMediumDate(entry.dateISO)}`}
              >
                <Ionicons name="trash-outline" size={20} color={colors.textTertiary} />
              </Pressable>
            </View>
          ))}
        </Card>
      ) : null}

      <SectionHeader title="Strength" action={{ label: 'History', onPress: () => navigation.navigate('History') }} />
      <Card
        onPress={() => navigation.navigate('History')}
        accessibilityLabel={`Workout history, ${state.history.length} sessions`}
      >
        <View style={styles.historyRow}>
          <View style={styles.historyBadge}>
            <Ionicons name="barbell-outline" size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={type.bodyStrong}>
              {state.history.length} session{state.history.length === 1 ? '' : 's'} logged
            </Text>
            <Text style={type.caption}>
              {state.history.reduce((s, h) => s + h.prs.length, 0)} personal records so far
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </View>
      </Card>

      <SectionHeader title="Progress photos" />
      <Card>
        <Text style={[type.caption, { marginBottom: spacing.md }]}>
          Photos stay on your device unless you explicitly run an AI comparison.
        </Text>
        {state.photos.length > 0 ? (
          <View style={styles.photoGrid}>
            {state.photos.slice(0, 9).map((photo) => (
              <Pressable
                key={photo.id}
                onLongPress={() => deletePhoto(photo.id, photo.uri)}
                accessibilityLabel={`Progress photo from ${formatMediumDate(photo.dateISO)}`}
                style={styles.photoCell}
              >
                <Image source={{ uri: photo.uri }} style={styles.photoImage} accessibilityIgnoresInvertColors />
                <Pressable
                  onPress={() => deletePhoto(photo.id, photo.uri)}
                  hitSlop={hitSlop}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete photo from ${formatMediumDate(photo.dateISO)}`}
                  style={styles.photoDelete}
                >
                  <Ionicons name="close-circle" size={20} color={colors.danger} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        ) : null}
        <Button
          label={state.photos.length === 0 ? 'Add first photo' : 'Add photo'}
          onPress={() => void addProgressPhoto()}
          variant="secondary"
          size="medium"
          loading={photoBusy}
        />
        {photoNotice ? (
          <Text style={[type.caption, { color: colors.warning, marginTop: spacing.sm }]} accessibilityLiveRegion="polite">
            {photoNotice}
          </Text>
        ) : null}
      </Card>

      <View style={{ marginTop: spacing.md }}>
        <PremiumGate
          feature="ai-photo-comparison"
          premium={state.premium}
          onUpgrade={() => navigation.navigate('Paywall', { source: 'upgrade' })}
          lockedMessage="Pick a before and after photo and get an honest AI read on what changed — strengths, focus areas and a straight verdict."
        >
          <Card
            onPress={() => navigation.navigate('PhotoCompare')}
            accessibilityLabel="AI progress comparison"
            accessibilityHint="Compare a before and after photo"
          >
            <View style={styles.historyRow}>
              <View style={[styles.historyBadge, { backgroundColor: colors.premiumDim }]}>
                <Ionicons name="images-outline" size={20} color={colors.premium} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={type.bodyStrong}>AI progress comparison</Text>
                <Text style={type.caption}>
                  {state.lastComparison
                    ? `Last check-in ${formatMediumDate(state.lastComparison.dateISO)}`
                    : 'Compare a before and after photo'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>
          </Card>
        </PremiumGate>
      </View>

      <Sheet visible={logOpen} title="Log weight" onClose={() => setLogOpen(false)}>
        <TextField
          label={`Weight (${state.units})`}
          value={weightText}
          onChangeText={(t) => {
            setWeightText(t);
            setWeightError(null);
          }}
          keyboardType="decimal-pad"
          placeholder={state.units === 'lb' ? '165' : '75'}
          error={weightError}
          autoFocus
        />
        <Button label="Save entry" onPress={logWeight} style={{ marginTop: spacing.xl }} />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.lg, marginBottom: spacing.lg },
  statRow: { flexDirection: 'row', gap: spacing.md },
  statCard: { flex: 1, alignItems: 'center' },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  logRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  historyBadge: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  photoCell: { width: '31%', aspectRatio: 3 / 4, borderRadius: radii.md, overflow: 'visible' },
  photoImage: { width: '100%', height: '100%', borderRadius: radii.md },
  photoDelete: { position: 'absolute', top: -6, right: -6 },
});

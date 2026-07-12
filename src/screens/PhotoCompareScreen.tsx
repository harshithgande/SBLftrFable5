import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { PremiumGate } from '../components/Premium';
import { Screen } from '../components/Screen';
import { useApp } from '../context/AppContext';
import { RootScreenProps } from '../navigation/types';
import { generateComparison } from '../services/assessment';
import { aiErrorMessage, hasApiKey } from '../services/openai';
import { pickPhoto, toDataUrl } from '../services/photos';
import { colors, radii, spacing, type } from '../theme';
import { formatMediumDate } from '../utils/date';

/**
 * Premium AI before/after comparison. Both photos are explicitly labeled
 * (IMAGE 1 = BEFORE, IMAGE 2 = AFTER) in the prompt, and nothing is uploaded
 * until the user taps "Run comparison" after the disclosure.
 */

type Phase = 'idle' | 'running' | 'done' | 'error';

export function PhotoCompareScreen({ navigation }: RootScreenProps<'PhotoCompare'>) {
  const { state, dispatch } = useApp();
  const [beforeUri, setBeforeUri] = useState<string | null>(null);
  const [afterUri, setAfterUri] = useState<string | null>(null);
  const [busySlot, setBusySlot] = useState<'before' | 'after' | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorText, setErrorText] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const comparison = state.lastComparison;

  const pick = async (slot: 'before' | 'after') => {
    setBusySlot(slot);
    setNotice(null);
    const result = await pickPhoto();
    setBusySlot(null);
    if (result.status === 'picked') {
      if (slot === 'before') setBeforeUri(result.photo.uri);
      else setAfterUri(result.photo.uri);
    } else if (result.status === 'denied') {
      setNotice('Photo access is off — enable it in Settings to pick photos.');
    } else if (result.status === 'error') {
      setNotice(result.message);
    }
  };

  const run = async () => {
    if (!beforeUri || !afterUri) return;
    if (!hasApiKey()) {
      setErrorText('AI comparison needs a developer API key configured in this build.');
      setPhase('error');
      return;
    }
    setPhase('running');
    setErrorText('');
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const [beforeData, afterData] = await Promise.all([toDataUrl(beforeUri), toDataUrl(afterUri)]);
      if (!beforeData || !afterData) {
        throw new Error('One of the photos could not be read from your device.');
      }
      const result = await generateComparison(beforeData, afterData, controller.signal);
      dispatch({ type: 'SET_COMPARISON', comparison: result });
      setPhase('done');
    } catch (err) {
      setErrorText(err instanceof Error && !('kind' in err) ? err.message : aiErrorMessage(err));
      setPhase('error');
    }
  };

  return (
    <Screen>
      <PremiumGate
        feature="ai-photo-comparison"
        premium={state.premium}
        onUpgrade={() => navigation.navigate('Paywall', { source: 'upgrade' })}
        lockedMessage="AI progress comparison is a Premium feature."
      >
        <View style={styles.header}>
          <Text style={type.title}>Progress check</Text>
          <Text style={[type.body, { marginTop: spacing.xs }]}>
            Pick a before and an after photo. Similar lighting, pose and distance make the read far
            more reliable.
          </Text>
        </View>

        <View style={styles.slotRow}>
          <PhotoPick label="Before" uri={beforeUri} busy={busySlot === 'before'} onPress={() => void pick('before')} />
          <PhotoPick label="After" uri={afterUri} busy={busySlot === 'after'} onPress={() => void pick('after')} />
        </View>
        {notice ? (
          <Text style={[type.caption, { color: colors.warning, marginTop: spacing.sm }]} accessibilityLiveRegion="polite">
            {notice}
          </Text>
        ) : null}

        <Card style={{ marginTop: spacing.lg }}>
          <View style={styles.disclosureRow}>
            <Ionicons name="cloud-upload-outline" size={18} color={colors.info} />
            <Text style={[type.caption, { flex: 1 }]}>
              Running a comparison sends both photos to our AI analysis service once. Nothing is
              uploaded until you tap the button, and the photos themselves aren’t stored anywhere else.
            </Text>
          </View>
        </Card>

        <Button
          label={phase === 'running' ? 'Analyzing…' : 'Run comparison'}
          onPress={() => void run()}
          disabled={!beforeUri || !afterUri || phase === 'running'}
          loading={phase === 'running'}
          style={{ marginTop: spacing.lg }}
        />

        {phase === 'error' ? (
          <Card style={styles.errorCard}>
            <Text style={[type.bodyStrong, { color: colors.danger }]}>Comparison failed</Text>
            <Text style={[type.body, { marginTop: spacing.xs }]}>{errorText}</Text>
            <Button label="Try again" onPress={() => void run()} variant="secondary" size="medium" style={{ marginTop: spacing.md }} />
          </Card>
        ) : null}

        {comparison ? (
          <View style={{ marginTop: spacing.xl }}>
            <Text style={type.label}>
              {phase === 'done' ? 'Your comparison' : `Last comparison · ${formatMediumDate(comparison.dateISO)}`}
            </Text>
            <View style={styles.tChart}>
              <View style={[styles.tColumn, { marginRight: spacing.sm }]}>
                <View style={styles.tHeader}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={[type.label, { color: colors.success }]}>Strengths now</Text>
                </View>
                {comparison.strengths.map((item) => (
                  <Text key={item} style={[type.body, styles.tItem]}>
                    {item}
                  </Text>
                ))}
              </View>
              <View style={styles.tColumn}>
                <View style={styles.tHeader}>
                  <Ionicons name="locate" size={16} color={colors.accent} />
                  <Text style={[type.label, { color: colors.accent }]}>Focus on</Text>
                </View>
                {comparison.focus.map((item) => (
                  <Text key={item} style={[type.body, styles.tItem]}>
                    {item}
                  </Text>
                ))}
              </View>
            </View>
            <Card raised style={{ marginTop: spacing.md }}>
              <View style={styles.tHeader}>
                <Ionicons name="git-compare-outline" size={16} color={colors.info} />
                <Text style={[type.label, { color: colors.info }]}>Verdict</Text>
              </View>
              <Text style={[type.body, { color: colors.text }]}>{comparison.verdict}</Text>
            </Card>
            <Text style={[type.caption, { marginTop: spacing.md }]}>
              Photo comparisons are informative, not exact — lighting, pose and camera angle change
              how a physique reads. This is never medical advice.
            </Text>
          </View>
        ) : null}
      </PremiumGate>
    </Screen>
  );
}

function PhotoPick({ label, uri, busy, onPress }: { label: string; uri: string | null; busy: boolean; onPress: () => void }) {
  return (
    <View style={styles.slotWrap}>
      <Pressable
        onPress={onPress}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={uri ? `Replace ${label} photo` : `Choose ${label} photo`}
        style={({ pressed }) => [styles.slot, pressed ? { opacity: 0.8 } : null]}
      >
        {busy ? (
          <ActivityIndicator color={colors.accent} />
        ) : uri ? (
          <Image source={{ uri }} style={styles.slotImage} accessibilityIgnoresInvertColors />
        ) : (
          <View style={styles.slotEmpty}>
            <Ionicons name="add" size={26} color={colors.textTertiary} />
            <Text style={type.caption}>{label}</Text>
          </View>
        )}
      </Pressable>
      <Text style={[type.caption, styles.slotLabel]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.md, marginBottom: spacing.lg },
  slotRow: { flexDirection: 'row', gap: spacing.md },
  slotWrap: { flex: 1 },
  slot: {
    aspectRatio: 3 / 4,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slotImage: { width: '100%', height: '100%' },
  slotEmpty: { alignItems: 'center', gap: spacing.xs },
  slotLabel: { textAlign: 'center', marginTop: spacing.sm },
  disclosureRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  errorCard: { marginTop: spacing.md, borderColor: colors.danger },
  tChart: { flexDirection: 'row', marginTop: spacing.md },
  tColumn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  tHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  tItem: { marginBottom: spacing.sm, color: colors.text },
});

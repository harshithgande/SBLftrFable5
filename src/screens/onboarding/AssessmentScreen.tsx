import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { Skeleton } from '../../components/Skeleton';
import { WeekStrip } from '../../components/WeekStrip';
import { useApp } from '../../context/AppContext';
import { RootScreenProps } from '../../navigation/types';
import { generateAssessment } from '../../services/assessment';
import { buildFallbackAssessment } from '../../services/fallback';
import { AIError, aiErrorMessage, hasApiKey } from '../../services/openai';
import { toDataUrl } from '../../services/photos';
import { colors, radii, spacing, type } from '../../theme';
import { AIAssessment } from '../../types';
import { assignSplit } from '../../utils/split';

/**
 * Generates the AI assessment right after the questions — the "analyzing"
 * moment research shows makes personalization feel earned — then reveals the
 * full plan BEFORE any payment ask. Failure never traps the user: retry or
 * continue with the locally built plan.
 */

const LOADING_LINES = [
  'Reading your training profile…',
  'Weighing your goal against your schedule…',
  'Choosing your weekly split…',
  'Ordering exercises for your priorities…',
];

type Phase = 'loading' | 'ready' | 'error';

export function AssessmentScreen({ navigation }: RootScreenProps<'Assessment'>) {
  const { state, dispatch } = useApp();
  const [phase, setPhase] = useState<Phase>('loading');
  const [errorText, setErrorText] = useState('');
  const [loadingLine, setLoadingLine] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const profile = {
    user: state.user,
    physique: state.physique,
    experience: state.experience,
    frequency: state.frequency,
    heightFeet: state.heightFeet,
    heightInches: state.heightInches,
    weightLbs: state.weightLbs,
    obstacles: state.obstacles,
    limitations: state.limitations,
  };

  const run = useCallback(async () => {
    setPhase('loading');
    setErrorText('');
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      if (!hasApiKey()) throw new AIError('no-key', 'No key');

      const images: string[] = [];
      for (const uri of [state.onboardingPhotoUri, state.onboardingRearPhotoUri]) {
        if (!uri) continue;
        const dataUrl = await toDataUrl(uri);
        if (dataUrl) images.push(dataUrl);
      }

      const assessment = await generateAssessment(profile, images, controller.signal);
      dispatch({ type: 'SET_ASSESSMENT', assessment, gptPlan: rawPlanText(assessment) });
      setPhase('ready');
    } catch (err) {
      if (err instanceof AIError && err.kind === 'no-key') {
        // No key configured: go straight to the built-in plan, no error wall.
        const fallback = buildFallbackAssessment(profile);
        dispatch({ type: 'SET_ASSESSMENT', assessment: fallback, gptPlan: rawPlanText(fallback) });
        setPhase('ready');
        return;
      }
      setErrorText(aiErrorMessage(err));
      setPhase('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, state.onboardingPhotoUri, state.onboardingRearPhotoUri]);

  useEffect(() => {
    void run();
    return () => abortRef.current?.abort();
  }, [run]);

  useEffect(() => {
    if (phase !== 'loading') return;
    const timer = setInterval(() => setLoadingLine((i) => (i + 1) % LOADING_LINES.length), 1600);
    return () => clearInterval(timer);
  }, [phase]);

  const useFallback = () => {
    const fallback = buildFallbackAssessment(profile);
    dispatch({ type: 'SET_ASSESSMENT', assessment: fallback, gptPlan: rawPlanText(fallback) });
    setPhase('ready');
  };

  const assessment = state.assessment;
  const premiumPreview = assignSplit(true, state.frequency);
  const firstName = (state.user ?? '').split(' ')[0];

  if (phase === 'loading') {
    return (
      <Screen scroll={false} contentStyle={styles.loadingWrap}>
        <View style={styles.loadingBadge}>
          <Ionicons name="sparkles" size={30} color={colors.accent} />
        </View>
        <Text style={[type.title, styles.center]}>Building your plan</Text>
        <Text style={[type.body, styles.center, { marginTop: spacing.sm }]} accessibilityLiveRegion="polite">
          {LOADING_LINES[loadingLine]}
        </Text>
        <View style={styles.skeletons}>
          <Skeleton height={90} style={{ borderRadius: radii.lg }} />
          <Skeleton height={140} style={{ borderRadius: radii.lg, marginTop: spacing.md }} />
          <Skeleton height={64} style={{ borderRadius: radii.lg, marginTop: spacing.md }} />
        </View>
      </Screen>
    );
  }

  if (phase === 'error' || !assessment) {
    return (
      <Screen scroll={false} contentStyle={styles.loadingWrap}>
        <View style={[styles.loadingBadge, { backgroundColor: colors.warningDim }]}>
          <Ionicons name="cloud-offline-outline" size={30} color={colors.warning} />
        </View>
        <Text style={[type.title, styles.center]}>Analysis didn’t go through</Text>
        <Text style={[type.body, styles.center, { marginTop: spacing.sm, maxWidth: 300 }]}>
          {errorText || 'Something went wrong while generating your analysis.'}
        </Text>
        <View style={styles.errorButtons}>
          <Button label="Try again" onPress={() => void run()} />
          <Button
            label="Continue with built-in plan"
            onPress={useFallback}
            variant="secondary"
            style={{ marginTop: spacing.md }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <Button
          label="See my full plan"
          onPress={() => navigation.navigate('Paywall', { source: 'onboarding' })}
        />
      }
    >
      <View style={styles.readyHeader}>
        <Text style={type.label}>Your assessment{firstName ? `, ${firstName}` : ''}</Text>
        <Text style={[type.title, { marginTop: spacing.xs }]}>{assessment.overview}</Text>
        {assessment.fallback ? (
          <View style={styles.fallbackTag}>
            <Ionicons name="information-circle-outline" size={14} color={colors.info} />
            <Text style={[type.caption, { color: colors.info, flex: 1 }]}>
              Built from your answers using our training guidelines.
            </Text>
          </View>
        ) : !assessment.usedPhotos ? (
          <Text style={[type.caption, { marginTop: spacing.sm }]}>
            Based on your answers — add photos later for a visual check-in.
          </Text>
        ) : null}
      </View>

      <View style={styles.tChart}>
        <View style={[styles.tColumn, { marginRight: spacing.sm }]}>
          <View style={styles.tHeader}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[type.label, { color: colors.success }]}>Strengths</Text>
          </View>
          {assessment.strengths.map((item) => (
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
          {assessment.focus.map((item) => (
            <Text key={item} style={[type.body, styles.tItem]}>
              {item}
            </Text>
          ))}
        </View>
      </View>

      <Card raised style={{ marginTop: spacing.xl }}>
        <Text style={type.label}>Your recommended week</Text>
        <Text style={[type.subheading, { marginVertical: spacing.sm }]}>
          {state.frequency ?? 4} training days, built for your goal
        </Text>
        <WeekStrip schedule={premiumPreview.schedule} />
        <Text style={[type.caption, { marginTop: spacing.md }]}>
          U upper · L lower · FB full body — rest days are part of the plan, not a failure.
        </Text>
      </Card>
    </Screen>
  );
}

/** Reconstruct the plain-text plan for persistence in gptPlan. */
function rawPlanText(a: AIAssessment): string {
  return [
    'OVERVIEW',
    a.overview,
    '',
    'CURRENT STRENGTHS',
    ...a.strengths.map((s) => `- ${s}`),
    '',
    'WHAT TO FOCUS ON',
    ...a.focus.map((s) => `- ${s}`),
  ].join('\n');
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  loadingWrap: { justifyContent: 'center', alignItems: 'center' },
  loadingBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  skeletons: { alignSelf: 'stretch', marginTop: spacing.xxl },
  errorButtons: { alignSelf: 'stretch', marginTop: spacing.xxl },
  readyHeader: { marginTop: spacing.xl },
  fallbackTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    backgroundColor: colors.infoDim,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  tChart: { flexDirection: 'row', marginTop: spacing.xl },
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

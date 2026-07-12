import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { useApp } from '../../context/AppContext';
import { RootScreenProps } from '../../navigation/types';
import { pickPhoto, preparePhotoPermission } from '../../services/photos';
import { colors, hitSlop, radii, spacing, type } from '../../theme';
import { ExperienceLevel, Obstacle, Physique, Units } from '../../types';
import { fromDisplayWeight, parseNumericInput } from '../../utils/units';

/**
 * Onboarding: nine focused questions, one per screen, with a visible progress
 * bar and free back-navigation. Answers persist to storage on every step so
 * an interrupted setup resumes where it left off. Photos come last, after the
 * user has seen why they matter, and are clearly optional.
 */

type StepId =
  | 'welcome'
  | 'name'
  | 'goal'
  | 'experience'
  | 'body'
  | 'frequency'
  | 'obstacles'
  | 'limitations'
  | 'photos';

const STEPS: StepId[] = [
  'welcome',
  'name',
  'goal',
  'experience',
  'body',
  'frequency',
  'obstacles',
  'limitations',
  'photos',
];

const GOAL_OPTIONS: { id: Physique; title: string; sub: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'athletic', title: 'Athletic', sub: 'Lean, functional, move well', icon: 'flash-outline' },
  { id: 'aesthetic', title: 'Aesthetic', sub: 'Defined physique, V-taper', icon: 'body-outline' },
  { id: 'strongman', title: 'Powerhouse', sub: 'Maximum size and strength', icon: 'barbell-outline' },
];

const EXPERIENCE_OPTIONS: { id: ExperienceLevel; title: string; sub: string }[] = [
  { id: 'beginner', title: 'Beginner', sub: 'Under 6 months' },
  { id: 'novice', title: 'Novice', sub: '6 to 12 months' },
  { id: 'intermediate', title: 'Intermediate', sub: '1 to 3 years' },
  { id: 'advanced', title: 'Advanced', sub: 'Over 3 years' },
];

const OBSTACLE_OPTIONS: { id: Obstacle; label: string }[] = [
  { id: 'consistency', label: 'Consistency' },
  { id: 'diet', label: 'Diet' },
  { id: 'motivation', label: 'Motivation' },
  { id: 'time', label: 'Time' },
  { id: 'knowledge', label: 'Knowledge' },
  { id: 'recovery', label: 'Recovery' },
  { id: 'plateau', label: 'Plateau' },
  { id: 'no-gym', label: 'No gym' },
];

const FREQUENCY_OPTIONS = [3, 4, 5, 6];

export function OnboardingScreen({ navigation }: RootScreenProps<'Onboarding'>) {
  const { state, dispatch } = useApp();

  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState(state.user ?? '');
  const [goal, setGoal] = useState<Physique | null>(state.physique);
  const [experience, setExperience] = useState<ExperienceLevel | null>(state.experience);
  const [feet, setFeet] = useState(state.heightFeet !== null ? `${state.heightFeet}` : '');
  const [inches, setInches] = useState(state.heightInches !== null ? `${state.heightInches}` : '');
  const [weightText, setWeightText] = useState('');
  const [weightUnits, setWeightUnits] = useState<Units>(state.units);
  const [frequency, setFrequency] = useState<number | null>(state.frequency);
  const [obstacles, setObstacles] = useState<Obstacle[]>(state.obstacles);
  const [limitations, setLimitations] = useState(state.limitations ?? '');
  const [frontPhoto, setFrontPhoto] = useState<string | null>(state.onboardingPhotoUri);
  const [rearPhoto, setRearPhoto] = useState<string | null>(state.onboardingRearPhotoUri);
  const [pickerBusy, setPickerBusy] = useState<'front' | 'rear' | null>(null);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const step = STEPS[stepIndex];

  // Prepare the permission prompt once the user reaches the photo step and
  // has read why photos help — before they tap, so the picker opens fast.
  useEffect(() => {
    if (step === 'photos') {
      void preparePhotoPermission();
    }
  }, [step]);

  const persistAnswers = () => {
    const weightValue = parseNumericInput(weightText);
    dispatch({
      type: 'SAVE_ONBOARDING_ANSWERS',
      answers: {
        user: name.trim() === '' ? undefined : name.trim(),
        physique: goal ?? undefined,
        experience: experience ?? undefined,
        heightFeet: parseNumericInput(feet) ?? undefined,
        heightInches: parseNumericInput(inches) ?? undefined,
        weightLbs: weightValue !== null ? fromDisplayWeight(weightValue, weightUnits) : undefined,
        frequency: frequency ?? undefined,
        obstacles,
        limitations: limitations.trim() === '' ? null : limitations.trim(),
        onboardingPhotoUri: frontPhoto,
        onboardingRearPhotoUri: rearPhoto,
      },
    });
  };

  const validation = useMemo((): string | null => {
    switch (step) {
      case 'name':
        return name.trim().length > 0 ? null : 'Enter a name so we can personalize your plan.';
      case 'goal':
        return goal !== null ? null : 'Pick the physique you are training toward.';
      case 'experience':
        return experience !== null ? null : 'Pick your experience level.';
      case 'body': {
        const f = parseNumericInput(feet);
        const i = parseNumericInput(inches);
        const w = parseNumericInput(weightText);
        if (f === null || f < 3 || f > 8) return 'Enter your height in feet (3–8).';
        if (i === null || i > 11.9) return 'Enter inches between 0 and 11.';
        if (w === null || w <= 0) return 'Enter your current body weight.';
        return null;
      }
      case 'frequency':
        return frequency !== null ? null : 'Pick how many days you can train.';
      default:
        return null;
    }
  }, [step, name, goal, experience, feet, inches, weightText, frequency]);

  const goNext = () => {
    if (validation) {
      setFieldError(validation);
      return;
    }
    setFieldError(null);
    persistAnswers();
    if (stepIndex === STEPS.length - 1) {
      dispatch({ type: 'SET_UNITS', units: weightUnits });
      navigation.navigate('Assessment');
      return;
    }
    setStepIndex((s) => s + 1);
  };

  const goBack = () => {
    setFieldError(null);
    persistAnswers();
    setStepIndex((s) => Math.max(0, s - 1));
  };

  const toggleObstacle = (id: Obstacle) => {
    setObstacles((prev) => (prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]));
  };

  const addPhoto = async (slot: 'front' | 'rear') => {
    setPickerBusy(slot);
    setPhotoNotice(null);
    const result = await pickPhoto();
    setPickerBusy(null);
    if (result.status === 'picked') {
      if (slot === 'front') setFrontPhoto(result.photo.uri);
      else setRearPhoto(result.photo.uri);
    } else if (result.status === 'denied') {
      setPhotoNotice(
        'Photo access is off. You can enable it in Settings, or just continue — the plan works without photos.'
      );
    } else if (result.status === 'error') {
      setPhotoNotice(result.message);
    }
  };

  const progress = stepIndex / (STEPS.length - 1);

  return (
    <Screen
      scroll={step !== 'welcome'}
      footer={
        <View>
          {fieldError ? (
            <Text style={styles.fieldError} accessibilityLiveRegion="polite">
              {fieldError}
            </Text>
          ) : null}
          <Button
            label={
              step === 'welcome'
                ? 'Get started'
                : step === 'photos'
                  ? frontPhoto || rearPhoto
                    ? 'Analyze my physique'
                    : 'Continue without photos'
                  : 'Continue'
            }
            onPress={goNext}
            disabled={pickerBusy !== null}
          />
        </View>
      }
    >
      {step !== 'welcome' ? (
        <View style={styles.topBar}>
          <Pressable
            onPress={goBack}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Go back to the previous question"
          >
            <Ionicons name="chevron-back" size={26} color={colors.textSecondary} />
          </Pressable>
          <View
            style={styles.progressTrack}
            accessibilityRole="progressbar"
            accessibilityLabel="Setup progress"
            accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
          >
            <View style={[styles.progressFill, { width: `${Math.max(6, progress * 100)}%` }]} />
          </View>
          <Text style={styles.stepCount}>
            {stepIndex}/{STEPS.length - 1}
          </Text>
        </View>
      ) : null}

      {step === 'welcome' ? (
        <View style={styles.welcomeWrap}>
          <View style={styles.logoBadge}>
            <Ionicons name="barbell" size={34} color={colors.accent} />
          </View>
          <Text style={[type.display, styles.center]}>SBLftr</Text>
          <Text style={[type.body, styles.center, styles.welcomeSub]}>
            Science-based training, built around you. Answer a few quick questions and get a
            personalized plan — setup takes about two minutes.
          </Text>
          <View style={styles.welcomePoints}>
            <WelcomePoint icon="sparkles-outline" text="A training split matched to your goal and schedule" />
            <WelcomePoint icon="stopwatch-outline" text="Fast set logging with automatic rest timers" />
            <WelcomePoint icon="trending-up-outline" text="Strength, weight and consistency tracking" />
          </View>
          <Text style={[type.caption, styles.center]}>
            Your answers stay on this device. No account needed.
          </Text>
        </View>
      ) : null}

      {step === 'name' ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <StepTitle title="What should we call you?" sub="Your name personalizes your plan and your daily check-ins." />
          <TextField
            label="Name"
            value={name}
            onChangeText={(t) => {
              setName(t);
              setFieldError(null);
            }}
            placeholder="e.g. Alex"
            autoFocus
            maxLength={30}
          />
        </KeyboardAvoidingView>
      ) : null}

      {step === 'goal' ? (
        <View>
          <StepTitle
            title="What's your dream physique?"
            sub="This decides which muscle groups your plan emphasizes and how exercises are ordered."
          />
          {GOAL_OPTIONS.map((option) => (
            <OptionCard
              key={option.id}
              title={option.title}
              sub={option.sub}
              icon={option.icon}
              selected={goal === option.id}
              onPress={() => {
                setGoal(option.id);
                setFieldError(null);
              }}
            />
          ))}
        </View>
      ) : null}

      {step === 'experience' ? (
        <View>
          <StepTitle
            title="How long have you been lifting?"
            sub="Experience changes how fast you can progress and how much volume you need."
          />
          {EXPERIENCE_OPTIONS.map((option) => (
            <OptionCard
              key={option.id}
              title={option.title}
              sub={option.sub}
              selected={experience === option.id}
              onPress={() => {
                setExperience(option.id);
                setFieldError(null);
              }}
            />
          ))}
        </View>
      ) : null}

      {step === 'body' ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <StepTitle
            title="Your starting point"
            sub="Height and weight anchor your progress tracking — you'll see the trend from day one."
          />
          <View style={styles.rowFields}>
            <TextField
              label="Height (ft)"
              value={feet}
              onChangeText={(t) => {
                setFeet(t);
                setFieldError(null);
              }}
              keyboardType="number-pad"
              placeholder="5"
              style={styles.flexField}
            />
            <TextField
              label="Height (in)"
              value={inches}
              onChangeText={(t) => {
                setInches(t);
                setFieldError(null);
              }}
              keyboardType="number-pad"
              placeholder="10"
              style={styles.flexField}
            />
          </View>
          <TextField
            label="Current weight"
            value={weightText}
            onChangeText={(t) => {
              setWeightText(t);
              setFieldError(null);
            }}
            keyboardType="decimal-pad"
            placeholder={weightUnits === 'lb' ? '165' : '75'}
            suffix={weightUnits}
            style={{ marginTop: spacing.lg }}
          />
          <View style={styles.unitRow}>
            <Chip label="lb" selected={weightUnits === 'lb'} onPress={() => setWeightUnits('lb')} />
            <Chip label="kg" selected={weightUnits === 'kg'} onPress={() => setWeightUnits('kg')} />
          </View>
        </KeyboardAvoidingView>
      ) : null}

      {step === 'frequency' ? (
        <View>
          <StepTitle
            title="How many days a week can you train?"
            sub="Be realistic — a schedule you can actually keep beats an ambitious one you can't."
          />
          {FREQUENCY_OPTIONS.map((d) => (
            <OptionCard
              key={d}
              title={`${d} days`}
              sub={
                d === 3
                  ? 'Efficient full-body training'
                  : d === 4
                    ? 'The consistency sweet spot'
                    : d === 5
                      ? 'Serious volume, one weekend day free'
                      : 'High frequency for fast progress'
              }
              selected={frequency === d}
              onPress={() => {
                setFrequency(d);
                setFieldError(null);
              }}
            />
          ))}
        </View>
      ) : null}

      {step === 'obstacles' ? (
        <View>
          <StepTitle
            title="What usually gets in the way?"
            sub="Select all that apply. Your plan and check-ins adapt to these."
          />
          <View style={styles.chipWrap}>
            {OBSTACLE_OPTIONS.map((o) => (
              <Chip
                key={o.id}
                label={o.label}
                selected={obstacles.includes(o.id)}
                onPress={() => toggleObstacle(o.id)}
                accessibilityHint="Toggles this obstacle"
              />
            ))}
          </View>
          <Text style={[type.caption, { marginTop: spacing.lg }]}>Optional — skip if nothing applies.</Text>
        </View>
      ) : null}

      {step === 'limitations' ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <StepTitle
            title="Any injuries or limitations?"
            sub="Optional. We use this only to be cautious with exercise suggestions — SBLftr isn't medical advice, and a health professional should clear you for training."
          />
          <TextField
            label="Injuries or limitations (optional)"
            value={limitations}
            onChangeText={setLimitations}
            placeholder="e.g. right shoulder impingement"
            maxLength={140}
          />
        </KeyboardAvoidingView>
      ) : null}

      {step === 'photos' ? (
        <View>
          <StepTitle
            title="Add progress photos?"
            sub="Photos let your assessment reflect what you've actually built — not just your answers — and give you a real before picture for later."
          />
          <Card style={{ marginBottom: spacing.lg }}>
            <View style={styles.disclosureRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.info} />
              <Text style={[type.caption, styles.disclosureText]}>
                Photos are stored on your device. If you add them here, they are sent once to our AI
                analysis service to generate your assessment — nothing is uploaded without this
                explicit step, and you can skip it entirely.
              </Text>
            </View>
          </Card>
          <View style={styles.photoRow}>
            <PhotoSlot
              label="Front relaxed"
              uri={frontPhoto}
              busy={pickerBusy === 'front'}
              onPress={() => void addPhoto('front')}
              onClear={() => setFrontPhoto(null)}
            />
            <PhotoSlot
              label="Rear double bicep"
              uri={rearPhoto}
              busy={pickerBusy === 'rear'}
              onPress={() => void addPhoto('rear')}
              onClear={() => setRearPhoto(null)}
            />
          </View>
          {photoNotice ? (
            <Text style={[type.caption, styles.photoNotice]} accessibilityLiveRegion="polite">
              {photoNotice}
            </Text>
          ) : null}
          <Text style={[type.caption, { marginTop: spacing.lg }]}>
            Completely optional — your plan is just as functional without photos.
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

function StepTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={styles.stepTitleWrap}>
      <Text style={type.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={[type.body, { marginTop: spacing.sm }]}>{sub}</Text>
    </View>
  );
}

function WelcomePoint({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.welcomePoint}>
      <Ionicons name={icon} size={20} color={colors.accent} />
      <Text style={[type.body, styles.welcomePointText]}>{text}</Text>
    </View>
  );
}

interface OptionCardProps {
  title: string;
  sub: string;
  icon?: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}

function OptionCard({ title, sub, icon, selected, onPress }: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={`${title}. ${sub}`}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.optionCard,
        selected ? styles.optionSelected : null,
        pressed ? { opacity: 0.85 } : null,
      ]}
    >
      {icon ? (
        <View style={[styles.optionIcon, selected ? styles.optionIconSelected : null]}>
          <Ionicons name={icon} size={22} color={selected ? colors.accent : colors.textSecondary} />
        </View>
      ) : null}
      <View style={styles.optionTextWrap}>
        <Text style={type.subheading}>{title}</Text>
        <Text style={type.caption}>{sub}</Text>
      </View>
      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={24}
        color={selected ? colors.accent : colors.border}
      />
    </Pressable>
  );
}

interface PhotoSlotProps {
  label: string;
  uri: string | null;
  busy: boolean;
  onPress: () => void;
  onClear: () => void;
}

function PhotoSlot({ label, uri, busy, onPress, onClear }: PhotoSlotProps) {
  return (
    <View style={styles.photoSlotWrap}>
      <Pressable
        onPress={onPress}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={uri ? `Replace ${label} photo` : `Add ${label} photo`}
        style={({ pressed }) => [styles.photoSlot, pressed ? { opacity: 0.8 } : null]}
      >
        {busy ? (
          <ActivityIndicator color={colors.accent} />
        ) : uri ? (
          <Image source={{ uri }} style={styles.photoImage} accessibilityIgnoresInvertColors />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera-outline" size={26} color={colors.textTertiary} />
            <Text style={[type.caption, styles.center, { marginTop: spacing.xs }]}>Add photo</Text>
          </View>
        )}
      </Pressable>
      <Text style={[type.caption, styles.center, { marginTop: spacing.sm }]}>{label}</Text>
      {uri ? (
        <Pressable
          onPress={onClear}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label} photo`}
          style={styles.photoClear}
        >
          <Ionicons name="close-circle" size={22} color={colors.danger} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.accent },
  stepCount: { ...type.caption, fontVariant: ['tabular-nums'] },
  stepTitleWrap: { marginTop: spacing.lg, marginBottom: spacing.xl },
  center: { textAlign: 'center' },
  welcomeWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  welcomeSub: { marginTop: spacing.md, maxWidth: 300 },
  welcomePoints: { marginVertical: spacing.xxl, gap: spacing.lg, alignSelf: 'stretch' },
  welcomePoint: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  welcomePointText: { flex: 1, color: colors.text },
  rowFields: { flexDirection: 'row', gap: spacing.md },
  flexField: { flex: 1 },
  unitRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  optionSelected: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: { backgroundColor: colors.bg },
  optionTextWrap: { flex: 1, gap: 2 },
  disclosureRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  disclosureText: { flex: 1, color: colors.textSecondary },
  photoRow: { flexDirection: 'row', gap: spacing.md },
  photoSlotWrap: { flex: 1 },
  photoSlot: {
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
  photoImage: { width: '100%', height: '100%' },
  photoPlaceholder: { alignItems: 'center' },
  photoClear: { position: 'absolute', top: -8, right: -8 },
  photoNotice: { marginTop: spacing.md, color: colors.warning },
  fieldError: { ...type.caption, color: colors.danger, marginBottom: spacing.sm },
});

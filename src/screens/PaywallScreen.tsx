import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { useApp } from '../context/AppContext';
import { SPLITS } from '../data/splits';
import { PLACEHOLDER_TESTIMONIALS } from '../data/testimonials';
import { RootScreenProps } from '../navigation/types';
import { colors, radii, spacing, type } from '../theme';
import { assignSplit } from '../utils/split';

/**
 * Paywall shown AFTER the full plan reveal (onboarding) and from in-app
 * upgrade entry points. MOCK PURCHASES ONLY — no real billing is wired up;
 * `purchase()` simply flips the premium flag and says so in the UI. Real
 * StoreKit / Play Billing integration must replace it before release.
 */

type Cadence = 'yearly' | 'monthly';

const PRICING: Record<Cadence, { price: string; per: string; note: string }> = {
  yearly: { price: '$59.99', per: 'per year', note: '$5.00 / month — save 50%' },
  monthly: { price: '$9.99', per: 'per month', note: 'Cancel anytime' },
};

const PREMIUM_ROWS: { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }[] = [
  {
    icon: 'sparkles-outline',
    title: 'Personalized split',
    sub: 'A science-based week matched to your goal, experience and schedule',
  },
  {
    icon: 'analytics-outline',
    title: 'AI physique assessment',
    sub: 'Strengths and focus areas from your profile and optional photos',
  },
  {
    icon: 'images-outline',
    title: 'AI progress comparison',
    sub: 'Honest before / after analysis whenever you want a check-in',
  },
  {
    icon: 'construct-outline',
    title: 'Custom split builder',
    sub: 'Design and save your own seven-day training weeks',
  },
];

const COMPARISON: { label: string; free: boolean }[] = [
  { label: 'Workout logging & rest timer', free: true },
  { label: 'Standard training splits', free: true },
  { label: 'History, weight log & charts', free: true },
  { label: 'Daily goals & streaks', free: true },
  { label: 'Personalized split for your goal', free: false },
  { label: 'AI assessment & progress analysis', free: false },
  { label: 'Custom split builder', free: false },
];

export function PaywallScreen({ navigation, route }: RootScreenProps<'Paywall'>) {
  const { state, dispatch } = useApp();
  const [cadence, setCadence] = useState<Cadence>('yearly');
  const source = route.params.source;

  const personalized = assignSplit(true, state.frequency);
  const splitName = SPLITS[personalized.split]?.name ?? 'Personalized split';

  const finish = (premium: boolean) => {
    if (source === 'onboarding') {
      dispatch({ type: 'COMPLETE_ONBOARDING', premium });
      // The navigator swaps stacks when onboardingComplete flips.
      return;
    }
    if (premium) dispatch({ type: 'SET_PREMIUM', premium: true });
    navigation.goBack();
  };

  const purchase = () => {
    // MOCK PURCHASE — development only. See docs/DEVELOPMENT.md.
    Alert.alert(
      'Simulated purchase',
      'This development build simulates the purchase flow — no payment is processed. Premium will be enabled for testing.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Enable Premium', onPress: () => finish(true) },
      ]
    );
  };

  const restore = () => {
    Alert.alert(
      'Restore purchases',
      'This development build has no billing connected, so there is nothing to restore yet. In the released app this will restore an existing subscription.'
    );
  };

  const legal = (doc: 'Terms of Service' | 'Privacy Policy') => {
    Alert.alert(doc, `The ${doc} will be linked here before release.`);
  };

  return (
    <Screen
      footer={
        <View>
          <Button label={source === 'onboarding' ? 'Start Premium' : 'Upgrade to Premium'} onPress={purchase} />
          <Button
            label={source === 'onboarding' ? 'Continue with the free plan' : 'Not now'}
            onPress={() => finish(false)}
            variant="ghost"
            style={{ marginTop: spacing.sm }}
          />
        </View>
      }
    >
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Ionicons name="star" size={26} color={colors.premium} />
        </View>
        <Text style={[type.title, styles.center]}>
          {source === 'onboarding' ? 'Unlock your full plan' : 'SBLftr Premium'}
        </Text>
        <Text style={[type.body, styles.center, { marginTop: spacing.sm }]}>
          {source === 'onboarding'
            ? `Your assessment recommends the ${splitName}. Premium activates it — plus everything below.`
            : 'Personalized programming and AI analysis on top of everything free.'}
        </Text>
      </View>

      {PREMIUM_ROWS.map((row) => (
        <View key={row.title} style={styles.benefitRow}>
          <View style={styles.benefitIcon}>
            <Ionicons name={row.icon} size={20} color={colors.accent} />
          </View>
          <View style={styles.benefitText}>
            <Text style={type.bodyStrong}>{row.title}</Text>
            <Text style={type.caption}>{row.sub}</Text>
          </View>
        </View>
      ))}

      <Card style={{ marginTop: spacing.xl }}>
        <Text style={[type.label, { marginBottom: spacing.md }]}>Free vs Premium</Text>
        {COMPARISON.map((row) => (
          <View key={row.label} style={styles.compareRow}>
            <Text style={[type.body, styles.compareLabel]}>{row.label}</Text>
            <View style={styles.compareCell}>
              <Ionicons
                name={row.free ? 'checkmark' : 'remove'}
                size={18}
                color={row.free ? colors.success : colors.textTertiary}
                accessibilityLabel={row.free ? 'Included free' : 'Not in free'}
              />
            </View>
            <View style={styles.compareCell}>
              <Ionicons name="checkmark" size={18} color={colors.accent} accessibilityLabel="Included in Premium" />
            </View>
          </View>
        ))}
        <View style={styles.compareFooter}>
          <Text style={[type.caption, styles.compareLabel]} />
          <Text style={[type.caption, styles.compareCellText]}>Free</Text>
          <Text style={[type.caption, styles.compareCellText, { color: colors.accent }]}>Pro</Text>
        </View>
      </Card>

      <View style={styles.priceRow}>
        {(['yearly', 'monthly'] as Cadence[]).map((c) => {
          const selected = cadence === c;
          return (
            <Pressable
              key={c}
              onPress={() => setCadence(c)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${c === 'yearly' ? 'Yearly' : 'Monthly'} plan, ${PRICING[c].price} ${PRICING[c].per}. ${PRICING[c].note}`}
              style={[styles.priceCard, selected ? styles.priceCardSelected : null]}
            >
              {c === 'yearly' ? (
                <View style={styles.bestBadge}>
                  <Text style={styles.bestBadgeText}>BEST VALUE</Text>
                </View>
              ) : null}
              <Text style={type.label}>{c === 'yearly' ? 'Yearly' : 'Monthly'}</Text>
              <Text style={[type.stat, { marginVertical: spacing.xs }]}>{PRICING[c].price}</Text>
              <Text style={type.caption}>{PRICING[c].per}</Text>
              <Text style={[type.caption, { color: selected ? colors.accent : colors.textTertiary, marginTop: spacing.xs }]}>
                {PRICING[c].note}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[type.caption, styles.terms]}>
        Subscriptions renew automatically until cancelled in your store account settings. Prices
        shown are for development preview; purchases in this build are simulated and no payment is
        processed.
      </Text>

      <View style={styles.testimonialBlock}>
        {PLACEHOLDER_TESTIMONIALS.map((t) => (
          <Card key={t.quote} style={styles.testimonial}>
            <Text style={[type.body, { fontStyle: 'italic', color: colors.text }]}>“{t.quote}”</Text>
            <Text style={[type.caption, { marginTop: spacing.sm }]}>{t.attribution}</Text>
          </Card>
        ))}
      </View>

      <View style={styles.footerLinks}>
        <Pressable onPress={restore} accessibilityRole="button" accessibilityLabel="Restore purchases">
          <Text style={styles.footerLink}>Restore Purchases</Text>
        </Pressable>
        <Pressable onPress={() => legal('Terms of Service')} accessibilityRole="button" accessibilityLabel="Terms of Service">
          <Text style={styles.footerLink}>Terms</Text>
        </Pressable>
        <Pressable onPress={() => legal('Privacy Policy')} accessibilityRole="button" accessibilityLabel="Privacy Policy">
          <Text style={styles.footerLink}>Privacy</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  header: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl },
  headerBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.premiumDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: { flex: 1, gap: 2 },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  compareLabel: { flex: 1 },
  compareCell: { width: 44, alignItems: 'center' },
  compareCellText: { width: 44, textAlign: 'center', fontWeight: '700' },
  compareFooter: { flexDirection: 'row', paddingTop: spacing.sm },
  priceRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  priceCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  priceCardSelected: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  bestBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  bestBadgeText: { ...type.label, color: colors.textInverse, fontSize: 9, letterSpacing: 0.5 },
  terms: { marginTop: spacing.lg, textAlign: 'center' },
  testimonialBlock: { marginTop: spacing.xl, gap: spacing.md },
  testimonial: { padding: spacing.lg },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.xl,
  },
  footerLink: { ...type.caption, color: colors.textSecondary, textDecorationLine: 'underline', padding: spacing.sm },
});

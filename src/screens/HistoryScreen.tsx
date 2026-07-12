import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { useApp } from '../context/AppContext';
import { RootScreenProps } from '../navigation/types';
import { colors, hitSlop, radii, spacing, type } from '../theme';
import { HistoryItem } from '../types';
import { confirmDestructive } from '../utils/confirm';
import { formatDuration, formatMediumDate } from '../utils/date';
import { formatWeight } from '../utils/units';

export function HistoryScreen({ navigation }: RootScreenProps<'History'>) {
  const { state, dispatch } = useApp();

  const deleteSession = (item: HistoryItem) => {
    confirmDestructive({
      title: 'Delete session?',
      message: `${item.name} on ${formatMediumDate(item.dateISO)} will be permanently removed.`,
      confirmLabel: 'Delete',
      onConfirm: () => dispatch({ type: 'DELETE_HISTORY', id: item.id }),
    });
  };

  if (state.history.length === 0) {
    return (
      <View style={styles.root}>
        <EmptyState
          icon="barbell-outline"
          title="No workouts yet"
          message="Finish your first session and it will show up here with volume, duration and records."
        />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.content}
      data={state.history}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Card
          onPress={() => navigation.navigate('SessionDetail', { id: item.id })}
          accessibilityLabel={`${item.name} on ${formatMediumDate(item.dateISO)}`}
          accessibilityHint="Shows full session details"
          style={styles.card}
        >
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={type.subheading}>{item.name}</Text>
              <Text style={type.caption}>{formatMediumDate(item.dateISO)}</Text>
              <View style={styles.metaRow}>
                <Meta icon="layers-outline" text={`${formatWeight(item.totalVolumeLbs, state.units, false)} ${state.units}`} />
                {item.durationSec !== null ? (
                  <Meta icon="time-outline" text={formatDuration(item.durationSec)} />
                ) : null}
                {item.prs.length > 0 ? <Meta icon="trophy-outline" text={`${item.prs.length} PR`} accent /> : null}
              </View>
            </View>
            <Pressable
              onPress={() => deleteSession(item)}
              hitSlop={hitSlop}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.name} from ${formatMediumDate(item.dateISO)}`}
            >
              <Ionicons name="trash-outline" size={20} color={colors.textTertiary} />
            </Pressable>
          </View>
        </Card>
      )}
    />
  );
}

function Meta({ icon, text, accent = false }: { icon: keyof typeof Ionicons.glyphMap; text: string; accent?: boolean }) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={13} color={accent ? colors.premium : colors.textTertiary} />
      <Text style={[type.caption, accent ? { color: colors.premium } : null]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl },
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  metaRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderRadius: radii.sm },
});

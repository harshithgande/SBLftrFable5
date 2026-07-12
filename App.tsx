import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Skeleton } from './src/components/Skeleton';
import { AppProvider, useApp } from './src/context/AppContext';
import { AppNavigator } from './src/navigation';
import { colors, spacing } from './src/theme';

function Root() {
  const { hydrated } = useApp();

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <Skeleton width={120} height={28} />
        <Skeleton width={220} height={16} style={{ marginTop: spacing.md }} />
      </View>
    );
  }
  return <AppNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" />
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

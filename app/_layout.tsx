import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '../lib/theme';
import { database } from '../lib/db';
import { useSettingsStore } from '../store/settingsStore';
import { GluestackProvider } from '../lib/gluestack-provider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    // Initialize database and load settings
    const init = async () => {
      await database.init();
      await loadSettings();
    };
    
    init();
  }, [loadSettings]);

  return (
    <GluestackProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" backgroundColor={theme.colors.bg} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.bg },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="note/[id]" />
          <Stack.Screen name="settings/index" />
        </Stack>
      </QueryClientProvider>
    </GluestackProvider>
  );
}

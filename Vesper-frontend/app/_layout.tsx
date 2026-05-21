import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStore } from '../stores/authStore';

export default function RootLayout() {
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    void restoreSession();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}

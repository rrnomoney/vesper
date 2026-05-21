import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '../stores/authStore';

export default function LoginScreen() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const errorMessage = useAuthStore((state) => state.errorMessage);
  const clearError = useAuthStore((state) => state.clearError);
  const isFormValid = account.trim().length > 0 && password.length > 0;

  async function handleSubmit() {
    if (isLoading || !isFormValid) {
      if (!isFormValid) {
        setLocalError('Please fill all fields');
      }
      return;
    }

    const didLogin = await login({ account: account.trim(), password });
    if (didLogin) {
      router.replace(redirect || '/(tabs)');
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.header}>
              <Pressable style={styles.circleButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={24} color="#18181b" />
              </Pressable>
            </View>

            <View style={styles.content}>
              <Text style={styles.logo}>Vesper</Text>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to save places and keep your night archive in sync.</Text>

              <View style={styles.form}>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Username or Email"
                  placeholderTextColor="#a1a1aa"
                  value={account}
                  onChangeText={(value) => {
                    clearError();
                    setLocalError(null);
                    setAccount(value);
                  }}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#a1a1aa"
                  secureTextEntry
                  value={password}
                  onChangeText={(value) => {
                    clearError();
                    setLocalError(null);
                    setPassword(value);
                  }}
                  style={styles.input}
                />

                {localError || errorMessage ? <Text style={styles.errorText}>{localError || errorMessage}</Text> : null}

                <Pressable
                  disabled={isLoading || !isFormValid}
                  style={[styles.primaryButton, (isLoading || !isFormValid) && styles.disabledButton]}
                  onPress={handleSubmit}
                >
                  {isLoading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color="#ffffff" />
                      <Text style={styles.primaryButtonText}>Signing in...</Text>
                    </View>
                  ) : (
                    <Text style={styles.primaryButtonText}>Log in</Text>
                  )}
                </Pressable>
              </View>

              <Pressable
                style={styles.secondaryLink}
                onPress={() =>
                  router.replace({
                    pathname: '/register',
                    params: redirect ? { redirect } : undefined,
                  })
                }
              >
                <Text style={styles.secondaryText}>Create an account</Text>
              </Pressable>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fffdfc' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 28 },
  header: { paddingHorizontal: 20, paddingTop: 8 },
  circleButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 42 },
  logo: { color: '#8b5cf6', fontSize: 18, fontWeight: '900' },
  title: { marginTop: 12, color: '#111111', fontSize: 34, fontWeight: '900' },
  subtitle: { marginTop: 10, color: '#71717a', fontSize: 15, lineHeight: 22, fontWeight: '600' },
  form: { marginTop: 32, gap: 12 },
  input: {
    height: 54,
    borderRadius: 20,
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 16,
    color: '#18181b',
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: { color: '#be185d', fontSize: 13, fontWeight: '700', lineHeight: 19 },
  primaryButton: {
    marginTop: 4,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: '#8b5cf6',
  },
  disabledButton: { opacity: 0.65 },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  secondaryLink: { marginTop: 22, alignSelf: 'center', padding: 8 },
  secondaryText: { color: '#8b5cf6', fontSize: 14, fontWeight: '900' },
});

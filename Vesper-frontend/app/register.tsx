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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[a-zA-Z0-9_.]+$/;

function getUsernameError(value: string) {
  const username = value.trim();

  if (!username) {
    return null;
  }

  if (!usernamePattern.test(username)) {
    return 'Username can only contain letters, numbers, _ and .';
  }

  if (username.length < 3 || username.length > 20) {
    return 'Username must be 3-20 characters';
  }

  return null;
}

function getEmailError(value: string) {
  const email = value.trim();

  if (!email) {
    return null;
  }

  return emailPattern.test(email) ? null : 'Please enter a valid email';
}

function getPasswordError(value: string) {
  if (!value) {
    return null;
  }

  if (value.length < 8) {
    return 'Password must be at least 8 characters';
  }

  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    return 'Password must contain uppercase, lowercase and number';
  }

  return null;
}

export default function RegisterScreen() {
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const errorMessage = useAuthStore((state) => state.errorMessage);
  const clearError = useAuthStore((state) => state.clearError);
  const usernameError = getUsernameError(username);
  const emailError = getEmailError(email);
  const passwordError = getPasswordError(password);
  const isFormValid =
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    !usernameError &&
    !emailError &&
    !passwordError;

  async function handleSubmit() {
    if (isLoading || !isFormValid) {
      setLocalError(usernameError || emailError || passwordError || 'Please fill all fields');
      return;
    }

    const nextUsername = username.trim().toLowerCase();
    const nextEmail = email.trim();

    const didRegister = await register({ username: nextUsername, email: nextEmail, password });
    if (didRegister) {
      setSuccessMessage('Account created successfully');
      setTimeout(() => {
        router.replace(redirect || '/(tabs)');
      }, 650);
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
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Join Vesper to bookmark bars and keep your saved places across sessions.</Text>

              <View style={styles.form}>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Username"
                  placeholderTextColor="#a1a1aa"
                  value={username}
                  onChangeText={(value) => {
                    clearError();
                    setLocalError(null);
                    setSuccessMessage(null);
                    setUsername(value);
                  }}
                  style={styles.input}
                />
                {usernameError ? <Text style={styles.fieldErrorText}>{usernameError}</Text> : null}
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="Email"
                  placeholderTextColor="#a1a1aa"
                  value={email}
                  onChangeText={(value) => {
                    clearError();
                    setLocalError(null);
                    setSuccessMessage(null);
                    setEmail(value);
                  }}
                  style={styles.input}
                />
                {emailError ? <Text style={styles.fieldErrorText}>{emailError}</Text> : null}
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#a1a1aa"
                  secureTextEntry
                  value={password}
                  onChangeText={(value) => {
                    clearError();
                    setLocalError(null);
                    setSuccessMessage(null);
                    setPassword(value);
                  }}
                  style={styles.input}
                />
                {passwordError ? <Text style={styles.fieldErrorText}>{passwordError}</Text> : null}

                {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
                {localError || errorMessage ? <Text style={styles.errorText}>{localError || errorMessage}</Text> : null}

                <Pressable
                  disabled={isLoading || !isFormValid}
                  style={[styles.primaryButton, (isLoading || !isFormValid) && styles.disabledButton]}
                  onPress={handleSubmit}
                >
                  {isLoading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color="#ffffff" />
                      <Text style={styles.primaryButtonText}>Creating account...</Text>
                    </View>
                  ) : (
                    <Text style={styles.primaryButtonText}>Create account</Text>
                  )}
                </Pressable>
              </View>

              <Pressable
                style={styles.secondaryLink}
                onPress={() =>
                  router.replace({
                    pathname: '/login',
                    params: redirect ? { redirect } : undefined,
                  })
                }
              >
                <Text style={styles.secondaryText}>I already have an account</Text>
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
  fieldErrorText: { marginTop: -6, color: '#be185d', fontSize: 12, fontWeight: '700', lineHeight: 17 },
  errorText: { color: '#be185d', fontSize: 13, fontWeight: '700', lineHeight: 19 },
  successText: { color: '#16a34a', fontSize: 13, fontWeight: '800', lineHeight: 19 },
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

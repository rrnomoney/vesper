import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'vesper-auth-token';

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export async function restoreAuthToken() {
  authToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  return authToken;
}

export function getAuthToken() {
  return authToken;
}

export async function setAuthToken(token: string) {
  authToken = token;
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken() {
  authToken = null;
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

export function handleUnauthorized() {
  unauthorizedHandler?.();
}

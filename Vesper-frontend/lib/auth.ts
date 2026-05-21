import { apiGet, apiPost } from './api';

export type UserVO = {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AuthVO = {
  token: string;
  user: UserVO;
};

export type LoginPayload = {
  account: string;
  password: string;
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

export function login(payload: LoginPayload) {
  return apiPost<AuthVO>('/auth/login', payload);
}

export function register(payload: RegisterPayload) {
  return apiPost<AuthVO>('/auth/register', payload);
}

export function getMe() {
  return apiGet<UserVO>('/auth/me', undefined, { auth: true });
}

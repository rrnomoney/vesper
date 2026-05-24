import { router } from 'expo-router';

export function isNumericId(id: string | number) {
  return /^\d+$/.test(String(id));
}

export function pushBarDetail(id: string | number) {
  if (!isNumericId(id)) {
    return false;
  }

  router.push(`/bar/${id}`);
  return true;
}

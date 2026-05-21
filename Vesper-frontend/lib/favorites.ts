import { apiDelete, apiGet, apiPost } from './api';
import { mapBarVOToBar, type BarVO } from './bars';

export async function getFavorites() {
  const bars = await apiGet<BarVO[]>('/favorites', undefined, { auth: true });
  return bars.map(mapBarVOToBar);
}

export async function addFavorite(barId: string | number) {
  await apiPost<void>(`/favorites/${barId}`, undefined, { auth: true });
}

export async function removeFavorite(barId: string | number) {
  await apiDelete<void>(`/favorites/${barId}`, { auth: true });
}

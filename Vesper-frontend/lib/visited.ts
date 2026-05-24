import { apiDelete, apiGet, apiPost } from './api';
import { mapBarVOToBar, type BarVO } from './bars';

export async function getVisited() {
  const bars = await apiGet<BarVO[] | null>('/visited', undefined, { auth: true });
  return (Array.isArray(bars) ? bars : []).map(mapBarVOToBar);
}

export async function addVisited(barId: string | number) {
  await apiPost<void>(`/visited/${barId}`, undefined, { auth: true });
}

export async function removeVisited(barId: string | number) {
  await apiDelete<void>(`/visited/${barId}`, { auth: true });
}

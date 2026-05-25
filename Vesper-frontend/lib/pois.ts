import { apiGet } from './api';
import type { Bar } from '../data/bars';

export type PoiVO = {
  id: string;
  name: string;
  address: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  category: string | null;
  distance: number | null;
  coverImage: string | null;
  rating: number | string | null;
};

export type NearbyBarsParams = {
  lat: number;
  lng: number;
};

const fallbackCoverImage =
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=85';

function toNumber(value: number | string | null, fallback = 0) {
  if (value === null) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatDistance(distance: number | null) {
  if (distance === null || !Number.isFinite(distance)) {
    return 'Nearby';
  }

  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)} km`;
  }

  return `${Math.round(distance)} m`;
}

export type PoiBar = Bar & {
  source: 'amap';
  poiId: string;
};

export function mapPoiToBar(poi: PoiVO): PoiBar {
  return {
    id: `amap:${poi.id}`,
    poiId: poi.id,
    source: 'amap',
    name: poi.name,
    type: poi.category || 'Bar',
    neighborhood: poi.address || 'Nearby',
    distance: formatDistance(poi.distance),
    rating: toNumber(poi.rating),
    reviews: 0,
    price: 'Details pending',
    latitude: toNumber(poi.latitude),
    longitude: toNumber(poi.longitude),
    isSaved: false,
    image: poi.coverImage || fallbackCoverImage,
    tags: poi.category ? [poi.category] : [],
    about: poi.address ? `Located at ${poi.address}.` : 'Details coming soon.',
    reviewHighlights: [],
  };
}

export async function getNearbyBars(params: NearbyBarsParams) {
  const pois = await apiGet<PoiVO[] | null>('/pois/nearby-bars', params);
  return (Array.isArray(pois) ? pois : []).map(mapPoiToBar);
}

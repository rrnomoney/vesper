import { apiGet, apiPost } from './api';
import { cleanCategoryLabel, getMapDiscoveredAbout } from './barDisplay';
import { mapBarVOToBar, type BarVO } from './bars';
import type { Bar } from '../data/bars';

export type PoiVO = {
  id: string;
  localBarId: number | string | null;
  name: string;
  address: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  category: string | null;
  distance: number | null;
  coverImage: string | null;
  rating: number | string | null;
  averageRating: number | string | null;
  reviewCount: number | null;
};

export type NearbyBarsParams = {
  lat: number;
  lng: number;
};

export type ImportPoiPayload = {
  externalId: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  category: string | null;
  coverImage: string | null;
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
  localBarId: string | null;
};

export function mapPoiToBar(poi: PoiVO): PoiBar {
  const localBarId = poi.localBarId === null || poi.localBarId === undefined ? null : String(poi.localBarId);
  const reviewCount = Number(poi.reviewCount);

  return {
    id: localBarId || `amap:${poi.id}`,
    poiId: poi.id,
    localBarId,
    source: 'amap',
    name: poi.name,
    type: cleanCategoryLabel(poi.category),
    neighborhood: poi.address || 'Nearby',
    distance: formatDistance(poi.distance),
    rating: toNumber(poi.averageRating ?? poi.rating),
    reviews: Number.isFinite(reviewCount) ? reviewCount : 0,
    price: 'Price pending',
    latitude: toNumber(poi.latitude),
    longitude: toNumber(poi.longitude),
    isSaved: false,
    image: poi.coverImage || fallbackCoverImage,
    tags: [cleanCategoryLabel(poi.category)],
    about: getMapDiscoveredAbout(poi.address),
    reviewHighlights: [],
  };
}

export async function getNearbyBars(params: NearbyBarsParams) {
  const pois = await apiGet<PoiVO[] | null>('/pois/nearby-bars', params);
  return (Array.isArray(pois) ? pois : []).map(mapPoiToBar);
}

export async function importPoi(payload: ImportPoiPayload) {
  const bar = await apiPost<BarVO>('/pois/import', payload);
  return mapBarVOToBar(bar);
}

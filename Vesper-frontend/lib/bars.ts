import { apiGet } from './api';
import { getMapDiscoveredAbout } from './barDisplay';
import type { Bar } from '../data/bars';

export type BarVO = {
  id: number;
  externalId: string | null;
  name: string;
  city: string | null;
  address: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  category: string | null;
  rating: number | string | null;
  averageRating: number | string | null;
  reviewCount: number | null;
  priceLevel: number | null;
  coverImage: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type GetBarsParams = {
  keyword?: string;
  city?: string;
};

const fallbackCoverImage =
  'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=900&q=85';

function formatPrice(priceLevel: number | null, externalId: string | null) {
  if (externalId || !priceLevel || priceLevel < 1) {
    return 'Price pending';
  }

  return `${'$'.repeat(Math.min(priceLevel, 4))} / person`;
}

function toNumber(value: number | string | null, fallback = 0) {
  if (value === null) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function mapBarVOToBar(bar: BarVO): Bar {
  const reviewCount = Number(bar.reviewCount);
  const rating = bar.averageRating ?? bar.rating;

  return {
    id: String(bar.id),
    name: bar.name,
    type: bar.category || 'Bar',
    neighborhood: bar.address || bar.city || 'Demo data',
    distance: bar.city || 'Available bars',
    rating: toNumber(rating),
    reviews: Number.isFinite(reviewCount) ? reviewCount : 0,
    price: formatPrice(bar.priceLevel, bar.externalId),
    latitude: toNumber(bar.latitude),
    longitude: toNumber(bar.longitude),
    isSaved: false,
    image: bar.coverImage || fallbackCoverImage,
    tags: bar.category ? [bar.category] : [],
    about: bar.externalId ? getMapDiscoveredAbout(bar.address) : bar.address ? `Located at ${bar.address}.` : 'Details coming soon.',
    reviewHighlights: [],
  };
}

export async function getBars(params?: GetBarsParams) {
  const bars = await apiGet<BarVO[] | null>('/bars', params);
  return (Array.isArray(bars) ? bars : []).map(mapBarVOToBar);
}

export async function getBarById(id: string | number) {
  const bar = await apiGet<BarVO | null>(`/bars/${id}`);
  return bar ? mapBarVOToBar(bar) : null;
}

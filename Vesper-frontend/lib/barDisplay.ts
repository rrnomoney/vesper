import type { Bar } from '../data/bars';

export function cleanCategoryLabel(value: string | null | undefined) {
  const text = (value || '').toLowerCase();

  if (text.includes('清吧')) {
    return '清吧';
  }

  if (text.includes('livehouse')) {
    return 'Livehouse';
  }

  if (text.includes('精酿')) {
    return '精酿';
  }

  if (text.includes('威士忌') || text.includes('whisky') || text.includes('whiskey')) {
    return 'Whisky';
  }

  if (text.includes('酒吧') || text.includes('cocktail') || text.includes('pub')) {
    return '酒吧';
  }

  return 'Night spot';
}

export function getBarTags(bar: Bar) {
  const rawTags = [bar.type, ...(Array.isArray(bar.tags) ? bar.tags : [])].filter(Boolean);
  const labels = rawTags.map(cleanCategoryLabel);
  return Array.from(new Set(labels.length > 0 ? labels : ['Night spot']));
}

export function getPrimaryBarTag(bar: Bar) {
  return getBarTags(bar)[0] || 'Night spot';
}

export function getRatingSummary(bar: Pick<Bar, 'rating' | 'reviews'>, emptyText = 'No reviews yet') {
  const rating = Number(bar.rating);
  const reviewCount = Number(bar.reviews);

  if (!Number.isFinite(rating) || rating <= 0 || !Number.isFinite(reviewCount) || reviewCount <= 0) {
    return { hasReviews: false, text: emptyText };
  }

  return { hasReviews: true, text: `★ ${rating.toFixed(1)} (${reviewCount})` };
}

export function hasReliablePrice(bar: Pick<Bar, 'price'>) {
  return Boolean(bar.price && bar.price !== 'Price pending' && bar.price !== 'Details pending');
}

export function hasCjkText(value: string) {
  return /[\u3400-\u9fff]/.test(value);
}

export function getMapDiscoveredAbout(address: string | null | undefined) {
  if (address && hasCjkText(address)) {
    return '这是从地图发现的附近酒吧。写下你的体验，帮助其他人了解这里的氛围。';
  }

  return 'A nearby bar discovered from the map. Leave a review to help others understand the vibe.';
}

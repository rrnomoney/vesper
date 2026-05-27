import type { Bar } from '../data/bars';

export const defaultBarImage =
  'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=900&q=85';

export function getPrimaryBarImage(input: { amapPhotoUrls?: string[] | null; coverImage?: string | null; image?: string | null }) {
  const officialPhoto = Array.isArray(input.amapPhotoUrls) ? input.amapPhotoUrls.find(Boolean) : null;
  return officialPhoto || input.coverImage || input.image || defaultBarImage;
}

export function cleanCategoryLabel(value: string | null | undefined) {
  const text = (value || '').toLowerCase();

  if (text.includes('\u6e05\u5427') || text.includes('lounge') || text.includes('quiet')) {
    return '\u6e05\u5427';
  }

  if (text.includes('livehouse')) {
    return 'Livehouse';
  }

  if (text.includes('\u7cbe\u917f') || text.includes('craft') || text.includes('beer')) {
    return '\u7cbe\u917f';
  }

  if (text.includes('\u5a01\u58eb\u5fcc') || text.includes('whisky') || text.includes('whiskey')) {
    return 'Whisky';
  }

  if (text.includes('\u9152\u5427') || text.includes('bar') || text.includes('cocktail') || text.includes('pub') || text.includes('speakeasy')) {
    return '\u9152\u5427';
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

  return { hasReviews: true, text: `${rating.toFixed(1)} (${reviewCount})` };
}

export function getStarRatingDisplay(bar: Pick<Bar, 'rating' | 'reviews'>, emptyText = 'New place') {
  const rating = Number(bar.rating);
  const reviewCount = Number(bar.reviews);

  if (!Number.isFinite(rating) || rating <= 0 || !Number.isFinite(reviewCount) || reviewCount <= 0) {
    return {
      hasReviews: false,
      filledStars: 0,
      text: emptyText,
    };
  }

  return {
    hasReviews: true,
    filledStars: Math.max(1, Math.min(5, Math.round(rating))),
    text: `${rating.toFixed(1)} (${reviewCount})`,
  };
}

export function hasReliablePrice(bar: Pick<Bar, 'price'>) {
  return Boolean(bar.price && bar.price !== 'Price pending' && bar.price !== 'Details pending');
}

export function hasCjkText(value: string) {
  return /[\u3400-\u9fff]/.test(value);
}

export function getMapDiscoveredAbout(address: string | null | undefined) {
  return 'A nightlife venue discovered from local map data. Community reviews help shape the experience.';
}

function isThinAboutText(value: string | null | undefined) {
  const text = (value || '').trim().toLowerCase();

  return (
    !text ||
    text === 'details coming soon.' ||
    text === 'a newly added vesper spot. more details are coming soon.' ||
    text === 'a nearby bar discovered from the map. leave a review to help others understand the vibe.' ||
    text === 'a nightlife venue discovered from local map data. community reviews help shape the experience.' ||
    text.startsWith('located at ')
  );
}

export function getDetailMetadata(bar: Bar, hasReviews: boolean) {
  const tags = getBarTags(bar).slice(0, 3);
  const vibeLine = tags.join(' - ');
  const sourceLine = bar.isImported ? 'Map found' : hasReviews ? 'Community rated' : 'New place';
  const priceLine = hasReliablePrice(bar) ? bar.price : 'Price pending';

  return { tags, vibeLine, sourceLine, priceLine };
}

export function getDetailAboutText(bar: Bar, reviewCount = 0) {
  const existingAbout = (bar.about || '').trim();

  if (!isThinAboutText(existingAbout)) {
    return existingAbout;
  }

  if (bar.isImported) {
    return 'A nightlife venue discovered from local map data. Community reviews help shape the experience.';
  }

  return 'A local nightlife spot curated by the Vesper community.';
}

import type { Bar } from '../data/bars';

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

  return { hasReviews: true, text: `\u2605 ${rating.toFixed(1)} (${reviewCount})` };
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
  if (address && hasCjkText(address)) {
    return '\u8fd9\u662f\u4ece\u5730\u56fe\u53d1\u73b0\u7684\u9644\u8fd1\u9152\u5427\u3002\u5199\u4e0b\u4f60\u7684\u4f53\u9a8c\uff0c\u5e2e\u52a9\u5176\u4ed6\u4eba\u4e86\u89e3\u8fd9\u91cc\u7684\u6c1b\u56f4\u3002';
  }

  return 'A nearby bar discovered from the map. Leave a review to help others understand the vibe.';
}

function isThinAboutText(value: string | null | undefined) {
  const text = (value || '').trim().toLowerCase();

  return (
    !text ||
    text === 'details coming soon.' ||
    text === 'a newly added vesper spot. more details are coming soon.' ||
    text === 'a nearby bar discovered from the map. leave a review to help others understand the vibe.' ||
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

  const tag = getPrimaryBarTag(bar).toLowerCase();
  const hasReviews = reviewCount > 0;
  const isCjk = hasCjkText([bar.name, bar.type, bar.neighborhood, ...bar.tags].join(' '));

  if (isCjk) {
    if (hasReviews) {
      return `一个附近的${tag}地点，已经有人留下了体验记录。你可以通过评论和照片继续补充这里的氛围。`;
    }

    return `一个附近的${tag}地点。你可以通过评论和照片补充这里的氛围，让后来的人更容易判断是否适合今晚。`;
  }

  if (hasReviews) {
    return `A nearby ${tag} shaped by early community notes. Add your own review or photos to make the vibe clearer for the next night out.`;
  }

  return `A nearby ${tag} spot with details still coming into focus. Reviews and photos from visits will help future guests understand the mood.`;
}

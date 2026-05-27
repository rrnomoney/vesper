import type { Bar } from '../data/bars';

export const ALL_BAR_CATEGORY = 'All';
const GENERAL_BAR_CATEGORY = '\u9152\u5427';
const CLEAR_BAR_CATEGORY = '\u6e05\u5427';
const CRAFT_BEER_CATEGORY = '\u7cbe\u917f';
const WHISKY_CATEGORY = 'Whisky';
const LIVEHOUSE_CATEGORY = 'Livehouse';

function normalizeSearchValue(value: string | number | null | undefined) {
  return String(value ?? '').trim().toLowerCase();
}

function addNormalizedCategory(categories: Set<string>, value: string | number | null | undefined) {
  const text = normalizeSearchValue(value);

  if (!text) {
    return;
  }

  if (text.includes('\u6e05\u5427') || text.includes('lounge') || text.includes('quiet')) {
    categories.add(GENERAL_BAR_CATEGORY);
    categories.add(CLEAR_BAR_CATEGORY);
  }

  if (text.includes('livehouse') || text.includes('live house')) {
    categories.add(LIVEHOUSE_CATEGORY);
  }

  if (text.includes('\u7cbe\u917f') || text.includes('craft') || text.includes('beer')) {
    categories.add(GENERAL_BAR_CATEGORY);
    categories.add(CRAFT_BEER_CATEGORY);
  }

  if (text.includes('\u5a01\u58eb\u5fcc') || text.includes('whisky') || text.includes('whiskey')) {
    categories.add(GENERAL_BAR_CATEGORY);
    categories.add(WHISKY_CATEGORY);
  }

  if (
    text.includes('\u9152\u5427') ||
    text.includes('\u9152\u6c34') ||
    text.includes(' bar') ||
    text.endsWith('bar') ||
    text.includes('cocktail') ||
    text.includes('pub') ||
    text.includes('speakeasy')
  ) {
    categories.add(GENERAL_BAR_CATEGORY);
  }
}

export function getNormalizedBarCategories(bar: Bar) {
  const categories = new Set<string>();
  const values = [bar.name, bar.type, bar.neighborhood, ...(Array.isArray(bar.tags) ? bar.tags : [])];

  values.forEach((value) => addNormalizedCategory(categories, value));
  return Array.from(categories);
}

export function matchesBarSearch(bar: Bar, query: string) {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return true;
  }

  const searchableValues = [
    bar.name,
    bar.type,
    bar.neighborhood,
    bar.distance,
    ...(Array.isArray(bar.tags) ? bar.tags : []),
    ...getNormalizedBarCategories(bar),
  ];

  return searchableValues.some((value) => normalizeSearchValue(value).includes(normalizedQuery));
}

export function matchesBarCategory(bar: Bar, category: string) {
  if (!category || category === ALL_BAR_CATEGORY) {
    return true;
  }

  const normalizedCategory = normalizeSearchValue(category);
  return getNormalizedBarCategories(bar).some((tag) => normalizeSearchValue(tag) === normalizedCategory);
}

export function filterBars<T extends Bar>(bars: T[], query: string, category: string) {
  return bars.filter((bar) => matchesBarSearch(bar, query) && matchesBarCategory(bar, category));
}

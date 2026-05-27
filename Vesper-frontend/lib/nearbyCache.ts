import * as Location from 'expo-location';
import { create } from 'zustand';

import type { Bar } from '../data/bars';
import { getBars } from './bars';
import { getNearbyBars, type PoiBar } from './pois';

export type NearbyBar = Bar | PoiBar;

export type NearbyRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type NearbyLocation = {
  latitude: number;
  longitude: number;
};

type NearbyState = {
  bars: NearbyBar[];
  region: NearbyRegion | null;
  lastLocation: NearbyLocation | null;
  lastFetchedAt: number;
  loading: boolean;
  error: string | null;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const nearbyErrorMessage = 'Unable to load nearby bars';

let refreshPromise: Promise<NearbyBar[]> | null = null;

export const useNearbyStore = create<NearbyState>()(() => ({
  bars: [],
  region: null,
  lastLocation: null,
  lastFetchedAt: 0,
  loading: false,
  error: null,
}));

function hasFreshNearbyState(state: NearbyState) {
  return state.bars.length > 0 && Date.now() - state.lastFetchedAt < CACHE_TTL_MS;
}

export function getNearbyCache() {
  const state = useNearbyStore.getState();
  return {
    bars: state.bars,
    region: state.region,
    fetchedAt: state.lastFetchedAt,
  };
}

export function hasFreshNearbyCache() {
  return hasFreshNearbyState(useNearbyStore.getState());
}

export function setNearbyCache(bars: NearbyBar[], region: NearbyRegion | null) {
  useNearbyStore.setState({
    bars,
    region,
    lastLocation: region ? { latitude: region.latitude, longitude: region.longitude } : null,
    lastFetchedAt: Date.now(),
    loading: false,
    error: null,
  });
}

function mergeLocalEnrichment(nearbyBars: NearbyBar[], localBars: Bar[]) {
  const localBarsById = new Map(localBars.map((bar) => [String(bar.id), bar]));

  return nearbyBars.map((bar) => {
    const localBarId = 'localBarId' in bar ? bar.localBarId : bar.id;
    const localBar = localBarId === null || localBarId === undefined ? null : localBarsById.get(String(localBarId));

    if (!localBar) {
      return bar;
    }

    return {
      ...bar,
      id: String(localBar.id),
      localBarId: String(localBar.id),
      image: localBar.image || bar.image,
      phone: localBar.phone,
      businessHours: localBar.businessHours,
      formattedAddress: localBar.formattedAddress,
      website: localBar.website,
      amapPhotoUrls: localBar.amapPhotoUrls,
    };
  });
}

async function hydrateNearbyBars(nearbyBars: NearbyBar[]) {
  if (!nearbyBars.some((bar) => 'localBarId' in bar && bar.localBarId)) {
    return nearbyBars;
  }

  try {
    const localBars = await getBars();
    return mergeLocalEnrichment(nearbyBars, localBars);
  } catch {
    return nearbyBars;
  }
}

export async function refreshNearby(options?: { force?: boolean; background?: boolean }) {
  const currentState = useNearbyStore.getState();

  if (!options?.force && hasFreshNearbyState(currentState)) {
    return currentState.bars;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  const hadCache = currentState.bars.length > 0;
  useNearbyStore.setState({
    loading: !options?.background || !hadCache,
    error: null,
  });

  refreshPromise = (async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        throw new Error(nearbyErrorMessage);
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const nextLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      const nextBars = await hydrateNearbyBars(await getNearbyBars({
        lat: nextLocation.latitude,
        lng: nextLocation.longitude,
      }));
      const nextRegion = {
        ...nextLocation,
        latitudeDelta: 0.035,
        longitudeDelta: 0.035,
      };

      useNearbyStore.setState({
        bars: nextBars,
        region: nextRegion,
        lastLocation: nextLocation,
        lastFetchedAt: Date.now(),
        loading: false,
        error: null,
      });

      return nextBars;
    } catch (error) {
      const latestState = useNearbyStore.getState();
      useNearbyStore.setState({
        loading: false,
        error: latestState.bars.length > 0 ? null : nearbyErrorMessage,
      });

      if (latestState.bars.length > 0) {
        return latestState.bars;
      }

      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export function updateNearbyReviewSummary(barId: string | number, rating: number) {
  const targetId = String(barId);
  let changed = false;

  const state = useNearbyStore.getState();
  const bars = state.bars.map((bar) => {
    if (String(bar.id) !== targetId) {
      return bar;
    }

    const nextReviewCount = Math.max(0, Number(bar.reviews) || 0) + 1;
    const currentRating = Number(bar.rating) || 0;
    const nextRating = ((currentRating * (nextReviewCount - 1)) + rating) / nextReviewCount;
    changed = true;

    return {
      ...bar,
      rating: Number(nextRating.toFixed(1)),
      reviews: nextReviewCount,
    };
  });

  if (changed) {
    useNearbyStore.setState({
      bars,
    });
  }
}

export function updateNearbyImportedBar(importedBar: Bar) {
  let changed = false;
  const importedId = String(importedBar.id);

  const state = useNearbyStore.getState();
  const bars = state.bars.map((bar) => {
    const localBarId = 'localBarId' in bar ? bar.localBarId : bar.id;
    const matchesLocalId = localBarId !== null && localBarId !== undefined && String(localBarId) === importedId;

    if (!matchesLocalId) {
      return bar;
    }

    changed = true;
    return {
      ...bar,
      id: importedId,
      localBarId: importedId,
      image: importedBar.image || bar.image,
      phone: importedBar.phone,
      businessHours: importedBar.businessHours,
      formattedAddress: importedBar.formattedAddress,
      website: importedBar.website,
      amapPhotoUrls: importedBar.amapPhotoUrls,
    };
  });

  if (changed) {
    useNearbyStore.setState({ bars });
  }
}

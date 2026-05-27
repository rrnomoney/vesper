import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { homeCategories, type Bar } from '../data/bars';
import { getPrimaryBarTag, getRatingSummary, hasReliablePrice } from '../lib/barDisplay';
import { filterBars } from '../lib/barFilters';
import { pushBarDetail } from '../lib/navigation';
import { refreshNearby, useNearbyStore, type NearbyBar } from '../lib/nearbyCache';
import { importPoi } from '../lib/pois';
import { useAuthStore } from '../stores/authStore';
import { useSavedStore } from '../stores/savedStore';
import { useVisitedStore } from '../stores/visitedStore';

type MapCoordinate = {
  latitude: number;
  longitude: number;
};
type ValidMapBar = Bar & MapCoordinate;
type MapBar = NearbyBar;
type MarkerState = 'visited' | 'saved' | 'normal';

// TODO: For domestic production, define one GCJ-02/WGS84 strategy for Expo location,
// AMap POI coordinates, and react-native-maps rendering to avoid visible marker drift.
const shanghaiRegion: Region = {
  latitude: 31.2304,
  longitude: 121.4737,
  latitudeDelta: 0.055,
  longitudeDelta: 0.055,
};

function VesperMarker({ state }: { state: MarkerState }) {
  const isVisited = state === 'visited';
  const isSaved = state === 'saved';
  const iconName = isVisited ? 'checkmark' : state === 'saved' ? 'bookmark' : 'wine';

  return (
    <View style={[styles.poiMarker, isSaved && styles.poiMarkerSaved, isVisited && styles.poiMarkerVisited]}>
      <Ionicons name={iconName} size={13} color="#ffffff" />
    </View>
  );
}

function getLocalBarId(bar: MapBar) {
  const localBarId = 'localBarId' in bar ? bar.localBarId : bar.id;
  const numericId = Number(localBarId);
  return Number.isFinite(numericId) ? numericId : null;
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const markerPressRef = useRef(false);
  const authUserId = useAuthStore((state) => state.user?.id ?? null);
  const isAuthInitializing = useAuthStore((state) => state.isInitializing);
  const visitedBars = useVisitedStore((state) => state.visitedBars);
  const loadVisited = useVisitedStore((state) => state.loadVisited);
  const clearVisitedBars = useVisitedStore((state) => state.clearVisitedBars);
  const savedBars = useSavedStore((state) => state.savedBars);
  const loadFavorites = useSavedStore((state) => state.loadFavorites);
  const clearSavedBars = useSavedStore((state) => state.clearSavedBars);
  const bars = useNearbyStore((state) => state.bars);
  const nearbyRegion = useNearbyStore((state) => state.region);
  const lastLocation = useNearbyStore((state) => state.lastLocation);
  const isLoading = useNearbyStore((state) => state.loading);
  const nearbyError = useNearbyStore((state) => state.error);
  const [selectedBar, setSelectedBar] = useState<MapBar | null>(null);
  const [userCoordinate, setUserCoordinate] = useState<MapCoordinate | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [importingPoiId, setImportingPoiId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState(homeCategories[0]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filteredBars = useMemo(() => filterBars(bars, searchText, activeCategory), [activeCategory, bars, searchText]);
  const hasActiveFilter = searchText.trim().length > 0 || activeCategory !== homeCategories[0];

  const validBars = useMemo<ValidMapBar[]>(
    () =>
      filteredBars
        .map((bar) => ({
          ...bar,
          latitude: Number(bar.latitude),
          longitude: Number(bar.longitude),
        }))
        .filter((bar) => Number.isFinite(bar.latitude) && Number.isFinite(bar.longitude)),
    [filteredBars],
  );

  useEffect(() => {
    if (selectedBar && !filteredBars.some((bar) => bar.id === selectedBar.id)) {
      setSelectedBar(null);
    }
  }, [filteredBars, selectedBar]);

  useEffect(() => {
    if (nearbyRegion) {
      setMapRegion(nearbyRegion);
    } else if (nearbyError && bars.length === 0) {
      setMapRegion(shanghaiRegion);
    }

    if (lastLocation) {
      setUserCoordinate(lastLocation);
    }

    setStatusMessage(nearbyError && bars.length === 0 ? nearbyError : '');
  }, [bars.length, lastLocation, nearbyError, nearbyRegion]);

  useEffect(() => {
    void refreshNearby({ background: bars.length > 0 });
  }, []);

  const openBarDetails = async (bar: MapBar) => {
    if (!bar.id.startsWith('amap:')) {
      pushBarDetail(bar.id);
      return;
    }

    if (importingPoiId === bar.id) {
      return;
    }

    setImportingPoiId(bar.id);
    setStatusMessage('');

    try {
      const importedBar = await importPoi({
        externalId: bar.id.replace(/^amap:/, ''),
        name: bar.name,
        address: bar.neighborhood,
        latitude: bar.latitude,
        longitude: bar.longitude,
        category: bar.type,
        coverImage: bar.image,
      });
      pushBarDetail(importedBar.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to open details.';
      setStatusMessage(message);
    } finally {
      setImportingPoiId(null);
    }
  };

  const findLocalMatch = (bar: MapBar, localBars: Bar[]) => {
    if (!authUserId) {
      return false;
    }

    const localBarId = getLocalBarId(bar);
    if (localBarId === null) {
      return false;
    }

    return localBars.some((localBar) => Number(localBar.id) === localBarId);
  };

  const isVisitedBar = (bar: MapBar) => findLocalMatch(bar, visitedBars);
  const isSavedBar = (bar: MapBar) => findLocalMatch(bar, savedBars);
  const getMarkerState = (bar: MapBar): MarkerState => {
    if (isVisitedBar(bar)) {
      return 'visited';
    }

    if (isSavedBar(bar)) {
      return 'saved';
    }

    return 'normal';
  };

  const closeFilterSheet = () => {
    setIsFilterOpen(false);
    Keyboard.dismiss();
  };

  const closePreview = () => {
    setSelectedBar(null);
    Keyboard.dismiss();
  };

  const markMarkerPress = () => {
    markerPressRef.current = true;
    requestAnimationFrame(() => {
      markerPressRef.current = false;
    });
  };

  const handleMapBlankPress = () => {
    if (markerPressRef.current) {
      return;
    }

    if (isFilterOpen) {
      closeFilterSheet();
      return;
    }

    closePreview();
  };

  const moveToUserLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== Location.PermissionStatus.GRANTED) {
      setStatusMessage('Location permission is needed to return to your position.');
      return;
    }

    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const nextCoordinate = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    setUserCoordinate(nextCoordinate);
    setMapRegion({
      ...nextCoordinate,
      latitudeDelta: 0.025,
      longitudeDelta: 0.025,
    });
    setStatusMessage('');
    mapRef.current?.animateToRegion(
      {
        ...nextCoordinate,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      },
      650,
    );
  };

  useEffect(() => {
    if (isAuthInitializing) {
      return;
    }

    if (!authUserId) {
      clearSavedBars();
      clearVisitedBars();
      return;
    }

    clearSavedBars();
    clearVisitedBars();
    void loadVisited();
    void loadFavorites();
  }, [authUserId, clearSavedBars, clearVisitedBars, isAuthInitializing, loadFavorites, loadVisited]);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthInitializing) {
        if (authUserId) {
          void loadVisited();
          void loadFavorites();
        } else {
          clearSavedBars();
          clearVisitedBars();
        }
      }

      return undefined;
    }, [authUserId, clearSavedBars, clearVisitedBars, isAuthInitializing, loadFavorites, loadVisited]),
  );

  return (
    <View style={styles.screen}>
      {mapRegion ? (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={mapRegion}
          moveOnMarkerPress={false}
          onPress={handleMapBlankPress}
          pitchEnabled={false}
          rotateEnabled={false}
          showsCompass={false}
        >
        {validBars.map((bar) => {
          const markerState = getMarkerState(bar);

          return (
            <Marker
              key={String(bar.id)}
              coordinate={{ latitude: bar.latitude, longitude: bar.longitude }}
              tracksViewChanges
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={(event) => {
                markMarkerPress();
                event.stopPropagation?.();

                if (selectedBar?.id === bar.id) {
                  return;
                }

                setSelectedBar(bar);
              }}
            >
              <VesperMarker state={markerState} />
            </Marker>
          );
        })}

        {userCoordinate ? (
          <Marker coordinate={userCoordinate} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <View style={styles.userMarker}>
              <Ionicons name="person" size={14} color="#ffffff" />
            </View>
          </Marker>
        ) : null}
        </MapView>
      ) : (
        <View style={styles.mapLoadingState}>
          <ActivityIndicator color="#8b5cf6" />
          <Text style={styles.mapLoadingTitle}>Finding your location</Text>
          <Text style={styles.mapLoadingText}>Nearby bars will appear once location is ready.</Text>
        </View>
      )}

      {isFilterOpen ? <Pressable style={styles.dismissOverlay} onPress={handleMapBlankPress} /> : null}

      <SafeAreaView pointerEvents="box-none" style={styles.overlay} edges={['top']}>
        <View style={styles.topControls}>
          <View style={styles.statusPill}>
            <Text style={styles.statusTitle}>Nearby bars</Text>
            <Text style={styles.statusSubtitle}>{isLoading ? 'Loading' : `${validBars.length}/${bars.length} found`}</Text>
          </View>

          <View style={styles.rightActions}>
            <Pressable
              style={[styles.iconButton, isFilterOpen && styles.iconButtonActive]}
              onPress={() => setIsFilterOpen((current) => !current)}
            >
              <Ionicons name="funnel-outline" size={18} color={hasActiveFilter || isFilterOpen ? '#7c3aed' : '#111827'} />
              {hasActiveFilter ? <View style={styles.filterDot} /> : null}
            </Pressable>

            <Pressable style={styles.iconButton} onPress={moveToUserLocation}>
              <Ionicons name="locate" size={18} color="#111827" />
            </Pressable>
          </View>
        </View>

        {isFilterOpen ? (
          <View style={styles.filterSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filter places</Text>
              <Pressable style={styles.sheetCloseButton} onPress={() => setIsFilterOpen(false)}>
                <Ionicons name="close" size={17} color="#52525b" />
              </Pressable>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color="#a1a1aa" />
              <TextInput
                placeholder="Search bars or POIs"
                placeholderTextColor="#a1a1aa"
                value={searchText}
                onChangeText={setSearchText}
                style={styles.searchInput}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContent}>
              {homeCategories.map((category) => (
                <Pressable
                  key={category}
                  style={[styles.chip, category === activeCategory && styles.chipActive]}
                  onPress={() => setActiveCategory(category)}
                >
                  <Text style={[styles.chipText, category === activeCategory && styles.chipTextActive]}>{category}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.sheetMeta}>{validBars.length}/{bars.length} places visible</Text>
          </View>
        ) : null}

        {statusMessage ? (
          <View style={styles.messageBadge}>
            <Text style={styles.messageText}>{statusMessage}</Text>
          </View>
        ) : null}
      </SafeAreaView>

      {selectedBar ? (
        <Pressable style={styles.previewCard} onPress={() => void openBarDetails(selectedBar)}>
          <View style={styles.previewImageWrap}>
            <Image source={{ uri: selectedBar.image }} style={styles.previewImage} />
          </View>

          <View style={styles.previewContent}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewName} numberOfLines={1}>
                {selectedBar.name}
              </Text>
              {isVisitedBar(selectedBar) ? (
                <View style={styles.visitedBadge}>
                  <Ionicons name="checkmark" size={10} color="#ffffff" />
                </View>
              ) : null}
            </View>

            <Text style={styles.previewCategory} numberOfLines={1}>
              {getPrimaryBarTag(selectedBar)}
            </Text>
            <Text style={styles.previewAddress} numberOfLines={1}>
              {selectedBar.neighborhood}
            </Text>

            <View style={styles.previewMetaRow}>
              <Text style={[styles.rating, !getRatingSummary(selectedBar).hasReviews && styles.emptyRating]}>
                {getRatingSummary(selectedBar, 'No reviews yet').text}
              </Text>
              {hasReliablePrice(selectedBar) ? <Text style={styles.price}>{selectedBar.price}</Text> : null}
            </View>

            <Pressable
              disabled={importingPoiId === selectedBar.id}
              style={[styles.detailsButton, importingPoiId === selectedBar.id && styles.detailsButtonDisabled]}
              onPress={(event) => {
                event.stopPropagation();
                void openBarDetails(selectedBar);
              }}
            >
              <Text style={styles.detailsButtonText}>{importingPoiId === selectedBar.id ? 'Opening...' : 'View details'}</Text>
              <Ionicons name="chevron-forward" size={14} color="#ffffff" />
            </Pressable>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const floatingShadow = {
  shadowColor: '#111827',
  shadowOpacity: 0.12,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 14 },
  elevation: 8,
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#eef0ed' },
  mapLoadingState: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 28,
  },
  mapLoadingTitle: { marginTop: 12, color: '#111827', fontSize: 18, fontWeight: '900' },
  mapLoadingText: { marginTop: 6, color: '#71717a', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 3,
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  statusPill: {
    ...floatingShadow,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    backgroundColor: 'rgba(255,255,255,0.86)',
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  statusTitle: { color: '#111827', fontSize: 13, fontWeight: '900' },
  statusSubtitle: { marginTop: 1, color: '#71717a', fontSize: 10, fontWeight: '800' },
  rightActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: {
    ...floatingShadow,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  iconButtonActive: { borderColor: '#ddd6fe', backgroundColor: 'rgba(245,243,255,0.94)' },
  filterDot: {
    position: 'absolute',
    right: 9,
    top: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#7c3aed',
  },
  filterSheet: {
    ...floatingShadow,
    alignSelf: 'stretch',
    marginTop: 12,
    marginHorizontal: 18,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    backgroundColor: 'rgba(255,255,255,0.94)',
    padding: 12,
  },
  sheetHeader: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: { color: '#111827', fontSize: 15, fontWeight: '900' },
  sheetCloseButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#f4f4f5',
  },
  searchBox: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 21,
    backgroundColor: 'rgba(244,244,245,0.94)',
    paddingHorizontal: 13,
  },
  searchInput: { marginLeft: 8, flex: 1, color: '#18181b', fontSize: 14, fontWeight: '700' },
  chipContent: { flexDirection: 'row', gap: 8, paddingTop: 10, paddingRight: 6 },
  chip: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f4f4f5',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { borderColor: '#ddd6fe', backgroundColor: '#ede9fe' },
  chipText: { color: '#52525b', fontSize: 12, fontWeight: '800' },
  chipTextActive: { color: '#7c3aed' },
  sheetMeta: { marginTop: 10, color: '#71717a', fontSize: 11, fontWeight: '800' },
  userMarker: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    borderWidth: 3,
    borderColor: '#ffffff',
    backgroundColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
  poiMarker: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
  poiMarkerSaved: {
    backgroundColor: '#6d5df6',
    shadowColor: '#6d5df6',
  },
  poiMarkerVisited: {
    backgroundColor: '#16a34a',
    shadowColor: '#16a34a',
  },
  messageBadge: {
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...floatingShadow,
  },
  messageText: { color: '#52525b', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  previewCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 64,
    zIndex: 2,
    minHeight: 156,
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
    backgroundColor: 'rgba(255,255,255,0.94)',
    padding: 12,
    ...floatingShadow,
  },
  previewImageWrap: {
    width: 132,
    height: 132,
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#e4e4e7',
  },
  previewImage: { width: '100%', height: '100%' },
  previewContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingLeft: 13,
    paddingVertical: 2,
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewName: { flex: 1, color: '#111827', fontSize: 18, fontWeight: '900' },
  previewCategory: { marginTop: 4, color: '#52525b', fontSize: 13, fontWeight: '800' },
  previewAddress: { marginTop: 3, color: '#71717a', fontSize: 12, fontWeight: '700' },
  visitedBadge: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#7c3aed',
  },
  previewMetaRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  rating: { color: '#f59e0b', fontSize: 13, fontWeight: '900' },
  emptyRating: { color: '#7c3aed' },
  price: { flex: 1, color: '#27272a', fontSize: 12, fontWeight: '800' },
  detailsButton: {
    marginTop: 8,
    height: 38,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 19,
    backgroundColor: '#111827',
    paddingHorizontal: 14,
  },
  detailsButtonDisabled: { opacity: 0.68 },
  detailsButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
});

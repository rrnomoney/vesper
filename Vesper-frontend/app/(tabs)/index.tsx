import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { homeCategories } from '../../data/bars';
import { getBarTags, getPrimaryBarTag, getRatingSummary, hasReliablePrice } from '../../lib/barDisplay';
import { getAuthToken } from '../../lib/authSession';
import { pushBarDetail } from '../../lib/navigation';
import { refreshNearby, useNearbyStore, type NearbyBar } from '../../lib/nearbyCache';
import { importPoi } from '../../lib/pois';
import { useAuthStore } from '../../stores/authStore';
import { useSavedStore } from '../../stores/savedStore';
import { useVisitedStore } from '../../stores/visitedStore';

type HomeBar = NearbyBar;

function getLocalBarId(bar: HomeBar) {
  const localBarId = 'localBarId' in bar ? bar.localBarId : bar.id;
  const numericId = Number(localBarId);
  return Number.isFinite(numericId) ? String(numericId) : null;
}

export default function HomeScreen() {
  const [bars, setBars] = useState<HomeBar[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState(homeCategories[0]);
  const [openingBarId, setOpeningBarId] = useState<string | null>(null);
  const authUserId = useAuthStore((state) => state.user?.id ?? null);
  const isAuthInitializing = useAuthStore((state) => state.isInitializing);
  const visitedBarIds = useVisitedStore((state) => state.visitedBarIds);
  const loadVisited = useVisitedStore((state) => state.loadVisited);
  const clearVisitedBars = useVisitedStore((state) => state.clearVisitedBars);
  const savedBarIds = useSavedStore((state) => state.savedBarIds);
  const savedErrorMessage = useSavedStore((state) => state.errorMessage);
  const syncingBarIds = useSavedStore((state) => state.syncingBarIds);
  const loadFavorites = useSavedStore((state) => state.loadFavorites);
  const clearSavedBars = useSavedStore((state) => state.clearSavedBars);
  const toggleSavedBar = useSavedStore((state) => state.toggleSavedBar);
  const nearbyBars = useNearbyStore((state) => state.bars);
  const isNearbyLoading = useNearbyStore((state) => state.loading);
  const nearbyError = useNearbyStore((state) => state.error);
  const nearbyLastFetchedAt = useNearbyStore((state) => state.lastFetchedAt);

  async function loadNearbyBars(options?: { showLoading?: boolean; refreshing?: boolean }) {
    const refreshing = options?.refreshing ?? false;

    if (refreshing) {
      setIsRefreshing(true);
    }
    setErrorMessage(null);

    try {
      await refreshNearby({ force: refreshing, background: !options?.showLoading });
    } catch (error) {
      setErrorMessage('Unable to load nearby bars');
    } finally {
      setIsRefreshing(false);
    }
  }

  async function refreshHomeBars() {
    await Promise.all([loadFavorites(), loadVisited(), loadNearbyBars({ refreshing: true })]);
  }

  const isInitialNearbyLoading = bars.length === 0 && !nearbyError && (isNearbyLoading || nearbyLastFetchedAt === 0);
  const isRefreshingNearby = isNearbyLoading && bars.length > 0;

  useEffect(() => {
    setBars(nearbyBars);
    setErrorMessage(nearbyBars.length > 0 ? null : nearbyError);
  }, [nearbyBars, nearbyError]);

  async function openBarDetails(bar: HomeBar) {
    if (!bar.id.startsWith('amap:')) {
      pushBarDetail(bar.id);
      return;
    }

    if (openingBarId === bar.id) {
      return;
    }

    setOpeningBarId(bar.id);
    setErrorMessage(null);

    try {
      const importedBar = await importPoi({
        externalId: 'poiId' in bar ? bar.poiId : bar.id.replace(/^amap:/, ''),
        name: bar.name,
        address: bar.neighborhood,
        latitude: bar.latitude,
        longitude: bar.longitude,
        category: bar.type,
        coverImage: bar.image,
      });
      pushBarDetail(importedBar.id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to open bar details.');
    } finally {
      setOpeningBarId(null);
    }
  }

  function handleBookmarkPress(barId: string) {
    if (barId.startsWith('amap:')) {
      Alert.alert('Open details first', 'Open this place once so Vesper can save it as a local bar.');
      return;
    }

    if (!getAuthToken()) {
      router.push({
        pathname: '/login',
        params: { redirect: '/(tabs)' },
      });
      return;
    }

    void toggleSavedBar(barId);
  }

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
    void loadFavorites();
    void loadVisited();
  }, [authUserId, clearSavedBars, clearVisitedBars, isAuthInitializing, loadFavorites, loadVisited]);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthInitializing) {
        if (authUserId) {
          void loadFavorites();
          void loadVisited();
        } else {
          clearSavedBars();
          clearVisitedBars();
        }
      }

      void loadNearbyBars({ showLoading: nearbyLastFetchedAt === 0 });

      return undefined;
    }, [
      activeCategory,
      authUserId,
      clearSavedBars,
      clearVisitedBars,
      isAuthInitializing,
      loadFavorites,
      loadVisited,
      searchText,
      nearbyLastFetchedAt,
    ]),
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} tintColor="#8b5cf6" onRefresh={() => void refreshHomeBars()} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>Vesper</Text>
            <Pressable
              style={styles.cityRow}
              onPress={() => Alert.alert('Coming soon', 'City selection will be available later.')}
            >
              <Ionicons name="location" size={14} color="#8b5cf6" />
              <Text style={styles.city}>Nearby</Text>
              <Ionicons name="chevron-down" size={14} color="#a1a1aa" />
            </Pressable>
          </View>
          <Pressable
            style={styles.notificationButton}
            onPress={() => Alert.alert('Coming soon', 'Notifications will be available later.')}
          >
            <Ionicons name="notifications-outline" size={20} color="#27272a" />
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#a1a1aa" />
          <TextInput
            placeholder="Search bars, vibes, or areas"
            placeholderTextColor="#a1a1aa"
            value={searchText}
            onChangeText={(value) => {
              setSearchText(value);
              setActiveCategory('Nearby');
            }}
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroller}
          contentContainerStyle={styles.chipContent}
        >
          {homeCategories.map((category) => (
            <Pressable
              key={category}
              style={[styles.chip, category === activeCategory && styles.chipActive]}
              onPress={() => {
                setActiveCategory(category);
                setSearchText('');
              }}
            >
              <Text style={[styles.chipText, category === activeCategory && styles.chipTextActive]}>{category}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Nearby Bars</Text>
          </View>
          <Text style={styles.seeAll}>See all</Text>
        </View>

        <View style={styles.list}>
          {savedErrorMessage ? (
            <View style={styles.inlineError}>
              <Ionicons name="warning-outline" size={16} color="#8b5cf6" />
              <Text style={styles.inlineErrorText}>{savedErrorMessage}</Text>
            </View>
          ) : null}
          {isRefreshingNearby ? (
            <View style={styles.inlineError}>
              <ActivityIndicator color="#8b5cf6" size="small" />
              <Text style={styles.inlineErrorText}>Refreshing nearby bars</Text>
            </View>
          ) : null}

          {isInitialNearbyLoading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color="#8b5cf6" />
              <Text style={styles.stateTitle}>Loading bars</Text>
              <Text style={styles.stateText}>Finding nearby bars around you.</Text>
            </View>
          ) : errorMessage && bars.length === 0 ? (
            <View style={styles.stateCard}>
              <Ionicons name="warning-outline" size={22} color="#8b5cf6" />
              <Text style={styles.stateTitle}>Could not load bars</Text>
              <Text style={styles.stateText}>{errorMessage}</Text>
              <Pressable style={styles.retryButton} onPress={() => void loadNearbyBars()}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : bars.length === 0 ? (
            <View style={styles.stateCard}>
              <Ionicons name="wine-outline" size={22} color="#8b5cf6" />
              <Text style={styles.stateTitle}>No bars yet</Text>
              <Text style={styles.stateText}>New places will appear here once they are available.</Text>
            </View>
          ) : (
            bars.map((bar) => {
            const localBarId = getLocalBarId(bar);
            const isVisited = !!localBarId && visitedBarIds.some((id) => Number(id) === Number(localBarId));
            const isSaved = !!localBarId && savedBarIds.some((id) => Number(id) === Number(localBarId));
            const isSyncing = !!localBarId && syncingBarIds.some((id) => Number(id) === Number(localBarId));
            const ratingSummary = getRatingSummary(bar, 'New');
            const tags = getBarTags(bar);
            const primaryTag = getPrimaryBarTag(bar);
            const shouldShowPrice = hasReliablePrice(bar);

            return (
              <Pressable key={bar.id} style={styles.card} onPress={() => void openBarDetails(bar)}>
                <View style={styles.imageWrap}>
                  <Image source={{ uri: bar.image }} style={styles.image} />
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceText}>{bar.distance}</Text>
                  </View>
                  {isVisited ? (
                    <View style={styles.visitedBadge}>
                      <Ionicons name="sparkles" size={12} color="#ffffff" />
                      <Text style={styles.visitedText}>Visited</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardTitleWrap}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{bar.name}</Text>
                      <Text style={styles.cardMeta} numberOfLines={2}>
                        {bar.neighborhood}
                      </Text>
                    </View>
                    <Pressable
                      hitSlop={8}
                      disabled={isSyncing || !localBarId}
                      style={[styles.saveButton, isSyncing && styles.saveButtonDisabled]}
                      onPress={(event) => {
                        event.stopPropagation();
                        if (localBarId) {
                          handleBookmarkPress(localBarId);
                        }
                      }}
                    >
                      <Ionicons
                        name={isSaved ? 'bookmark' : 'bookmark-outline'}
                        size={18}
                        color={isSaved ? '#8b5cf6' : '#a1a1aa'}
                      />
                    </Pressable>
                  </View>

                  <View style={styles.tagRow}>
                    {tags.slice(0, 2).map((tag) => (
                      <View key={tag} style={styles.tagPill}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.cardBottomRow}>
                    <Text style={[styles.rating, !ratingSummary.hasReviews && styles.emptyRating]}>{ratingSummary.text}</Text>
                    {shouldShowPrice ? <Text style={styles.price}>{bar.price}</Text> : <Text style={styles.priceMuted}>{primaryTag}</Text>}
                  </View>
                  {openingBarId === bar.id ? (
                    <View style={styles.openingRow}>
                      <ActivityIndicator color="#8b5cf6" size="small" />
                      <Text style={styles.openingText}>Opening details</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fffdfc' },
  content: { paddingTop: 12, paddingHorizontal: 20, paddingBottom: 168 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { color: '#111111', fontSize: 34, fontWeight: '800' },
  cityRow: { marginTop: 7, flexDirection: 'row', alignItems: 'center' },
  city: { marginLeft: 5, color: '#71717a', fontSize: 14, fontWeight: '600' },
  notificationButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.88)',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  searchBox: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  searchInput: { marginLeft: 10, flex: 1, color: '#18181b', fontSize: 15 },
  chipScroller: { marginTop: 20, marginHorizontal: -20 },
  chipContent: { flexDirection: 'row', gap: 10, paddingLeft: 20, paddingRight: 36 },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.86)',
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  chipActive: { borderColor: '#ddd6fe', backgroundColor: '#ede9fe' },
  chipText: { color: '#52525b', fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: '#7c3aed' },
  sectionHeader: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { color: '#111111', fontSize: 23, fontWeight: '800' },
  seeAll: { color: '#8b5cf6', fontSize: 14, fontWeight: '700' },
  list: { marginTop: 16 },
  card: {
    marginBottom: 16,
    overflow: 'hidden',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#ffffff',
    backgroundColor: '#ffffff',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.11,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  imageWrap: { height: 132, backgroundColor: '#f4f4f5' },
  image: { width: '100%', height: '100%' },
  distanceBadge: {
    position: 'absolute',
    left: 12,
    top: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(24,24,27,0.58)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  distanceText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  visitedBadge: {
    position: 'absolute',
    right: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  visitedText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  cardBody: { padding: 16 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardTitleWrap: { flex: 1, paddingRight: 12 },
  cardTitle: { color: '#111111', fontSize: 19, fontWeight: '800' },
  cardMeta: { marginTop: 5, color: '#71717a', fontSize: 13 },
  saveButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#fafafa',
  },
  saveButtonDisabled: { opacity: 0.55 },
  tagRow: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagPill: { borderRadius: 999, backgroundColor: '#f5f3ff', paddingHorizontal: 10, paddingVertical: 6 },
  tagText: { color: '#7c3aed', fontSize: 12, fontWeight: '800' },
  cardBottomRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rating: { color: '#f59e0b', fontSize: 14, fontWeight: '800' },
  emptyRating: { color: '#7c3aed' },
  price: { color: '#27272a', fontSize: 14, fontWeight: '800' },
  priceMuted: { color: '#71717a', fontSize: 13, fontWeight: '800' },
  openingRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  openingText: { color: '#7c3aed', fontSize: 12, fontWeight: '800' },
  stateCard: {
    alignItems: 'center',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#ffffff',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 28,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  stateTitle: { marginTop: 10, color: '#111111', fontSize: 17, fontWeight: '800' },
  stateText: { marginTop: 6, color: '#71717a', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  retryButton: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  inlineError: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 18,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inlineErrorText: { flex: 1, color: '#6d28d9', fontSize: 12, fontWeight: '700' },
});

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Bar } from '../../data/bars';
import { homeCategories } from '../../data/bars';
import { getBars } from '../../lib/bars';
import { getAuthToken } from '../../lib/authSession';
import { useSavedStore } from '../../stores/savedStore';
import { useVisitedStore } from '../../stores/visitedStore';

export default function HomeScreen() {
  const [bars, setBars] = useState<Bar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState(homeCategories[0]);
  const visitedBarIds = useVisitedStore((state) => state.visitedBarIds);
  const loadVisited = useVisitedStore((state) => state.loadVisited);
  const savedBarIds = useSavedStore((state) => state.savedBarIds);
  const savedErrorMessage = useSavedStore((state) => state.errorMessage);
  const syncingBarIds = useSavedStore((state) => state.syncingBarIds);
  const loadFavorites = useSavedStore((state) => state.loadFavorites);
  const toggleSavedBar = useSavedStore((state) => state.toggleSavedBar);

  function getCurrentBarsParams() {
    const keyword = searchText.trim();

    if (keyword) {
      return { keyword };
    }

    if (activeCategory !== 'Nearby') {
      return { keyword: activeCategory };
    }

    return undefined;
  }

  async function loadBars(params = getCurrentBarsParams()) {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextBars = await getBars(params);
      setBars(nextBars);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load bars.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleBookmarkPress(barId: string) {
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
    void loadFavorites();
    void loadVisited();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadBars();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchText, activeCategory]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>Vesper</Text>
            <Pressable
              style={styles.cityRow}
              onPress={() => Alert.alert('Coming soon', 'City selection will be available later.')}
            >
              <Ionicons name="location" size={14} color="#8b5cf6" />
              <Text style={styles.city}>Singapore</Text>
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
            <Text style={styles.sectionTitle}>Popular Near You</Text>
            <Text style={styles.sectionSubtitle}>Handpicked spots for tonight.</Text>
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

          {isLoading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color="#8b5cf6" />
              <Text style={styles.stateTitle}>Loading bars</Text>
              <Text style={styles.stateText}>Finding tonight's nearby spots.</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.stateCard}>
              <Ionicons name="warning-outline" size={22} color="#8b5cf6" />
              <Text style={styles.stateTitle}>Could not load bars</Text>
              <Text style={styles.stateText}>{errorMessage}</Text>
              <Pressable style={styles.retryButton} onPress={() => void loadBars()}>
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
            const isVisited = visitedBarIds.includes(bar.id);
            const isSaved = savedBarIds.includes(bar.id);
            const isSyncing = syncingBarIds.includes(bar.id);

            return (
              <Pressable key={bar.id} style={styles.card} onPress={() => router.push(`/bar/${bar.id}`)}>
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
                      <Text style={styles.cardTitle}>{bar.name}</Text>
                      <Text style={styles.cardMeta}>
                        {bar.type} - {bar.neighborhood}
                      </Text>
                    </View>
                    <Pressable
                      hitSlop={8}
                      disabled={isSyncing}
                      style={[styles.saveButton, isSyncing && styles.saveButtonDisabled]}
                      onPress={(event) => {
                        event.stopPropagation();
                        handleBookmarkPress(bar.id);
                      }}
                    >
                      <Ionicons
                        name={isSaved ? 'bookmark' : 'bookmark-outline'}
                        size={18}
                        color={isSaved ? '#8b5cf6' : '#a1a1aa'}
                      />
                    </Pressable>
                  </View>

                  <View style={styles.cardBottomRow}>
                    <Text style={styles.rating}>★ {bar.rating} ({bar.reviews})</Text>
                    <Text style={styles.price}>{bar.price}</Text>
                  </View>
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
  sectionSubtitle: { marginTop: 4, color: '#71717a', fontSize: 13 },
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
  cardBottomRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rating: { color: '#f59e0b', fontSize: 14, fontWeight: '800' },
  price: { color: '#27272a', fontSize: 14, fontWeight: '800' },
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

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Bar } from '../../data/bars';
import { getBarById } from '../../lib/bars';
import { getAuthToken } from '../../lib/authSession';
import { useSavedStore } from '../../stores/savedStore';
import { useVisitedStore } from '../../stores/visitedStore';

export default function BarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [bar, setBar] = useState<Bar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const visitedBarIds = useVisitedStore((state) => state.visitedBarIds);
  const visitedErrorMessage = useVisitedStore((state) => state.errorMessage);
  const visitedSyncingBarIds = useVisitedStore((state) => state.syncingBarIds);
  const loadVisited = useVisitedStore((state) => state.loadVisited);
  const addVisitedBar = useVisitedStore((state) => state.addVisitedBar);
  const removeVisitedBar = useVisitedStore((state) => state.removeVisitedBar);
  const savedBarIds = useSavedStore((state) => state.savedBarIds);
  const savedErrorMessage = useSavedStore((state) => state.errorMessage);
  const syncingBarIds = useSavedStore((state) => state.syncingBarIds);
  const loadFavorites = useSavedStore((state) => state.loadFavorites);
  const toggleSavedBar = useSavedStore((state) => state.toggleSavedBar);
  const isVisited = bar ? visitedBarIds.includes(bar.id) : false;
  const isSaved = bar ? savedBarIds.includes(bar.id) : false;
  const isSaving = bar ? syncingBarIds.includes(bar.id) : false;
  const isVisitedSyncing = bar ? visitedSyncingBarIds.includes(bar.id) : false;

  async function loadBar() {
    if (!id) {
      setBar(null);
      setIsNotFound(true);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setIsNotFound(false);

    try {
      const nextBar = await getBarById(id);
      setBar(nextBar);
      setIsNotFound(!nextBar);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load bar.';
      setBar(null);
      setIsNotFound(message.toLowerCase().includes('not found') || message.includes('404'));
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadBar();
    void loadFavorites();
    void loadVisited();
  }, [id]);

  const handleCheckInPress = () => {
    if (!bar) {
      return;
    }

    if (!getAuthToken()) {
      router.replace({
        pathname: '/login',
        params: { redirect: `/bar/${bar.id}` },
      });
      return;
    }

    if (isVisited) {
      Alert.alert('Remove from visited?', 'This will remove this bar from your visited places.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => void removeVisitedBar(bar.id) },
      ]);
      return;
    }

    Alert.alert('Light up this place?', 'This will mark the bar as visited and add it to your profile.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Light up', onPress: () => void addVisitedBar(bar.id) },
    ]);
  };

  function handleBookmarkPress() {
    if (!bar) {
      return;
    }

    if (!getAuthToken()) {
      router.replace({
        pathname: '/login',
        params: { redirect: `/bar/${bar.id}` },
      });
      return;
    }

    void toggleSavedBar(bar.id);
  }

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top']} style={styles.stateTopBar}>
          <Pressable style={styles.circleButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#18181b" />
          </Pressable>
        </SafeAreaView>
        <View style={styles.centerState}>
          <ActivityIndicator color="#8b5cf6" />
          <Text style={styles.stateTitle}>Loading bar</Text>
          <Text style={styles.stateText}>Opening the details for this place.</Text>
        </View>
      </View>
    );
  }

  if (errorMessage && !isNotFound) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top']} style={styles.stateTopBar}>
          <Pressable style={styles.circleButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#18181b" />
          </Pressable>
        </SafeAreaView>
        <View style={styles.centerState}>
          <Ionicons name="warning-outline" size={28} color="#8b5cf6" />
          <Text style={styles.stateTitle}>Could not load bar</Text>
          <Text style={styles.stateText}>{errorMessage}</Text>
          <Pressable style={styles.retryButton} onPress={loadBar}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!bar || isNotFound) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top']} style={styles.stateTopBar}>
          <Pressable style={styles.circleButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#18181b" />
          </Pressable>
        </SafeAreaView>
        <View style={styles.centerState}>
          <Ionicons name="wine-outline" size={28} color="#8b5cf6" />
          <Text style={styles.stateTitle}>Bar not found</Text>
          <Text style={styles.stateText}>This place may have been removed or is not available yet.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Image source={{ uri: bar.image }} style={styles.heroImage} />
          <SafeAreaView edges={['top']} style={styles.heroControls}>
            <Pressable style={styles.circleButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#18181b" />
            </Pressable>
            <Pressable
              disabled={isSaving}
              style={[styles.circleButton, isSaving && styles.circleButtonDisabled]}
              onPress={handleBookmarkPress}
            >
              <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={21} color="#8b5cf6" />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{bar.name}</Text>
            {isVisited ? (
              <View style={styles.visitedPill}>
                <Ionicons name="sparkles" size={13} color="#ffffff" />
                <Text style={styles.visitedText}>Visited / Lit</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.meta}>
            {bar.type} - {bar.neighborhood} - {bar.distance}
          </Text>

          {savedErrorMessage ? (
            <View style={styles.inlineError}>
              <Ionicons name="warning-outline" size={16} color="#8b5cf6" />
              <Text style={styles.inlineErrorText}>{savedErrorMessage}</Text>
            </View>
          ) : null}

          {visitedErrorMessage ? (
            <View style={styles.inlineError}>
              <Ionicons name="warning-outline" size={16} color="#8b5cf6" />
              <Text style={styles.inlineErrorText}>{visitedErrorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.statRow}>
            <View style={styles.statPill}>
              <Text style={styles.rating}>★ {bar.rating} ({bar.reviews})</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.price}>{bar.price}</Text>
            </View>
          </View>

          <View style={styles.tagRow}>
            {bar.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {isVisited ? (
            <View style={styles.successCard}>
              <Text style={styles.successText}>Place lit!</Text>
              <Text style={styles.successSubtext}>This bar is now part of your night archive.</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.about}>{bar.about}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {bar.reviewHighlights.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{review.author}</Text>
                  <Text style={styles.reviewRating}>★ {review.rating}</Text>
                </View>
                <Text style={styles.reviewText}>{review.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <Pressable
          disabled={isVisitedSyncing}
          style={[styles.checkInButton, isVisited && styles.checkInButtonDone, isVisitedSyncing && styles.checkInButtonDisabled]}
          onPress={handleCheckInPress}
        >
          <Ionicons name={isVisited ? 'checkmark-circle' : 'sparkles-outline'} size={19} color="#ffffff" />
          <Text style={styles.checkInText}>{isVisited ? 'Visited' : 'Light up this place'}</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fffdfc' },
  content: { paddingBottom: 132 },
  stateTopBar: { paddingHorizontal: 18 },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  stateTitle: { marginTop: 12, color: '#111111', fontSize: 19, fontWeight: '900' },
  stateText: { marginTop: 7, color: '#71717a', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  retryButton: {
    marginTop: 18,
    borderRadius: 999,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  hero: { height: 310, backgroundColor: '#f4f4f5' },
  heroImage: { width: '100%', height: '100%' },
  heroControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  circleButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.88)',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  circleButtonDisabled: { opacity: 0.55 },
  body: {
    marginTop: -26,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: '#fffdfc',
    paddingHorizontal: 20,
    paddingTop: 26,
  },
  titleRow: { gap: 12 },
  title: { color: '#111111', fontSize: 32, fontWeight: '900' },
  visitedPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  visitedText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  meta: { marginTop: 8, color: '#71717a', fontSize: 14, fontWeight: '600' },
  inlineError: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 18,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inlineErrorText: { flex: 1, color: '#6d28d9', fontSize: 12, fontWeight: '700' },
  statRow: { marginTop: 18, flexDirection: 'row', gap: 10 },
  statPill: {
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  rating: { color: '#f59e0b', fontSize: 14, fontWeight: '900' },
  price: { color: '#27272a', fontSize: 14, fontWeight: '800' },
  tagRow: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { borderRadius: 999, backgroundColor: '#f5f3ff', paddingHorizontal: 13, paddingVertical: 8 },
  tagText: { color: '#7c3aed', fontSize: 13, fontWeight: '800' },
  successCard: {
    marginTop: 22,
    borderRadius: 24,
    backgroundColor: '#f5f3ff',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  successText: { color: '#7c3aed', fontSize: 18, fontWeight: '900' },
  successSubtext: { marginTop: 5, color: '#6b7280', fontSize: 14, lineHeight: 20 },
  section: { marginTop: 28 },
  sectionTitle: { color: '#111111', fontSize: 21, fontWeight: '900' },
  about: { marginTop: 10, color: '#52525b', fontSize: 15, lineHeight: 23 },
  reviewCard: {
    marginTop: 12,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    padding: 16,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewAuthor: { color: '#18181b', fontSize: 15, fontWeight: '900' },
  reviewRating: { color: '#f59e0b', fontSize: 13, fontWeight: '900' },
  reviewText: { marginTop: 8, color: '#52525b', fontSize: 14, lineHeight: 21 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,253,252,0.96)',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  checkInButton: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 28,
    backgroundColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.24,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  checkInButtonDone: { backgroundColor: '#ec4899' },
  checkInButtonDisabled: { opacity: 0.65 },
  checkInText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
});

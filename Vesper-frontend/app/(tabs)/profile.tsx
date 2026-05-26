import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Bar } from '../../data/bars';
import { getPrimaryBarTag, getRatingSummary } from '../../lib/barDisplay';
import { pushBarDetail } from '../../lib/navigation';
import { resolveAssetUrl } from '../../lib/upload';
import { useAuthStore } from '../../stores/authStore';
import { usePostStore } from '../../stores/postStore';
import { useReviewStore } from '../../stores/reviewStore';
import { useSavedStore } from '../../stores/savedStore';
import { useVisitedStore } from '../../stores/visitedStore';

type ProfileSection = 'visited' | 'saved' | 'reviews';

function BarListItem({
  bar,
  action,
}: {
  bar: Bar;
  action: React.ReactNode;
}) {
  const ratingSummary = getRatingSummary(bar, 'New');

  return (
    <Pressable style={styles.savedCard} onPress={() => pushBarDetail(bar.id)}>
      <Image source={{ uri: bar.image }} style={styles.savedImage} />
      <View style={styles.savedBody}>
        <Text style={styles.savedName}>{bar.name}</Text>
        <Text style={styles.savedMeta}>
          {getPrimaryBarTag(bar)} - {bar.neighborhood}
        </Text>
        <Text style={[styles.savedRating, !ratingSummary.hasReviews && styles.savedRatingEmpty]}>{ratingSummary.text}</Text>
      </View>
      {action}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const [selectedSection, setSelectedSection] = useState<ProfileSection>('visited');
  const user = useAuthStore((state) => state.user);
  const isAuthInitializing = useAuthStore((state) => state.isInitializing);
  const logout = useAuthStore((state) => state.logout);
  const clearPosts = usePostStore((state) => state.clearPosts);
  const visitedBars = useVisitedStore((state) => state.visitedBars);
  const isVisitedLoading = useVisitedStore((state) => state.isLoading);
  const visitedErrorMessage = useVisitedStore((state) => state.errorMessage);
  const loadVisited = useVisitedStore((state) => state.loadVisited);
  const savedBars = useSavedStore((state) => state.savedBars);
  const isSavedLoading = useSavedStore((state) => state.isLoading);
  const savedErrorMessage = useSavedStore((state) => state.errorMessage);
  const loadFavorites = useSavedStore((state) => state.loadFavorites);
  const removeSavedBar = useSavedStore((state) => state.removeSavedBar);
  const savedSyncingBarIds = useSavedStore((state) => state.syncingBarIds);
  const myReviews = useReviewStore((state) => state.myReviews);
  const isReviewsLoading = useReviewStore((state) => state.isLoading);
  const reviewsErrorMessage = useReviewStore((state) => state.errorMessage);
  const refreshMyReviews = useReviewStore((state) => state.refreshMyReviews);
  const clearMyReviews = useReviewStore((state) => state.clearMyReviews);

  useEffect(() => {
    if (!user && !isAuthInitializing) {
      clearMyReviews();
    }
  }, [clearMyReviews, isAuthInitializing, user]);

  useFocusEffect(
    useCallback(() => {
      if (!user || isAuthInitializing) {
        return undefined;
      }

      void loadFavorites();
      void loadVisited();
      void refreshMyReviews({ showLoading: myReviews.length === 0 });

      return undefined;
    }, [isAuthInitializing, loadFavorites, loadVisited, myReviews.length, refreshMyReviews, user]),
  );

  const confirmClearDemoData = () => {
    Alert.alert('Clear local demo data?', 'This will reset local reviews. Backend favorites and visited places will stay saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearPosts();
        },
      },
    ]);
  };

  const activeSectionTitle =
    selectedSection === 'visited' ? 'Visited Places' : selectedSection === 'saved' ? 'Saved Places' : 'My Reviews';
  const activeSectionCount =
    selectedSection === 'visited' ? visitedBars.length : selectedSection === 'saved' ? savedBars.length : myReviews.length;
  const activeSectionHint = `${activeSectionCount} ${
    selectedSection === 'visited' ? 'visited' : selectedSection === 'saved' ? 'saved' : 'reviews'
  }`;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isAuthInitializing ? (
          <View style={styles.authCard}>
            <ActivityIndicator color="#8b5cf6" />
            <Text style={styles.emptyTitle}>Restoring session</Text>
            <Text style={styles.emptyText}>Checking your saved login.</Text>
          </View>
        ) : user ? (
          <>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.username.slice(0, 1).toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{user.username}</Text>
            <Text style={styles.handle}>{user.email}</Text>
            {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
          </>
        ) : (
          <View style={styles.authCard}>
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={34} color="#8b5cf6" />
            </View>
            <Text style={styles.name}>Sign in to Vesper</Text>
            <Text style={styles.emptyText}>Log in or create an account to sync saved places across sessions.</Text>
            <View style={styles.authActions}>
              <Pressable style={styles.primaryAuthButton} onPress={() => router.push('/login')}>
                <Text style={styles.primaryAuthText}>Log in</Text>
              </Pressable>
              <Pressable style={styles.secondaryAuthButton} onPress={() => router.push('/register')}>
                <Text style={styles.secondaryAuthText}>Register</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.statsCard}>
          <Pressable
            style={[styles.statItem, selectedSection === 'visited' && styles.statItemActive]}
            onPress={() => setSelectedSection('visited')}
          >
            <Text style={[styles.statValue, selectedSection === 'visited' && styles.statValueActive]}>{visitedBars.length}</Text>
            <Text style={[styles.statLabel, selectedSection === 'visited' && styles.statLabelActive]}>Visited</Text>
            <View style={[styles.statIndicator, selectedSection === 'visited' && styles.statIndicatorActive]} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={[styles.statItem, selectedSection === 'saved' && styles.statItemActive]}
            onPress={() => setSelectedSection('saved')}
          >
            <Text style={[styles.statValue, selectedSection === 'saved' && styles.statValueActive]}>{savedBars.length}</Text>
            <Text style={[styles.statLabel, selectedSection === 'saved' && styles.statLabelActive]}>Saved</Text>
            <View style={[styles.statIndicator, selectedSection === 'saved' && styles.statIndicatorActive]} />
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={[styles.statItem, selectedSection === 'reviews' && styles.statItemActive]}
            onPress={() => setSelectedSection('reviews')}
          >
            <Text style={[styles.statValue, selectedSection === 'reviews' && styles.statValueActive]}>{myReviews.length}</Text>
            <Text style={[styles.statLabel, selectedSection === 'reviews' && styles.statLabelActive]}>Reviews</Text>
            <View style={[styles.statIndicator, selectedSection === 'reviews' && styles.statIndicatorActive]} />
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{activeSectionTitle}</Text>
          <Text style={styles.sectionHint}>{activeSectionHint}</Text>
        </View>

        {selectedSection === 'visited' ? (
          <View style={styles.savedList}>
            {!user ? (
              <View style={styles.emptyCard}>
                <Ionicons name="lock-closed-outline" size={24} color="#8b5cf6" />
                <Text style={styles.emptyTitle}>Log in to view visited places</Text>
                <Text style={styles.emptyText}>Your lit places will appear here after sign-in.</Text>
              </View>
            ) : isVisitedLoading ? (
              <View style={styles.emptyCard}>
                <ActivityIndicator color="#8b5cf6" />
                <Text style={styles.emptyTitle}>Loading visited places</Text>
                <Text style={styles.emptyText}>Fetching your lit places.</Text>
              </View>
            ) : visitedErrorMessage ? (
              <View style={styles.emptyCard}>
                <Ionicons name="warning-outline" size={24} color="#8b5cf6" />
                <Text style={styles.emptyTitle}>Could not load visited places</Text>
                <Text style={styles.emptyText}>{visitedErrorMessage}</Text>
                <Pressable style={styles.retryButton} onPress={() => void loadVisited()}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            ) : visitedBars.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="sparkles-outline" size={24} color="#8b5cf6" />
                <Text style={styles.emptyTitle}>No visited places yet</Text>
                <Text style={styles.emptyText}>Light up a bar detail page and it will appear here.</Text>
              </View>
            ) : (
              visitedBars.map((bar) => (
                <BarListItem
                  key={bar.id}
                  bar={bar}
                  action={
                    <View style={styles.visitedStatus}>
                      <Ionicons name="sparkles" size={14} color="#8b5cf6" />
                      <Text style={styles.visitedStatusText}>Visited</Text>
                    </View>
                  }
                />
              ))
            )}
          </View>
        ) : null}

        {selectedSection === 'saved' ? (
          <View style={styles.savedList}>
            {!user ? (
              <View style={styles.emptyCard}>
                <Ionicons name="lock-closed-outline" size={24} color="#8b5cf6" />
                <Text style={styles.emptyTitle}>Log in to view saved places</Text>
                <Text style={styles.emptyText}>Your backend favorites will appear here after sign-in.</Text>
              </View>
            ) : isSavedLoading ? (
              <View style={styles.emptyCard}>
                <ActivityIndicator color="#8b5cf6" />
                <Text style={styles.emptyTitle}>Loading saved places</Text>
                <Text style={styles.emptyText}>Fetching your bookmarks.</Text>
              </View>
            ) : savedErrorMessage ? (
              <View style={styles.emptyCard}>
                <Ionicons name="warning-outline" size={24} color="#8b5cf6" />
                <Text style={styles.emptyTitle}>Could not load saved places</Text>
                <Text style={styles.emptyText}>{savedErrorMessage}</Text>
                <Pressable style={styles.retryButton} onPress={loadFavorites}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            ) : savedBars.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="bookmark-outline" size={24} color="#8b5cf6" />
                <Text style={styles.emptyTitle}>No saved places yet</Text>
                <Text style={styles.emptyText}>Tap a bookmark on Home or a bar detail page to save it here.</Text>
              </View>
            ) : (
              savedBars.map((bar) => (
                <BarListItem
                  key={bar.id}
                  bar={bar}
                  action={
                    <Pressable
                      hitSlop={8}
                      disabled={savedSyncingBarIds.includes(bar.id)}
                      style={[styles.unsaveButton, savedSyncingBarIds.includes(bar.id) && styles.itemActionButtonDisabled]}
                      onPress={(event) => {
                        event.stopPropagation();
                        void removeSavedBar(bar.id);
                      }}
                    >
                      <Text style={styles.unsaveButtonText}>Unsave</Text>
                    </Pressable>
                  }
                />
              ))
            )}
          </View>
        ) : null}

        {selectedSection === 'reviews' ? (
          <View style={styles.reviewList}>
            {reviewsErrorMessage && myReviews.length > 0 ? (
              <View style={styles.inlineReviewError}>
                <Ionicons name="warning-outline" size={16} color="#8b5cf6" />
                <Text style={styles.inlineReviewErrorText}>{reviewsErrorMessage}</Text>
              </View>
            ) : null}

            {!user ? (
              <View style={styles.emptyCard}>
                <Ionicons name="lock-closed-outline" size={24} color="#8b5cf6" />
                <Text style={styles.emptyTitle}>Log in to view reviews</Text>
                <Text style={styles.emptyText}>Your backend reviews will appear here after sign-in.</Text>
              </View>
            ) : isReviewsLoading && myReviews.length === 0 ? (
              <View style={styles.emptyCard}>
                <ActivityIndicator color="#8b5cf6" />
                <Text style={styles.emptyTitle}>Loading reviews</Text>
                <Text style={styles.emptyText}>Fetching your shared bar reviews.</Text>
              </View>
            ) : reviewsErrorMessage && myReviews.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="warning-outline" size={24} color="#8b5cf6" />
                <Text style={styles.emptyTitle}>Could not load reviews</Text>
                <Text style={styles.emptyText}>{reviewsErrorMessage}</Text>
                <Pressable style={styles.retryButton} onPress={() => void refreshMyReviews()}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            ) : myReviews.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="chatbubble-ellipses-outline" size={24} color="#8b5cf6" />
                <Text style={styles.emptyTitle}>No reviews yet</Text>
                <Text style={styles.emptyText}>Write a review from a bar detail page and it will appear here.</Text>
              </View>
            ) : (
              myReviews.map((review) => (
                <Pressable key={review.id} style={styles.reviewCard} onPress={() => pushBarDetail(review.barId)}>
                  <View style={styles.reviewTopRow}>
                    <View style={styles.reviewTitleWrap}>
                      <Text style={styles.reviewPlace}>{review.barName || 'Vesper spot'}</Text>
                      <Text style={styles.reviewTime}>{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently'}</Text>
                    </View>
                    <View style={styles.reviewRating}>
                      <Ionicons name="star" size={13} color="#f59e0b" />
                      <Text style={styles.reviewRatingText}>{review.rating}</Text>
                    </View>
                  </View>

                  <Text style={styles.reviewStory} numberOfLines={2}>
                    {review.content}
                  </Text>
                  {Array.isArray(review.imageUrls) && review.imageUrls.length > 0 ? (
                    <View style={styles.reviewImageGrid}>
                      {review.imageUrls.slice(0, 3).map((imageUrl) => (
                        <Image key={imageUrl} source={{ uri: resolveAssetUrl(imageUrl) }} style={styles.reviewImageThumb} />
                      ))}
                    </View>
                  ) : null}
                </Pressable>
              ))
            )}
          </View>
        ) : null}

        <Pressable style={styles.clearButton} onPress={confirmClearDemoData}>
          <Ionicons name="trash-outline" size={17} color="#be185d" />
          <Text style={styles.clearButtonText}>Clear local demo data</Text>
        </Pressable>

        {user ? (
          <Pressable style={styles.logoutButton} onPress={() => void logout()}>
            <Ionicons name="log-out-outline" size={17} color="#52525b" />
            <Text style={styles.logoutButtonText}>Log out</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fffdfc' },
  content: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 140 },
  avatar: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 48,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  avatarText: { color: '#8b5cf6', fontSize: 36, fontWeight: '900' },
  name: { marginTop: 18, color: '#111111', fontSize: 28, fontWeight: '900' },
  handle: { marginTop: 4, color: '#71717a', fontSize: 14, fontWeight: '600' },
  bio: { marginTop: 8, color: '#52525b', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  authCard: {
    width: '100%',
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: '#ffffff',
    padding: 24,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  authActions: { marginTop: 18, width: '100%', flexDirection: 'row', gap: 10 },
  primaryAuthButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#8b5cf6',
    paddingVertical: 13,
  },
  primaryAuthText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  secondaryAuthButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#f5f3ff',
    paddingVertical: 13,
  },
  secondaryAuthText: { color: '#7c3aed', fontSize: 14, fontWeight: '900' },
  statsCard: {
    marginTop: 28,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: '#ffffff',
    paddingVertical: 22,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  statItem: {
    flex: 1,
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginHorizontal: 8,
  },
  statItemActive: { backgroundColor: '#f5f3ff' },
  statValue: { color: '#111111', fontSize: 24, fontWeight: '900' },
  statValueActive: { color: '#7c3aed' },
  statLabel: { marginTop: 5, color: '#71717a', fontSize: 12, fontWeight: '700' },
  statLabelActive: { color: '#7c3aed' },
  statIndicator: {
    marginTop: 8,
    width: 22,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  statIndicatorActive: { backgroundColor: '#8b5cf6' },
  divider: { width: 1, height: 36, backgroundColor: '#f4f4f5' },
  sectionHeader: {
    width: '100%',
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { color: '#111111', fontSize: 22, fontWeight: '900' },
  sectionHint: { color: '#8b5cf6', fontSize: 13, fontWeight: '800' },
  reviewList: { width: '100%', marginTop: 14 },
  inlineReviewError: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 18,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inlineReviewErrorText: { flex: 1, color: '#6d28d9', fontSize: 12, fontWeight: '700' },
  reviewCard: {
    marginBottom: 12,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 16,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  reviewTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  reviewTitleWrap: { flex: 1, paddingRight: 12 },
  reviewPlace: { color: '#111111', fontSize: 17, fontWeight: '900' },
  reviewTime: { marginTop: 4, color: '#a1a1aa', fontSize: 12, fontWeight: '700' },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  reviewRatingText: { color: '#f59e0b', fontSize: 12, fontWeight: '900' },
  reviewTags: { marginTop: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  reviewTag: {
    borderRadius: 999,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reviewTagText: { color: '#7c3aed', fontSize: 11, fontWeight: '800' },
  reviewStory: { marginTop: 12, color: '#52525b', fontSize: 13, lineHeight: 19, fontWeight: '600' },
  reviewImageGrid: { marginTop: 12, flexDirection: 'row', gap: 8 },
  reviewImageThumb: { width: 68, height: 68, borderRadius: 14, backgroundColor: '#f4f4f5' },
  savedList: { width: '100%', marginTop: 14 },
  emptyCard: {
    alignItems: 'center',
    borderRadius: 26,
    backgroundColor: '#ffffff',
    padding: 24,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  emptyTitle: { marginTop: 10, color: '#18181b', fontSize: 16, fontWeight: '900' },
  emptyText: { marginTop: 6, color: '#71717a', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  retryButton: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  savedCard: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 12,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  savedImage: { width: 68, height: 68, borderRadius: 18, backgroundColor: '#f4f4f5' },
  savedBody: { flex: 1, marginLeft: 12, paddingRight: 10 },
  savedName: { color: '#111111', fontSize: 16, fontWeight: '900' },
  savedMeta: { marginTop: 4, color: '#71717a', fontSize: 12, fontWeight: '600' },
  savedRating: { marginTop: 7, color: '#f59e0b', fontSize: 12, fontWeight: '900' },
  savedRatingEmpty: { color: '#7c3aed' },
  visitedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  visitedStatusText: { color: '#7c3aed', fontSize: 12, fontWeight: '900' },
  unsaveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  unsaveButtonText: { color: '#7c3aed', fontSize: 12, fontWeight: '900' },
  itemActionButtonDisabled: { opacity: 0.55 },
  clearButton: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#fce7f3',
    backgroundColor: '#fdf2f8',
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  clearButtonText: { color: '#be185d', fontSize: 14, fontWeight: '900' },
  logoutButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  logoutButtonText: { color: '#52525b', fontSize: 14, fontWeight: '900' },
});

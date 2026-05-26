import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RatingPicker } from '../../components/RatingPicker';
import type { Bar } from '../../data/bars';
import { getRatingSummary, hasReliablePrice } from '../../lib/barDisplay';
import { getBarById } from '../../lib/bars';
import { getAuthToken } from '../../lib/authSession';
import { updateNearbyReviewSummary } from '../../lib/nearbyCache';
import { createReview, getBarReviews, type ReviewVO } from '../../lib/reviews';
import { resolveAssetUrl, uploadImage, type UploadImageInput } from '../../lib/upload';
import { useReviewStore } from '../../stores/reviewStore';
import { useSavedStore } from '../../stores/savedStore';
import { useVisitedStore } from '../../stores/visitedStore';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isNumericId(value: string | undefined) {
  return Boolean(value && /^\d+$/.test(value));
}

type SelectedReviewImage = UploadImageInput & {
  id: string;
};

function hasCjkText(value: string) {
  return /[\u3400-\u9fff]/.test(value);
}

function cleanCategoryLabel(value: string | null | undefined) {
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

function getDisplayTags(bar: Bar) {
  const rawTags = [bar.type, ...(Array.isArray(bar.tags) ? bar.tags : [])].filter(Boolean);
  const labels = rawTags.map(cleanCategoryLabel);
  return Array.from(new Set(labels.length > 0 ? labels : ['Night spot']));
}

function getAboutText(bar: Bar) {
  const address = bar.neighborhood?.trim();

  if (address) {
    return hasCjkText(address)
      ? '这是从地图发现的附近酒吧。写下你的体验，帮助其他人了解这里的氛围。'
      : 'A nearby bar discovered from the map. Leave a review to help others understand the vibe.';
  }

  return bar.about || 'A newly added Vesper spot. More details are coming soon.';
}

export default function BarDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { height: screenHeight } = useWindowDimensions();
  const [bar, setBar] = useState<Bar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [reviews, setReviews] = useState<ReviewVO[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [reviewsErrorMessage, setReviewsErrorMessage] = useState<string | null>(null);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<SelectedReviewImage[]>([]);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const addMyReview = useReviewStore((state) => state.addMyReview);
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
    const barId = firstParam(id);

    if (!isNumericId(barId)) {
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
      const nextBar = await getBarById(barId as string);
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

  async function loadReviews() {
    const barId = firstParam(id);

    if (!isNumericId(barId)) {
      setReviews([]);
      return;
    }

    setIsReviewsLoading(true);
    setReviewsErrorMessage(null);

    try {
      const nextReviews = await getBarReviews(barId as string);
      setReviews(Array.isArray(nextReviews) ? nextReviews : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load reviews.';
      setReviews([]);
      setReviewsErrorMessage(message);
    } finally {
      setIsReviewsLoading(false);
    }
  }

  useEffect(() => {
    void loadBar();
    void loadReviews();
    void loadFavorites();
    void loadVisited();
  }, [id]);

  function handleWriteReviewPress() {
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

    setReviewRating(5);
    setReviewContent('');
    setSelectedImages([]);
    setIsReviewModalVisible(true);
  }

  function closeReviewModal() {
    Keyboard.dismiss();
    setIsReviewModalVisible(false);
  }

  async function handleAddPhotosPress() {
    if (selectedImages.length >= 3) {
      Alert.alert('Photo limit reached', 'You can add up to 3 photos to a review.');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to add images.');
      return;
    }

    const remainingSlots = 3 - selectedImages.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 0.85,
    });

    if (result.canceled) {
      return;
    }

    const nextImages = result.assets.slice(0, remainingSlots).map((asset) => ({
      id: `${asset.assetId || asset.uri}-${Date.now()}-${Math.random()}`,
      uri: asset.uri,
      name: asset.fileName,
      type: asset.mimeType,
    }));
    setSelectedImages((currentImages) => [...currentImages, ...nextImages].slice(0, 3));
  }

  function removeSelectedImage(id: string) {
    setSelectedImages((currentImages) => currentImages.filter((image) => image.id !== id));
  }

  async function handleSubmitReview() {
    if (!bar || isReviewSubmitting) {
      return;
    }

    const content = reviewContent.trim();
    if (!content) {
      Alert.alert('Add a note', 'Review content cannot be empty.');
      return;
    }

    if (reviewRating < 1) {
      Alert.alert('Choose a rating', 'Please choose at least 1 star before submitting.');
      return;
    }

    if (content.length > 500) {
      Alert.alert('Review is too long', 'Please keep your review under 500 characters.');
      return;
    }

    setIsReviewSubmitting(true);

    try {
      const imageUrls = selectedImages.length > 0 ? await Promise.all(selectedImages.map(uploadImage)) : [];
      const newReview = await createReview({
        barId: Number(bar.id),
        rating: reviewRating,
        content,
        imageUrls,
      });
      addMyReview(newReview);
      updateNearbyReviewSummary(bar.id, newReview.rating);
      Keyboard.dismiss();
      setIsReviewModalVisible(false);
      setReviewContent('');
      setSelectedImages([]);
      await loadReviews();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit review.';
      Alert.alert('Could not submit review', message);
    } finally {
      setIsReviewSubmitting(false);
    }
  }

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

  const tags = getDisplayTags(bar);
  const title = bar.name || 'Vesper spot';
  const heroImage =
    bar.image || 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=900&q=85';
  const address = bar.neighborhood || 'Address pending';
  const detailReviewCount = reviews.length;
  const detailAverageRating =
    detailReviewCount > 0 ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / detailReviewCount : bar.rating;
  const ratingSummary = getRatingSummary({ rating: detailAverageRating, reviews: detailReviewCount || bar.reviews }, 'No reviews yet');
  const hasRating = ratingSummary.hasReviews;
  const price = bar.price || 'Price pending';
  const shouldShowPrice = hasReliablePrice(bar);
  const about = getAboutText(bar);

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Image source={{ uri: heroImage }} style={styles.heroImage} />
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
            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
              {title}
            </Text>
            {isVisited ? (
              <View style={styles.visitedPill}>
                <Ionicons name="sparkles" size={13} color="#ffffff" />
                <Text style={styles.visitedText}>Visited / Lit</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={16} color="#8b5cf6" />
            <Text style={styles.meta} numberOfLines={2} ellipsizeMode="tail">
              {address}
            </Text>
          </View>

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
            <View style={[styles.statPill, !hasRating && styles.newPlacePill]}>
              <Ionicons name={hasRating ? 'star' : 'sparkles-outline'} size={14} color={hasRating ? '#f59e0b' : '#7c3aed'} />
              <Text style={[styles.rating, !hasRating && styles.newPlaceText]}>{ratingSummary.text}</Text>
            </View>
            {shouldShowPrice ? (
              <View style={styles.statPill}>
                <Text style={styles.price}>{price}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.tagRow}>
            {tags.map((tag) => (
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
            <Text style={styles.about}>{about}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <Pressable style={styles.writeReviewButton} onPress={handleWriteReviewPress}>
                <Ionicons name="create-outline" size={16} color="#7c3aed" />
                <Text style={styles.writeReviewText}>Write review</Text>
              </Pressable>
            </View>

            {isReviewsLoading ? (
              <View style={styles.reviewStateCard}>
                <ActivityIndicator color="#8b5cf6" />
                <Text style={styles.reviewStateText}>Loading reviews</Text>
              </View>
            ) : reviewsErrorMessage ? (
              <View style={styles.reviewStateCard}>
                <Ionicons name="warning-outline" size={22} color="#8b5cf6" />
                <Text style={styles.reviewStateText}>{reviewsErrorMessage}</Text>
                <Pressable style={styles.retryButton} onPress={() => void loadReviews()}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            ) : reviews.length === 0 ? (
              <View style={styles.reviewStateCard}>
                <View style={styles.emptyReviewIcon}>
                  <Ionicons name="chatbubble-ellipses-outline" size={24} color="#8b5cf6" />
                </View>
                <Text style={styles.reviewStateTitle}>No reviews yet</Text>
                <Text style={styles.reviewStateText}>Be the first to leave a note after your visit.</Text>
              </View>
            ) : (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAuthorBlock}>
                      <Text style={styles.reviewAuthor}>{review.username || 'Vesper user'}</Text>
                      <Text style={styles.reviewTime}>
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently'}
                      </Text>
                    </View>
                    <View style={styles.reviewRatingPill}>
                      <Ionicons name="star" size={12} color="#f59e0b" />
                      <Text style={styles.reviewRating}>{review.rating}/5</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewText}>{review.content}</Text>
                  {Array.isArray(review.imageUrls) && review.imageUrls.length > 0 ? (
                    <View style={styles.reviewImageGrid}>
                      {review.imageUrls.slice(0, 3).map((imageUrl) => (
                        <Image key={imageUrl} source={{ uri: resolveAssetUrl(imageUrl) }} style={styles.reviewImageThumb} />
                      ))}
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={isReviewModalVisible} transparent animationType="fade" onRequestClose={closeReviewModal}>
        <Pressable style={styles.modalOverlay} onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKeyboardAvoider}>
          <Pressable style={[styles.modalCard, { maxHeight: screenHeight * 0.85 }]} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write review</Text>
              <Pressable style={styles.modalCloseButton} onPress={closeReviewModal}>
                <Ionicons name="close" size={20} color="#52525b" />
              </Pressable>
            </View>

            <ScrollView
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <Pressable onPress={Keyboard.dismiss}>
              <Text style={styles.modalLabel}>Rating</Text>
              <View style={styles.modalRatingRow}>
                <RatingPicker value={reviewRating} onChange={setReviewRating} size={25} buttonSize={42} gap={8} />
              </View>

              <Text style={styles.modalLabel}>Content</Text>
              <TextInput
                value={reviewContent}
                onChangeText={setReviewContent}
                placeholder="Great atmosphere and cocktails."
                placeholderTextColor="#a1a1aa"
                multiline
                maxLength={500}
                blurOnSubmit
                textAlignVertical="top"
                style={styles.reviewInput}
              />
              <Text style={styles.characterCount}>{reviewContent.length}/500</Text>

              <View style={styles.photoHeader}>
                <Text style={styles.modalLabel}>Photos</Text>
                <Text style={styles.photoLimitText}>{selectedImages.length}/3</Text>
              </View>
              <Pressable
                disabled={selectedImages.length >= 3 || isReviewSubmitting}
                style={[styles.addPhotoButton, (selectedImages.length >= 3 || isReviewSubmitting) && styles.addPhotoButtonDisabled]}
                onPress={() => void handleAddPhotosPress()}
              >
                <Ionicons name="image-outline" size={18} color="#7c3aed" />
                <Text style={styles.addPhotoText}>Add photos</Text>
              </Pressable>
              {selectedImages.length > 0 ? (
                <View style={styles.selectedImageGrid}>
                  {selectedImages.map((image) => (
                    <View key={image.id} style={styles.selectedImageWrap}>
                      <Image source={{ uri: image.uri }} style={styles.selectedImage} />
                      <Pressable style={styles.removeImageButton} onPress={() => removeSelectedImage(image.id)}>
                        <Ionicons name="close" size={14} color="#ffffff" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}

              <Pressable
                disabled={isReviewSubmitting}
                style={[styles.submitReviewButton, isReviewSubmitting && styles.submitReviewButtonDisabled]}
                onPress={() => void handleSubmitReview()}
              >
                {isReviewSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitReviewText}>Submit</Text>}
              </Pressable>
              </Pressable>
            </ScrollView>
          </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

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
  title: { color: '#111111', fontSize: 31, fontWeight: '900', lineHeight: 38 },
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
  addressRow: { marginTop: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  meta: { flex: 1, color: '#71717a', fontSize: 14, fontWeight: '600', lineHeight: 20 },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
  newPlacePill: { backgroundColor: '#f5f3ff' },
  rating: { color: '#f59e0b', fontSize: 14, fontWeight: '900' },
  newPlaceText: { color: '#7c3aed' },
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
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: '#111111', fontSize: 21, fontWeight: '900' },
  about: { marginTop: 10, color: '#52525b', fontSize: 15, lineHeight: 23 },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  writeReviewText: { color: '#7c3aed', fontSize: 12, fontWeight: '900' },
  reviewStateCard: {
    marginTop: 12,
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 22,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  emptyReviewIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#f5f3ff',
  },
  reviewStateTitle: { marginTop: 12, color: '#18181b', fontSize: 16, fontWeight: '900', textAlign: 'center' },
  reviewStateText: { marginTop: 8, color: '#71717a', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  reviewCard: {
    marginTop: 14,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 17,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  reviewAuthorBlock: { flex: 1 },
  reviewAuthor: { color: '#18181b', fontSize: 15, fontWeight: '900' },
  reviewTime: { marginTop: 3, color: '#a1a1aa', fontSize: 12, fontWeight: '700' },
  reviewRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  reviewRating: { color: '#f59e0b', fontSize: 13, fontWeight: '900' },
  reviewText: { marginTop: 11, color: '#52525b', fontSize: 14, lineHeight: 21, fontWeight: '600' },
  reviewImageGrid: { marginTop: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reviewImageThumb: { width: 82, height: 82, borderRadius: 16, backgroundColor: '#f4f4f5' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(24,24,27,0.42)',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  modalKeyboardAvoider: { width: '100%' },
  modalCard: {
    borderRadius: 26,
    backgroundColor: '#fffdfc',
    padding: 18,
    overflow: 'hidden',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { color: '#111111', fontSize: 22, fontWeight: '900' },
  modalCloseButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#f4f4f5',
  },
  modalLabel: { marginTop: 18, color: '#27272a', fontSize: 13, fontWeight: '900' },
  modalScrollContent: { paddingBottom: 4 },
  modalRatingRow: { marginTop: 10, flexDirection: 'row', gap: 8 },
  reviewInput: {
    marginTop: 10,
    minHeight: 132,
    borderRadius: 20,
    backgroundColor: '#f8f7fb',
    color: '#18181b',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  characterCount: { marginTop: 6, color: '#a1a1aa', fontSize: 12, fontWeight: '700', textAlign: 'right' },
  photoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  photoLimitText: { marginTop: 18, color: '#a1a1aa', fontSize: 12, fontWeight: '800' },
  addPhotoButton: {
    marginTop: 10,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 23,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  addPhotoButtonDisabled: { opacity: 0.55 },
  addPhotoText: { color: '#7c3aed', fontSize: 13, fontWeight: '900' },
  selectedImageGrid: { marginTop: 12, flexDirection: 'row', gap: 10 },
  selectedImageWrap: { position: 'relative' },
  selectedImage: { width: 74, height: 74, borderRadius: 16, backgroundColor: '#f4f4f5' },
  removeImageButton: {
    position: 'absolute',
    right: -6,
    top: -6,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#18181b',
  },
  submitReviewButton: {
    marginTop: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: '#8b5cf6',
  },
  submitReviewButtonDisabled: { opacity: 0.65 },
  submitReviewText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
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

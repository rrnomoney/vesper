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
  NativeScrollEvent,
  NativeSyntheticEvent,
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
import { getDetailAboutText, getDetailMetadata, getStarRatingDisplay } from '../../lib/barDisplay';
import { getAuthToken } from '../../lib/authSession';
import { getBarById } from '../../lib/bars';
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

type GalleryImage = {
  id: string;
  url: string;
};

function getInitials(value: string | null | undefined) {
  const words = (value || 'Vesper user').trim().split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('');

  return initials || 'VU';
}

function getReviewImages(reviews: ReviewVO[]): GalleryImage[] {
  return reviews.flatMap((review) =>
    (Array.isArray(review.imageUrls) ? review.imageUrls : []).map((imageUrl, index) => ({
      id: `${review.id}-${index}-${imageUrl}`,
      url: imageUrl,
    }))
  );
}

function getHeroImages(bar: Bar, reviewImages: GalleryImage[]) {
  const fallbackImage = 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=900&q=85';
  const urls = [bar.image, ...reviewImages.map((image) => image.url), fallbackImage]
    .filter(Boolean)
    .map((url) => resolveAssetUrl(url));

  return Array.from(new Set(urls));
}

function formatReviewDate(value: string | null) {
  if (!value) {
    return 'Recently';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Recently' : date.toLocaleDateString();
}

function StarRatingRow({ filledStars, text, hasReviews }: { filledStars: number; text: string; hasReviews: boolean }) {
  const [ratingText, countText] = text.match(/^(.+?)\s(\(.+\))$/)?.slice(1) ?? [text, ''];

  return (
    <View style={styles.starRatingRow}>
      {hasReviews ? (
        <View style={styles.starGroup}>
          {[0, 1, 2, 3, 4].map((index) => (
            <Ionicons key={index} name={index < filledStars ? 'star' : 'star-outline'} size={14} color="#f59e0b" />
          ))}
        </View>
      ) : (
        <Ionicons name="sparkles-outline" size={14} color="#7c3aed" />
      )}
      <Text style={[styles.rating, !hasReviews && styles.newPlaceText]}>{ratingText}</Text>
      {countText ? <Text style={styles.ratingCount}>{countText}</Text> : null}
    </View>
  );
}

function ReviewStars({ rating }: { rating: number }) {
  const numericRating = Number(rating) || 0;
  const filledStars = Math.max(1, Math.min(5, Math.round(numericRating)));

  return (
    <View style={styles.reviewStars}>
      {[0, 1, 2, 3, 4].map((index) => (
        <Ionicons key={index} name={index < filledStars ? 'star' : 'star-outline'} size={12} color="#f59e0b" />
      ))}
      <Text style={styles.reviewRating}>{numericRating.toFixed(1)}</Text>
    </View>
  );
}

function DetailLoadingSkeleton() {
  return (
    <View style={styles.screen}>
      <View style={styles.skeletonHero}>
        <SafeAreaView edges={['top']} style={styles.heroControls}>
          <View style={styles.skeletonCircle} />
          <View style={styles.skeletonCircle} />
        </SafeAreaView>
      </View>
      <View style={styles.body}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonLineWide} />
        <View style={styles.skeletonMetaRow}>
          <View style={styles.skeletonPill} />
          <View style={styles.skeletonPillSmall} />
        </View>
        <View style={styles.skeletonSection}>
          <View style={styles.skeletonHeading} />
          <View style={styles.skeletonParagraph} />
          <View style={styles.skeletonParagraphShort} />
        </View>
        <View style={styles.skeletonSection}>
          <View style={styles.skeletonHeading} />
          <View style={styles.skeletonReviewCard} />
        </View>
      </View>
    </View>
  );
}

export default function BarDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
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
  const [heroPage, setHeroPage] = useState(0);
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

  function handleHeroScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const page = Math.round(event.nativeEvent.contentOffset.x / Math.max(screenWidth, 1));
    setHeroPage(page);
  }

  function handleAddressPress() {
    if (!bar || !Number.isFinite(bar.latitude) || !Number.isFinite(bar.longitude)) {
      return;
    }

    router.push({
      pathname: '/place-map',
      params: {
        id: bar.id,
      },
    });
  }

  if (isLoading) {
    return <DetailLoadingSkeleton />;
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
          <Ionicons name="warning-outline" size={28} color="#7c3aed" />
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
          <Ionicons name="wine-outline" size={28} color="#7c3aed" />
          <Text style={styles.stateTitle}>Bar not found</Text>
          <Text style={styles.stateText}>This place may have been removed or is not available yet.</Text>
        </View>
      </View>
    );
  }

  const title = bar.name || 'Vesper spot';
  const address = bar.neighborhood || 'Address pending';
  const detailReviewCount = reviews.length;
  const detailAverageRating =
    detailReviewCount > 0 ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / detailReviewCount : bar.rating;
  const ratingDisplay = getStarRatingDisplay({ rating: detailAverageRating, reviews: detailReviewCount || bar.reviews }, 'New place');
  const hasRating = ratingDisplay.hasReviews;
  const metadata = getDetailMetadata(bar, hasRating);
  const about = getDetailAboutText(bar, detailReviewCount || bar.reviews);
  const galleryImages = getReviewImages(reviews);
  const heroImages = getHeroImages(bar, galleryImages);
  const canOpenMap = Number.isFinite(bar.latitude) && Number.isFinite(bar.longitude);

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleHeroScroll}
            scrollEventThrottle={16}
          >
            {heroImages.map((imageUrl) => (
              <Image key={imageUrl} source={{ uri: imageUrl }} style={[styles.heroImage, { width: screenWidth }]} />
            ))}
          </ScrollView>
          <View style={styles.heroShade} />
          {heroImages.length > 1 ? (
            <View style={styles.heroDots}>
              {heroImages.map((imageUrl, index) => (
                <View key={imageUrl} style={[styles.heroDot, index === heroPage && styles.heroDotActive]} />
              ))}
            </View>
          ) : null}
          <SafeAreaView edges={['top']} style={styles.heroControls}>
            <Pressable style={styles.circleButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#18181b" />
            </Pressable>
            <Pressable
              disabled={isSaving}
              style={[styles.circleButton, isSaving && styles.circleButtonDisabled]}
              onPress={handleBookmarkPress}
            >
              <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={21} color="#7c3aed" />
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
                <Text style={styles.visitedText}>Visited</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.vibeLine} numberOfLines={1}>
            {metadata.vibeLine}
          </Text>
          <Pressable disabled={!canOpenMap} style={styles.addressRow} onPress={handleAddressPress}>
            <Ionicons name="location-outline" size={16} color="#7c3aed" />
            <Text style={styles.meta} numberOfLines={2} ellipsizeMode="tail">
              {address}
            </Text>
            {canOpenMap ? <Ionicons name="chevron-forward" size={15} color="#a1a1aa" /> : null}
          </Pressable>

          {savedErrorMessage ? (
            <View style={styles.inlineError}>
              <Ionicons name="warning-outline" size={16} color="#7c3aed" />
              <Text style={styles.inlineErrorText}>{savedErrorMessage}</Text>
            </View>
          ) : null}

          {visitedErrorMessage ? (
            <View style={styles.inlineError}>
              <Ionicons name="warning-outline" size={16} color="#7c3aed" />
              <Text style={styles.inlineErrorText}>{visitedErrorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.statRow}>
            <View style={[styles.statPill, !hasRating && styles.newPlacePill]}>
              <StarRatingRow {...ratingDisplay} />
            </View>
            <View style={styles.statPill}>
              <Text style={styles.price}>{metadata.priceLine}</Text>
            </View>
          </View>

          <View style={styles.tagRow}>
            {metadata.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.about}>{about}</Text>
          </View>

          {galleryImages.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryContent}
              >
                {galleryImages.map((image) => (
                  <Image key={image.id} source={{ uri: resolveAssetUrl(image.url) }} style={styles.galleryImage} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Reviews</Text>
              </View>
              <Pressable style={styles.writeReviewButton} onPress={handleWriteReviewPress}>
                <Ionicons name="create-outline" size={16} color="#7c3aed" />
                <Text style={styles.writeReviewText}>Write</Text>
              </Pressable>
            </View>

            {isReviewsLoading ? (
              <View style={styles.reviewSkeletonCard}>
                <View style={styles.skeletonAvatar} />
                <View style={styles.reviewSkeletonBody}>
                  <View style={styles.skeletonLineMedium} />
                  <View style={styles.skeletonLineWide} />
                  <View style={styles.skeletonParagraphShort} />
                </View>
              </View>
            ) : reviewsErrorMessage ? (
              <View style={styles.reviewStateCard}>
                <Ionicons name="warning-outline" size={22} color="#7c3aed" />
                <Text style={styles.reviewStateText}>{reviewsErrorMessage}</Text>
                <Pressable style={styles.retryButton} onPress={() => void loadReviews()}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            ) : reviews.length === 0 ? (
              <View style={styles.reviewStateCard}>
                <View style={styles.emptyReviewIcon}>
                  <Ionicons name="chatbubble-ellipses-outline" size={24} color="#7c3aed" />
                </View>
                <Text style={styles.reviewStateTitle}>Be the first to light up this place.</Text>
                <Text style={styles.reviewStateText}>Your note helps this spot feel less like a pin and more like a night out.</Text>
              </View>
            ) : (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{getInitials(review.username)}</Text>
                    </View>
                    <View style={styles.reviewAuthorBlock}>
                      <Text style={styles.reviewAuthor}>{review.username || 'Vesper user'}</Text>
                      <Text style={styles.reviewTime}>{formatReviewDate(review.createdAt)}</Text>
                    </View>
                    <View style={styles.reviewRatingPill}>
                      <ReviewStars rating={review.rating} />
                    </View>
                  </View>
                  <Text style={styles.reviewText}>{review.content}</Text>
                  {Array.isArray(review.imageUrls) && review.imageUrls.length > 0 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.reviewImageStrip}
                    >
                      {review.imageUrls.slice(0, 6).map((imageUrl) => (
                        <Image key={imageUrl} source={{ uri: resolveAssetUrl(imageUrl) }} style={styles.reviewImageThumb} />
                      ))}
                    </ScrollView>
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

const skeletonColor = '#ece8e1';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fffaf5' },
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
    backgroundColor: '#7c3aed',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  hero: { height: 330, backgroundColor: '#e7e5e4' },
  heroImage: { height: '100%' },
  heroShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
    backgroundColor: 'rgba(24,24,27,0.16)',
  },
  heroDots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.58)',
  },
  heroDotActive: { width: 18, backgroundColor: '#ffffff' },
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
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#111827',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  circleButtonDisabled: { opacity: 0.55 },
  body: {
    marginTop: -34,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: '#fffaf5',
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { flex: 1, color: '#111111', fontSize: 32, fontWeight: '900', lineHeight: 38 },
  visitedPill: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: '#db2777',
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  visitedText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  vibeLine: { marginTop: 10, color: '#27272a', fontSize: 15, fontWeight: '800' },
  addressRow: { marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 7 },
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
  statRow: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#f1eee8',
    paddingHorizontal: 13,
    paddingVertical: 9,
    shadowColor: '#111827',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  newPlacePill: { backgroundColor: '#f5f3ff', borderColor: '#ede9fe' },
  starRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  starGroup: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  rating: { color: '#f59e0b', fontSize: 13, fontWeight: '900' },
  ratingCount: { marginLeft: -3, color: '#a1a1aa', fontSize: 12, fontWeight: '800' },
  newPlaceText: { color: '#7c3aed' },
  price: { color: '#3f3f46', fontSize: 13, fontWeight: '800' },
  tagRow: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  tag: { borderRadius: 999, backgroundColor: '#f4f4f5', paddingHorizontal: 12, paddingVertical: 8 },
  tagText: { color: '#3f3f46', fontSize: 12, fontWeight: '800' },
  section: { marginTop: 30 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: '#111111', fontSize: 21, fontWeight: '900' },
  sectionMeta: { marginTop: 4, color: '#a1a1aa', fontSize: 12, fontWeight: '800' },
  about: { marginTop: 11, color: '#52525b', fontSize: 15, lineHeight: 24, fontWeight: '600' },
  galleryContent: { gap: 12, paddingTop: 14, paddingRight: 20 },
  galleryImage: {
    width: 168,
    height: 126,
    borderRadius: 22,
    backgroundColor: '#f4f4f5',
  },
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
    marginTop: 14,
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 22,
    borderWidth: 1,
    borderColor: '#f1eee8',
    shadowColor: '#111827',
    shadowOpacity: 0.06,
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
  reviewStateText: { marginTop: 8, color: '#71717a', fontSize: 13, lineHeight: 19, fontWeight: '700', textAlign: 'center' },
  reviewCard: {
    marginTop: 14,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 17,
    borderWidth: 1,
    borderColor: '#f1eee8',
    shadowColor: '#111827',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#18181b',
  },
  avatarText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  reviewAuthorBlock: { flex: 1 },
  reviewAuthor: { color: '#18181b', fontSize: 15, fontWeight: '900' },
  reviewTime: { marginTop: 3, color: '#a1a1aa', fontSize: 12, fontWeight: '700' },
  reviewRatingPill: {
    borderRadius: 999,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  reviewStars: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  reviewRating: { color: '#f59e0b', fontSize: 13, fontWeight: '900' },
  reviewText: { marginTop: 13, color: '#52525b', fontSize: 14, lineHeight: 22, fontWeight: '600' },
  reviewImageStrip: { gap: 9, paddingTop: 13, paddingRight: 6 },
  reviewImageThumb: { width: 88, height: 88, borderRadius: 18, backgroundColor: '#f4f4f5' },
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
    backgroundColor: '#fffaf5',
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
    backgroundColor: '#7c3aed',
  },
  submitReviewButtonDisabled: { opacity: 0.65 },
  submitReviewText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,250,245,0.96)',
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
    backgroundColor: '#7c3aed',
    shadowColor: '#7c3aed',
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  checkInButtonDone: { backgroundColor: '#db2777' },
  checkInButtonDisabled: { opacity: 0.65 },
  checkInText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  skeletonHero: { height: 330, backgroundColor: '#e7e5e4' },
  skeletonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  skeletonTitle: { width: '76%', height: 36, borderRadius: 18, backgroundColor: skeletonColor },
  skeletonLineWide: { marginTop: 14, width: '88%', height: 16, borderRadius: 8, backgroundColor: skeletonColor },
  skeletonLineMedium: { width: '58%', height: 14, borderRadius: 7, backgroundColor: skeletonColor },
  skeletonMetaRow: { marginTop: 18, flexDirection: 'row', gap: 10 },
  skeletonPill: { width: 132, height: 38, borderRadius: 19, backgroundColor: skeletonColor },
  skeletonPillSmall: { width: 92, height: 38, borderRadius: 19, backgroundColor: skeletonColor },
  skeletonSection: { marginTop: 30 },
  skeletonHeading: { width: 96, height: 22, borderRadius: 11, backgroundColor: skeletonColor },
  skeletonParagraph: { marginTop: 14, width: '100%', height: 18, borderRadius: 9, backgroundColor: skeletonColor },
  skeletonParagraphShort: { marginTop: 10, width: '68%', height: 18, borderRadius: 9, backgroundColor: skeletonColor },
  skeletonReviewCard: { marginTop: 14, height: 118, borderRadius: 24, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1eee8' },
  reviewSkeletonCard: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 12,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 17,
    borderWidth: 1,
    borderColor: '#f1eee8',
  },
  skeletonAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: skeletonColor },
  reviewSkeletonBody: { flex: 1 },
});

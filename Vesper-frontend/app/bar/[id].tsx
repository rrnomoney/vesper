import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { featuredBars, getBarById } from '../../data/bars';
import { useCheckInStore } from '../../stores/checkInStore';
import { useSavedStore } from '../../stores/savedStore';

export default function BarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bar = getBarById(id) ?? featuredBars[0];
  const checkInBar = useCheckInStore((state) => state.checkInBar);
  const removeCheckIn = useCheckInStore((state) => state.removeCheckIn);
  const visitedBarIds = useCheckInStore((state) => state.visitedBarIds);
  const savedBarIds = useSavedStore((state) => state.savedBarIds);
  const toggleSavedBar = useSavedStore((state) => state.toggleSavedBar);
  const isVisited = visitedBarIds.includes(bar.id);
  const isSaved = savedBarIds.includes(bar.id);

  const handleCheckInPress = () => {
    if (isVisited) {
      Alert.alert('Remove from visited?', 'This will remove this bar from your visited places.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeCheckIn(bar.id) },
      ]);
      return;
    }

    Alert.alert('Light up this place?', 'This will mark the bar as visited and add it to your profile.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Light up', onPress: () => checkInBar(bar.id) },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Image source={{ uri: bar.image }} style={styles.heroImage} />
          <SafeAreaView edges={['top']} style={styles.heroControls}>
            <Pressable style={styles.circleButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#18181b" />
            </Pressable>
            <Pressable style={styles.circleButton} onPress={() => toggleSavedBar(bar.id)}>
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
        <Pressable style={[styles.checkInButton, isVisited && styles.checkInButtonDone]} onPress={handleCheckInPress}>
          <Ionicons name={isVisited ? 'checkmark-circle' : 'sparkles-outline'} size={19} color="#ffffff" />
          <Text style={styles.checkInText}>{isVisited ? 'Place lit!' : 'Light up this place'}</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fffdfc' },
  content: { paddingBottom: 132 },
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
  checkInText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
});

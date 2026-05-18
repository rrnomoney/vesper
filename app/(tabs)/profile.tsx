import { Ionicons } from '@expo/vector-icons';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { featuredBars } from '../../data/bars';
import { useCheckInStore } from '../../stores/checkInStore';
import { usePostStore } from '../../stores/postStore';
import { useSavedStore } from '../../stores/savedStore';

export default function ProfileScreen() {
  const visitedCount = useCheckInStore((state) => state.visitedBarIds.length);
  const clearCheckIns = useCheckInStore((state) => state.clearCheckIns);
  const posts = usePostStore((state) => state.posts);
  const clearPosts = usePostStore((state) => state.clearPosts);
  const savedBarIds = useSavedStore((state) => state.savedBarIds);
  const clearSavedBars = useSavedStore((state) => state.clearSavedBars);
  const savedBars = featuredBars.filter((bar) => savedBarIds.includes(bar.id));

  const confirmClearDemoData = () => {
    Alert.alert('Clear demo data?', 'This will reset visited, saved, and reviews.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearCheckIns();
          clearSavedBars();
          clearPosts();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>A</Text>
        </View>
        <Text style={styles.name}>Alex</Text>
        <Text style={styles.handle}>@alex_vesper</Text>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{visitedCount}</Text>
            <Text style={styles.statLabel}>Visited</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{savedBars.length}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{posts.length}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Reviews</Text>
          <Text style={styles.sectionHint}>{posts.length} shared</Text>
        </View>

        <View style={styles.reviewList}>
          {posts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#8b5cf6" />
              <Text style={styles.emptyTitle}>No stories yet</Text>
              <Text style={styles.emptyText}>Share a night from Publish and it will appear here.</Text>
            </View>
          ) : (
            posts.map((post) => (
              <View key={post.id} style={styles.reviewCard}>
                <View style={styles.reviewTopRow}>
                  <View style={styles.reviewTitleWrap}>
                    <Text style={styles.reviewPlace}>{post.placeName}</Text>
                    <Text style={styles.reviewTime}>Just now</Text>
                  </View>
                  <View style={styles.reviewRating}>
                    <Ionicons name="star" size={13} color="#f59e0b" />
                    <Text style={styles.reviewRatingText}>{post.rating}</Text>
                  </View>
                </View>

                {post.tags.length > 0 ? (
                  <View style={styles.reviewTags}>
                    {post.tags.map((tag) => (
                      <View key={tag} style={styles.reviewTag}>
                        <Text style={styles.reviewTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <Text style={styles.reviewStory} numberOfLines={2}>
                  {post.story || 'A quiet little night worth remembering.'}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Places</Text>
          <Text style={styles.sectionHint}>{savedBars.length} saved</Text>
        </View>

        <View style={styles.savedList}>
          {savedBars.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="bookmark-outline" size={24} color="#8b5cf6" />
              <Text style={styles.emptyTitle}>No saved places yet</Text>
              <Text style={styles.emptyText}>Tap a bookmark on Home or a bar detail page to save it here.</Text>
            </View>
          ) : (
            savedBars.map((bar) => (
              <View key={bar.id} style={styles.savedCard}>
                <Image source={{ uri: bar.image }} style={styles.savedImage} />
                <View style={styles.savedBody}>
                  <Text style={styles.savedName}>{bar.name}</Text>
                  <Text style={styles.savedMeta}>
                    {bar.type} - {bar.neighborhood}
                  </Text>
                  <Text style={styles.savedRating}>★ {bar.rating} ({bar.reviews})</Text>
                </View>
                <Ionicons name="bookmark" size={18} color="#8b5cf6" />
              </View>
            ))
          )}
        </View>

        <Pressable style={styles.clearButton} onPress={confirmClearDemoData}>
          <Ionicons name="trash-outline" size={17} color="#be185d" />
          <Text style={styles.clearButtonText}>Clear demo data</Text>
        </Pressable>
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
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#111111', fontSize: 24, fontWeight: '900' },
  statLabel: { marginTop: 5, color: '#71717a', fontSize: 12, fontWeight: '700' },
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
});

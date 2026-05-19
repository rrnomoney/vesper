import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { featuredBars, homeCategories } from '../../data/bars';
import { useCheckInStore } from '../../stores/checkInStore';
import { useSavedStore } from '../../stores/savedStore';

export default function HomeScreen() {
  const visitedBarIds = useCheckInStore((state) => state.visitedBarIds);
  const savedBarIds = useSavedStore((state) => state.savedBarIds);
  const toggleSavedBar = useSavedStore((state) => state.toggleSavedBar);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>Vesper</Text>
            <View style={styles.cityRow}>
              <Ionicons name="location" size={14} color="#8b5cf6" />
              <Text style={styles.city}>Shanghai</Text>
              <Ionicons name="chevron-down" size={14} color="#a1a1aa" />
            </View>
          </View>
          <View style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={20} color="#27272a" />
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#a1a1aa" />
          <TextInput
            placeholder="Search bars, vibes, or areas"
            placeholderTextColor="#a1a1aa"
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroller}
          contentContainerStyle={styles.chipContent}
        >
          {homeCategories.map((category, index) => (
            <View key={category} style={[styles.chip, index === 0 && styles.chipActive]}>
              <Text style={[styles.chipText, index === 0 && styles.chipTextActive]}>{category}</Text>
            </View>
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
          {featuredBars.map((bar) => {
            const isVisited = visitedBarIds.includes(bar.id);
            const isSaved = savedBarIds.includes(bar.id);

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
                      style={styles.saveButton}
                      onPress={(event) => {
                        event.stopPropagation();
                        toggleSavedBar(bar.id);
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
          })}
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
  cardBottomRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rating: { color: '#f59e0b', fontSize: 14, fontWeight: '800' },
  price: { color: '#27272a', fontSize: 14, fontWeight: '800' },
});

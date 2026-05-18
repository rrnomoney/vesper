import { Ionicons } from '@expo/vector-icons';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { featuredBars } from '../../data/bars';
import { useCheckInStore } from '../../stores/checkInStore';
import { useSavedStore } from '../../stores/savedStore';

export default function ProfileScreen() {
  const visitedCount = useCheckInStore((state) => state.visitedBarIds.length);
  const savedBarIds = useSavedStore((state) => state.savedBarIds);
  const savedBars = featuredBars.filter((bar) => savedBarIds.includes(bar.id));

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
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
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
});

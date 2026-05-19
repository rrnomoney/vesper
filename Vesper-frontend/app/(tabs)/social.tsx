import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const mockUsers = [
  {
    id: '1',
    name: 'Mia',
    age: 26,
    distance: '1.2 km away',
    vibeMatch: 86,
    tonightMood: 'Cocktail first, rooftop later',
    oftenAt: ['Atelier No. 8', 'Velvet Room', 'Skyline 72'],
    tags: ['Cocktail', 'Rooftop', 'Date Night', 'Low-key'],
    bio: 'Soft lights, sharp drinks, one good second stop.',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '2',
    name: 'Leo',
    age: 29,
    distance: '2.4 km away',
    vibeMatch: 79,
    tonightMood: 'Hidden bar, live set, no rush',
    oftenAt: ['The Parlour', 'Echo Club', 'The Listening Room'],
    tags: ['Speakeasy', 'Live Music', 'Whisky', 'Jazz'],
    bio: 'Hidden rooms, warm sound, unhurried nights.',
    image:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '3',
    name: 'Nora',
    age: 24,
    distance: '850 m away',
    vibeMatch: 91,
    tonightMood: 'Dancing after one skyline drink',
    oftenAt: ['Pink Hour', 'Orbit Lounge', 'Mirror Club'],
    tags: ['Club', 'Rooftop', 'Live Music', 'Dancing'],
    bio: 'Skyline first, late playlist after.',
    image:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
  },
];

export default function SocialScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState('');
  const currentUser = mockUsers[currentIndex];

  const moveToNextUser = () => {
    setCurrentIndex((index) => (index + 1) % mockUsers.length);
  };

  const handleSkip = () => {
    setStatus('');
    moveToNextUser();
  };

  const handleLike = () => {
    setStatus('Liked · maybe see you tonight');
    setTimeout(() => {
      setStatus('');
      moveToNextUser();
    }, 850);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Find your night people</Text>
          <Text style={styles.subtitle}>Meet people who share your nightlife taste</Text>
        </View>

        <View style={styles.card}>
          <ImageBackground source={{ uri: currentUser.image }} style={styles.heroImage} imageStyle={styles.heroImageStyle}>
            <View style={styles.heroShadeBottom} />

            <View style={styles.matchBadge}>
              <Ionicons name="sparkles" size={13} color="#ffffff" />
              <Text style={styles.matchText}>{currentUser.vibeMatch}% vibe match</Text>
            </View>

            <View style={styles.heroProfile}>
              <Text style={styles.name}>
                {currentUser.name}, {currentUser.age}
              </Text>
              <View style={styles.distanceRow}>
                <Ionicons name="location" size={14} color="#ffffff" />
                <Text style={styles.distance}>{currentUser.distance}</Text>
              </View>
            </View>
          </ImageBackground>

          <View style={styles.cardBody}>
            {status ? (
              <View style={styles.statusBadge}>
                <Ionicons name="heart" size={14} color="#ec4899" />
                <Text style={styles.statusText}>{status}</Text>
              </View>
            ) : null}

            <View style={styles.moodCard}>
              <Text style={styles.label}>Tonight mood</Text>
              <Text style={styles.moodText}>{currentUser.tonightMood}</Text>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.label}>Often at</Text>
              <View style={styles.placeList}>
                {currentUser.oftenAt.map((place) => (
                  <View key={place} style={styles.placePill}>
                    <Ionicons name="wine-outline" size={12} color="#8b5cf6" />
                    <Text style={styles.placeText}>{place}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.tags}>
              {currentUser.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.bio}>{currentUser.bio}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={[styles.actionButton, styles.skipButton]} onPress={handleSkip}>
            <Ionicons name="close" size={20} color="#71717a" />
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>

          <Pressable style={[styles.actionButton, styles.likeButton]} onPress={handleLike}>
            <Ionicons name="chatbubble-ellipses" size={19} color="#ffffff" />
            <Text style={styles.likeText}>Say hi</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fffdfc' },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 150 },
  header: { marginBottom: 22 },
  title: { color: '#111111', fontSize: 31, fontWeight: '900' },
  subtitle: { marginTop: 8, color: '#71717a', fontSize: 14, lineHeight: 21, fontWeight: '600' },
  card: {
    overflow: 'hidden',
    borderRadius: 32,
    backgroundColor: '#ffffff',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 7,
  },
  heroImage: { height: 318, justifyContent: 'flex-end', backgroundColor: '#f4f4f5' },
  heroImageStyle: { borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  heroShadeBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
    backgroundColor: 'rgba(17,17,17,0.42)',
  },
  matchBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(139,92,246,0.88)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  matchText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  heroProfile: { paddingHorizontal: 20, paddingBottom: 18 },
  name: { color: '#ffffff', fontSize: 29, fontWeight: '900' },
  distanceRow: { marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 5 },
  distance: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  cardBody: { padding: 18 },
  statusBadge: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: '#fdf2f8',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statusText: { color: '#be185d', fontSize: 13, fontWeight: '900' },
  moodCard: {
    borderRadius: 22,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  label: { color: '#8b5cf6', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  moodText: { marginTop: 5, color: '#27272a', fontSize: 16, lineHeight: 22, fontWeight: '900' },
  infoBlock: {
    marginTop: 12,
    borderRadius: 22,
    backgroundColor: '#f8f7fb',
    padding: 14,
  },
  placeList: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  placePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  placeText: { color: '#27272a', fontSize: 12, fontWeight: '800' },
  tags: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  tag: {
    borderRadius: 999,
    backgroundColor: '#fff1f2',
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  tagText: { color: '#be185d', fontSize: 12, fontWeight: '800' },
  bio: { marginTop: 14, color: '#52525b', fontSize: 14, lineHeight: 20, fontWeight: '600' },
  actions: { marginTop: 18, flexDirection: 'row', gap: 12 },
  actionButton: {
    height: 56,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 28,
  },
  skipButton: {
    borderWidth: 1,
    borderColor: '#f4f4f5',
    backgroundColor: '#ffffff',
  },
  likeButton: {
    backgroundColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  skipText: { color: '#71717a', fontSize: 16, fontWeight: '900' },
  likeText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
});

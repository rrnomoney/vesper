import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { featuredBars } from '../../data/bars';
import { useCheckInStore } from '../../stores/checkInStore';

const mockPins = [
  { id: 'alchemy', top: '27%', left: '22%' },
  { id: 'sober-company', top: '42%', left: '63%' },
  { id: 'nest-rooftop', top: '21%', left: '68%' },
  { id: 'la-social', top: '59%', left: '31%' },
  { id: 'violet-room', top: '68%', left: '72%' },
] as const;

export default function MapScreen() {
  const visitedBarIds = useCheckInStore((state) => state.visitedBarIds);
  const [selectedBarId, setSelectedBarId] = useState(featuredBars[0]?.id);
  const selectedBar = featuredBars.find((bar) => bar.id === selectedBarId);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Night map</Text>
            <Text style={styles.subtitle}>A soft preview of places around you</Text>
          </View>
          <View style={styles.locationButton}>
            <Ionicons name="navigate" size={18} color="#8b5cf6" />
          </View>
        </View>

        <View style={styles.mapCard}>
          <View style={[styles.road, styles.roadOne]} />
          <View style={[styles.road, styles.roadTwo]} />
          <View style={[styles.road, styles.roadThree]} />
          <View style={[styles.road, styles.roadFour]} />

          <View style={styles.districtOne} />
          <View style={styles.districtTwo} />
          <View style={styles.districtThree} />

          {mockPins.map((pin) => {
            const bar = featuredBars.find((item) => item.id === pin.id);
            const isVisited = visitedBarIds.includes(pin.id);
            const isSelected = selectedBarId === pin.id;

            if (!bar) {
              return null;
            }

            return (
              <Pressable
                key={pin.id}
                style={[
                  styles.pin,
                  { top: pin.top, left: pin.left },
                  isVisited && styles.pinVisited,
                  isSelected && styles.pinSelected,
                ]}
                onPress={() => setSelectedBarId(pin.id)}
              >
                {isVisited ? <View style={styles.pinGlow} /> : null}
                <Ionicons name={isVisited ? 'sparkles' : 'wine'} size={15} color={isVisited ? '#ffffff' : '#8b5cf6'} />
              </Pressable>
            );
          })}

          <View style={styles.mapLabel}>
            <Text style={styles.mapLabelText}>Shanghai nightlife mock map</Text>
          </View>
        </View>

        {selectedBar ? (
          <View style={styles.previewCard}>
            <View style={styles.previewTop}>
              <View style={styles.previewIcon}>
                <Ionicons name="wine-outline" size={20} color="#8b5cf6" />
              </View>
              <View style={styles.previewText}>
                <Text style={styles.previewName}>{selectedBar.name}</Text>
                <Text style={styles.previewMeta}>
                  {selectedBar.type} - {selectedBar.neighborhood}
                </Text>
              </View>
              {visitedBarIds.includes(selectedBar.id) ? (
                <View style={styles.visitedBadge}>
                  <Ionicons name="sparkles" size={12} color="#ffffff" />
                  <Text style={styles.visitedText}>Visited</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.previewBottom}>
              <Text style={styles.rating}>★ {selectedBar.rating} ({selectedBar.reviews})</Text>
              <Text style={styles.distance}>{selectedBar.distance}</Text>
            </View>

            <Pressable style={styles.detailsButton} onPress={() => router.push(`/bar/${selectedBar.id}`)}>
              <Text style={styles.detailsButtonText}>View details</Text>
              <Ionicons name="chevron-forward" size={16} color="#ffffff" />
            </Pressable>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fffdfc' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 136 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title: { color: '#111111', fontSize: 32, fontWeight: '900' },
  subtitle: { marginTop: 7, color: '#71717a', fontSize: 14, fontWeight: '600' },
  locationButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#ffffff',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  mapCard: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 32,
    backgroundColor: '#f8f7fb',
    borderWidth: 1,
    borderColor: '#ffffff',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.11,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 7,
  },
  districtOne: {
    position: 'absolute',
    top: 34,
    left: 22,
    width: 150,
    height: 110,
    borderRadius: 32,
    backgroundColor: '#f5f3ff',
  },
  districtTwo: {
    position: 'absolute',
    right: 18,
    top: 142,
    width: 132,
    height: 150,
    borderRadius: 34,
    backgroundColor: '#fff1f2',
  },
  districtThree: {
    position: 'absolute',
    left: 36,
    bottom: 58,
    width: 178,
    height: 120,
    borderRadius: 36,
    backgroundColor: '#fdf2f8',
  },
  road: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    opacity: 0.92,
  },
  roadOne: { width: '120%', height: 18, top: '26%', left: '-10%', transform: [{ rotate: '-12deg' }] },
  roadTwo: { width: 18, height: '110%', top: '-4%', left: '50%', transform: [{ rotate: '17deg' }] },
  roadThree: { width: '100%', height: 14, top: '58%', left: '4%', transform: [{ rotate: '18deg' }] },
  roadFour: { width: 16, height: '80%', top: '20%', left: '24%', transform: [{ rotate: '-28deg' }] },
  pin: {
    position: 'absolute',
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    borderWidth: 3,
    borderColor: '#ffffff',
    backgroundColor: '#ffffff',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  },
  pinVisited: {
    backgroundColor: '#ec4899',
    borderColor: '#f5d0fe',
    shadowColor: '#ec4899',
    shadowOpacity: 0.34,
    shadowRadius: 16,
  },
  pinSelected: { transform: [{ scale: 1.16 }] },
  pinGlow: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
    opacity: 0.9,
  },
  mapLabel: {
    position: 'absolute',
    left: 16,
    top: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mapLabelText: { color: '#71717a', fontSize: 12, fontWeight: '800' },
  previewCard: {
    marginTop: 16,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    padding: 16,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.11,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  previewTop: { flexDirection: 'row', alignItems: 'center' },
  previewIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#f5f3ff',
  },
  previewText: { flex: 1, marginLeft: 12, paddingRight: 8 },
  previewName: { color: '#111111', fontSize: 18, fontWeight: '900' },
  previewMeta: { marginTop: 4, color: '#71717a', fontSize: 12, fontWeight: '700' },
  visitedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  visitedText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  previewBottom: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rating: { color: '#f59e0b', fontSize: 13, fontWeight: '900' },
  distance: { color: '#27272a', fontSize: 13, fontWeight: '900' },
  detailsButton: {
    marginTop: 16,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 24,
    backgroundColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  detailsButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
});

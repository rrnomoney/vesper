import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { featuredBars, type Bar } from '../../data/bars';
import { useCheckInStore } from '../../stores/checkInStore';

type MapMode = 'spots' | 'user';
type MapCoordinate = {
  latitude: number;
  longitude: number;
};

const shanghaiRegion: Region = {
  latitude: 31.2304,
  longitude: 121.4737,
  latitudeDelta: 0.055,
  longitudeDelta: 0.055,
};

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const visitedBarIds = useCheckInStore((state) => state.visitedBarIds);
  const [selectedBar, setSelectedBar] = useState<Bar | null>(featuredBars[0] ?? null);
  const [mapMode, setMapMode] = useState<MapMode>('spots');
  const [userCoordinate, setUserCoordinate] = useState<MapCoordinate | null>(null);
  const [locationMessage, setLocationMessage] = useState('');

  const moveToUserLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== Location.PermissionStatus.GRANTED) {
      setLocationMessage('Location permission was not allowed.');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const nextCoordinate = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    setMapMode('user');
    setSelectedBar(null);
    setUserCoordinate(nextCoordinate);
    setLocationMessage('');
    mapRef.current?.animateToRegion(
      {
        ...nextCoordinate,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      },
      650,
    );
  };

  const showShanghaiSpots = () => {
    setMapMode('spots');
    setLocationMessage('');
    setSelectedBar(featuredBars[0] ?? null);
    mapRef.current?.animateToRegion(shanghaiRegion, 650);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Night map</Text>
            <Text style={styles.subtitle}>Explore nearby Vesper spots</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.spotsButton} onPress={showShanghaiSpots}>
              <Text style={styles.spotsButtonText}>Shanghai spots</Text>
            </Pressable>
            <Pressable style={styles.locationButton} onPress={moveToUserLocation}>
              <Ionicons name="locate" size={18} color="#8b5cf6" />
            </Pressable>
          </View>
        </View>

        <Text style={styles.mapHint}>Mock venues are currently based in Shanghai.</Text>

        <View style={styles.mapCard}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={shanghaiRegion}
            scrollEnabled={false}
            zoomEnabled
            pitchEnabled={false}
            rotateEnabled={false}
          >
            {mapMode === 'spots'
              ? featuredBars.map((bar) => {
                  const isVisited = visitedBarIds.includes(bar.id);
                  const isSelected = selectedBar?.id === bar.id;

                  return (
                    <Marker
                      key={bar.id}
                      coordinate={{ latitude: bar.latitude, longitude: bar.longitude }}
                      onPress={() => {
                        setSelectedBar(bar);
                        setMapMode('spots');
                        setLocationMessage('');
                      }}
                    >
                      <View style={[styles.marker, isVisited && styles.markerVisited, isSelected && styles.markerSelected]}>
                        <Ionicons name={isVisited ? 'sparkles' : 'wine'} size={15} color="#ffffff" />
                      </View>
                    </Marker>
                  );
                })
              : null}

            {mapMode === 'user' && userCoordinate ? (
              <Marker coordinate={userCoordinate}>
                <View style={styles.userMarker}>
                  <Ionicons name="person" size={15} color="#ffffff" />
                </View>
              </Marker>
            ) : null}
          </MapView>

          {locationMessage ? (
            <View style={styles.messageBadge}>
              <Text style={styles.messageText}>{locationMessage}</Text>
            </View>
          ) : null}
        </View>

        {selectedBar && mapMode === 'spots' ? (
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

        {mapMode === 'user' ? (
          <View style={styles.previewCard}>
            <View style={styles.previewTop}>
              <View style={styles.previewIcon}>
                <Ionicons name="navigate-outline" size={20} color="#8b5cf6" />
              </View>
              <View style={styles.previewText}>
                <Text style={styles.previewName}>Current location</Text>
                <Text style={styles.previewMeta}>You are here</Text>
              </View>
            </View>

            <View style={styles.emptyNearby}>
              <Text style={styles.emptyTitle}>No Vesper spots near you yet</Text>
              <Text style={styles.emptyText}>Shanghai mock venues are available while this map is in preview.</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fffdfc' },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 150 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title: { color: '#111111', fontSize: 32, fontWeight: '900' },
  subtitle: { marginTop: 7, color: '#71717a', fontSize: 14, fontWeight: '600' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  spotsButton: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 13,
  },
  spotsButtonText: { color: '#7c3aed', fontSize: 12, fontWeight: '900' },
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
  mapHint: {
    marginBottom: 10,
    color: '#8b5cf6',
    fontSize: 12,
    fontWeight: '800',
  },
  mapCard: {
    height: 390,
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
  map: { flex: 1 },
  marker: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    borderWidth: 3,
    borderColor: '#ffffff',
    backgroundColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  markerVisited: {
    backgroundColor: '#ec4899',
    borderColor: '#f5d0fe',
    shadowColor: '#ec4899',
    shadowOpacity: 0.34,
    shadowRadius: 16,
  },
  markerSelected: { transform: [{ scale: 1.16 }] },
  userMarker: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#ffffff',
    backgroundColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  },
  messageBadge: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  messageText: { color: '#71717a', fontSize: 13, fontWeight: '800', textAlign: 'center' },
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
  emptyNearby: {
    marginTop: 16,
    borderRadius: 22,
    backgroundColor: '#f8f7fb',
    padding: 15,
  },
  emptyTitle: { color: '#18181b', fontSize: 15, fontWeight: '900' },
  emptyText: { marginTop: 5, color: '#71717a', fontSize: 13, lineHeight: 19, fontWeight: '600' },
});

import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Bar } from '../data/bars';
import { pushBarDetail } from '../lib/navigation';
import { getNearbyBars, importPoi, type PoiBar } from '../lib/pois';
import { useCheckInStore } from '../stores/checkInStore';

type MapCoordinate = {
  latitude: number;
  longitude: number;
};
type ValidMapBar = Bar & MapCoordinate;
type MapBar = Bar | PoiBar;

const shanghaiRegion: Region = {
  latitude: 31.2304,
  longitude: 121.4737,
  latitudeDelta: 0.055,
  longitudeDelta: 0.055,
};

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const visitedBarIds = useCheckInStore((state) => state.visitedBarIds);
  const [bars, setBars] = useState<MapBar[]>([]);
  const [selectedBar, setSelectedBar] = useState<MapBar | null>(null);
  const [userCoordinate, setUserCoordinate] = useState<MapCoordinate | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [importingPoiId, setImportingPoiId] = useState<string | null>(null);

  const validBars = useMemo<ValidMapBar[]>(
    () =>
      bars
        .map((bar) => ({
          ...bar,
          latitude: Number(bar.latitude),
          longitude: Number(bar.longitude),
        }))
        .filter((bar) => Number.isFinite(bar.latitude) && Number.isFinite(bar.longitude)),
    [bars],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadNearbyBars() {
      try {
        setIsLoading(true);
        setStatusMessage('');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED) {
          if (isMounted) {
            setBars([]);
            setStatusMessage('Location permission is needed to find nearby bars.');
          }
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const nextCoordinate = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        const nextBars = await getNearbyBars({
          lat: nextCoordinate.latitude,
          lng: nextCoordinate.longitude,
        });

        if (isMounted) {
          setUserCoordinate(nextCoordinate);
          setBars(nextBars);
          setStatusMessage(nextBars.length === 0 ? 'No nearby bars found.' : '');
          mapRef.current?.animateToRegion(
            {
              ...nextCoordinate,
              latitudeDelta: 0.035,
              longitudeDelta: 0.035,
            },
            650,
          );
        }
      } catch (error) {
        if (isMounted) {
          setBars([]);
          const message = error instanceof Error ? error.message : 'Unable to load nearby bars.';
          setStatusMessage(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadNearbyBars();

    return () => {
      isMounted = false;
    };
  }, []);

  const openBarDetails = async (bar: MapBar) => {
    if (!bar.id.startsWith('amap:')) {
      pushBarDetail(bar.id);
      return;
    }

    if (importingPoiId === bar.id) {
      return;
    }

    setImportingPoiId(bar.id);
    setStatusMessage('');

    try {
      const importedBar = await importPoi({
        externalId: bar.id.replace(/^amap:/, ''),
        name: bar.name,
        address: bar.neighborhood,
        latitude: bar.latitude,
        longitude: bar.longitude,
        category: bar.type,
        coverImage: bar.image,
      });
      pushBarDetail(importedBar.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to open details.';
      setStatusMessage(message);
    } finally {
      setImportingPoiId(null);
    }
  };

  const moveToUserLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== Location.PermissionStatus.GRANTED) {
      setStatusMessage('Location permission is needed to return to your position.');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const nextCoordinate = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    setUserCoordinate(nextCoordinate);
    setStatusMessage('');
    mapRef.current?.animateToRegion(
      {
        ...nextCoordinate,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      },
      650,
    );
  };

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={shanghaiRegion}
        moveOnMarkerPress={false}
        onPress={() => setSelectedBar(null)}
        pitchEnabled={false}
        rotateEnabled={false}
        showsCompass={false}
      >
        {validBars.map((bar) => (
          <Marker
            key={String(bar.id)}
            coordinate={{ latitude: bar.latitude, longitude: bar.longitude }}
            tracksViewChanges={false}
            pinColor={visitedBarIds.includes(bar.id) ? '#d9468f' : '#6d5df6'}
            onPress={(event) => {
              event.stopPropagation?.();

              if (selectedBar?.id === bar.id) {
                return;
              }

              setSelectedBar(bar);
            }}
          />
        ))}

        {userCoordinate ? (
          <Marker coordinate={userCoordinate} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <View style={styles.userMarker}>
              <Ionicons name="person" size={14} color="#ffffff" />
            </View>
          </Marker>
        ) : null}
      </MapView>

      <SafeAreaView pointerEvents="box-none" style={styles.overlay} edges={['top']}>
        <View style={styles.topControls}>
          <View style={styles.statusPill}>
            <Text style={styles.statusTitle}>Nearby bars</Text>
            <Text style={styles.statusSubtitle}>{isLoading ? 'Loading' : `${validBars.length} found`}</Text>
          </View>

          <Pressable style={styles.locationButton} onPress={moveToUserLocation}>
            <Ionicons name="locate" size={18} color="#111827" />
          </Pressable>
        </View>

        {statusMessage ? (
          <View style={styles.messageBadge}>
            <Text style={styles.messageText}>{statusMessage}</Text>
          </View>
        ) : null}
      </SafeAreaView>

      {selectedBar ? (
        <Pressable style={styles.previewCard} onPress={() => void openBarDetails(selectedBar)}>
          <View style={styles.previewImageWrap}>
            <Image source={{ uri: selectedBar.image }} style={styles.previewImage} />
          </View>

          <View style={styles.previewContent}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewName} numberOfLines={1}>
                {selectedBar.name}
              </Text>
              {visitedBarIds.includes(selectedBar.id) ? (
                <View style={styles.visitedBadge}>
                  <Ionicons name="sparkles" size={10} color="#ffffff" />
                </View>
              ) : null}
            </View>

            <Text style={styles.previewCategory} numberOfLines={1}>
              {selectedBar.type}
            </Text>
            <Text style={styles.previewAddress} numberOfLines={1}>
              {selectedBar.neighborhood}
            </Text>

            <View style={styles.previewMetaRow}>
              <Text style={styles.rating}>★ {selectedBar.rating}</Text>
              <Text style={styles.price}>{selectedBar.price}</Text>
            </View>

            <Pressable
              disabled={importingPoiId === selectedBar.id}
              style={[styles.detailsButton, importingPoiId === selectedBar.id && styles.detailsButtonDisabled]}
              onPress={(event) => {
                event.stopPropagation();
                void openBarDetails(selectedBar);
              }}
            >
              <Text style={styles.detailsButtonText}>{importingPoiId === selectedBar.id ? 'Opening...' : 'View details'}</Text>
              <Ionicons name="chevron-forward" size={14} color="#ffffff" />
            </Pressable>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const floatingShadow = {
  shadowColor: '#111827',
  shadowOpacity: 0.12,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 14 },
  elevation: 8,
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#eef0ed' },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  statusPill: {
    ...floatingShadow,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    backgroundColor: 'rgba(255,255,255,0.86)',
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  statusTitle: { color: '#111827', fontSize: 13, fontWeight: '900' },
  statusSubtitle: { marginTop: 1, color: '#71717a', fontSize: 10, fontWeight: '800' },
  locationButton: {
    ...floatingShadow,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  userMarker: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    borderWidth: 3,
    borderColor: '#ffffff',
    backgroundColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
  messageBadge: {
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...floatingShadow,
  },
  messageText: { color: '#52525b', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  previewCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 64,
    minHeight: 156,
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
    backgroundColor: 'rgba(255,255,255,0.94)',
    padding: 12,
    ...floatingShadow,
  },
  previewImageWrap: {
    width: 132,
    height: 132,
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#e4e4e7',
  },
  previewImage: { width: '100%', height: '100%' },
  previewContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingLeft: 13,
    paddingVertical: 2,
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewName: { flex: 1, color: '#111827', fontSize: 18, fontWeight: '900' },
  previewCategory: { marginTop: 4, color: '#52525b', fontSize: 13, fontWeight: '800' },
  previewAddress: { marginTop: 3, color: '#71717a', fontSize: 12, fontWeight: '700' },
  visitedBadge: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#7c3aed',
  },
  previewMetaRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  rating: { color: '#f59e0b', fontSize: 13, fontWeight: '900' },
  price: { flex: 1, color: '#27272a', fontSize: 12, fontWeight: '800' },
  detailsButton: {
    marginTop: 8,
    height: 38,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 19,
    backgroundColor: '#111827',
    paddingHorizontal: 14,
  },
  detailsButtonDisabled: { opacity: 0.68 },
  detailsButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
});

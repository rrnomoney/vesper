import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Bar } from '../data/bars';
import { getBarById } from '../lib/bars';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function PlaceMarker() {
  return (
    <View style={styles.marker}>
      <Ionicons name="wine" size={14} color="#ffffff" />
    </View>
  );
}

export default function PlaceMapScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const barId = firstParam(id);
  const [bar, setBar] = useState<Bar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadBar() {
      if (!barId || !/^\d+$/.test(barId)) {
        setBar(null);
        setErrorMessage('This place is not available on the map yet.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextBar = await getBarById(barId);
        if (!isMounted) {
          return;
        }

        if (!nextBar || !Number.isFinite(nextBar.latitude) || !Number.isFinite(nextBar.longitude)) {
          setBar(null);
          setErrorMessage('This place does not have a usable map location yet.');
          return;
        }

        setBar(nextBar);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setBar(null);
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load this place.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadBar();

    return () => {
      isMounted = false;
    };
  }, [barId]);

  const region = useMemo<Region | null>(() => {
    if (!bar) {
      return null;
    }

    return {
      latitude: Number(bar.latitude),
      longitude: Number(bar.longitude),
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    };
  }, [bar]);

  return (
    <View style={styles.screen}>
      {region && bar ? (
        <MapView
          style={StyleSheet.absoluteFillObject}
          initialRegion={region}
          pitchEnabled={false}
          rotateEnabled={false}
          showsCompass={false}
        >
          <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} tracksViewChanges={false} anchor={{ x: 0.5, y: 0.5 }}>
            <PlaceMarker />
          </Marker>
        </MapView>
      ) : (
        <View style={styles.state}>
          {isLoading ? <ActivityIndicator color="#7c3aed" /> : <Ionicons name="map-outline" size={28} color="#7c3aed" />}
          <Text style={styles.stateTitle}>{isLoading ? 'Opening map' : 'Map unavailable'}</Text>
          <Text style={styles.stateText}>{isLoading ? 'Centering this place.' : errorMessage}</Text>
        </View>
      )}

      <SafeAreaView edges={['top']} style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
      </SafeAreaView>

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
  state: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffaf5',
    paddingHorizontal: 28,
  },
  stateTitle: { marginTop: 12, color: '#111827', fontSize: 18, fontWeight: '900' },
  stateText: { marginTop: 6, color: '#71717a', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 18,
  },
  backButton: {
    ...floatingShadow,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  marker: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
});

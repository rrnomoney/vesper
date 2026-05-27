import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Bar } from '../data/bars';
import { getBarById } from '../lib/bars';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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
        setErrorMessage('This place is not available on the map yet.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextBar = await getBarById(barId);
        if (isMounted) {
          setBar(nextBar);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load this place.');
        }
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

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
      </View>

      <View style={styles.mapCard}>
        <View style={styles.grid}>
          <View style={styles.marker}>
            <Ionicons name="wine" size={16} color="#ffffff" />
          </View>
          <View style={styles.river} />
          <Text style={styles.mapLabel}>Place map</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color="#7c3aed" />
          <Text style={styles.stateText}>Opening this place.</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>Map unavailable</Text>
          <Text style={styles.stateText}>{errorMessage}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fffaf5', paddingHorizontal: 20 },
  topBar: { paddingTop: 8 },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#ffffff',
  },
  mapCard: {
    height: 390,
    marginTop: 18,
    overflow: 'hidden',
    borderRadius: 34,
    borderWidth: 1,
    borderColor: '#ffffff',
    backgroundColor: '#ede9fe',
  },
  grid: { flex: 1, position: 'relative', backgroundColor: '#f5f3ff' },
  river: {
    position: 'absolute',
    left: -40,
    right: -20,
    top: 170,
    height: 76,
    transform: [{ rotate: '-15deg' }],
    backgroundColor: 'rgba(196,181,253,0.55)',
  },
  marker: {
    position: 'absolute',
    left: '48%',
    top: '46%',
    zIndex: 2,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    borderWidth: 3,
    borderColor: '#ffffff',
    backgroundColor: '#dc2626',
  },
  mapLabel: { position: 'absolute', left: 22, bottom: 22, color: '#6d28d9', fontSize: 13, fontWeight: '900' },
  stateCard: { marginTop: 16, alignItems: 'center', borderRadius: 24, backgroundColor: '#ffffff', padding: 18 },
  stateTitle: { color: '#111827', fontSize: 16, fontWeight: '900' },
  stateText: { marginTop: 8, color: '#71717a', fontSize: 13, lineHeight: 19, textAlign: 'center' },
});

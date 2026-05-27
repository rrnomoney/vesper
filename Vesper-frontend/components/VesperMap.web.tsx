import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { featuredBars, homeCategories, type Bar } from '../data/bars';
import { getPrimaryBarTag, getRatingSummary } from '../lib/barDisplay';
import { filterBars } from '../lib/barFilters';
import { pushBarDetail } from '../lib/navigation';

const pins: ViewStyle[] = [
  { left: '28%', top: '38%' },
  { left: '58%', top: '29%' },
  { left: '47%', top: '58%' },
  { left: '72%', top: '47%' },
];
const webBars: Bar[] = featuredBars.map((bar, index) => ({ ...bar, id: String(index + 1) }));

function VesperMarker() {
  return (
    <View style={styles.markerInner}>
      <Ionicons name="wine" size={15} color="#ffffff" />
    </View>
  );
}

export default function VesperMap() {
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState(homeCategories[0]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filteredBars = useMemo(() => filterBars(webBars, searchText, activeCategory), [activeCategory, searchText]);
  const hasActiveFilter = searchText.trim().length > 0 || activeCategory !== homeCategories[0];

  const openBarDetails = (bar: Bar) => {
    pushBarDetail(bar.id);
  };

  const closeFilterSheet = () => {
    setIsFilterOpen(false);
    Keyboard.dismiss();
  };

  const closePreview = () => {
    setSelectedBar(null);
    Keyboard.dismiss();
  };

  const handleMapBlankPress = () => {
    if (isFilterOpen) {
      closeFilterSheet();
      return;
    }

    closePreview();
  };

  useEffect(() => {
    if (selectedBar && !filteredBars.some((bar) => bar.id === selectedBar.id)) {
      setSelectedBar(null);
    }
  }, [filteredBars, selectedBar]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Night map</Text>
            <Text style={styles.subtitle}>Explore nearby Vesper spots</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={[styles.iconButton, isFilterOpen && styles.iconButtonActive]}
              onPress={() => setIsFilterOpen((current) => !current)}
            >
              <Ionicons name="funnel-outline" size={18} color={hasActiveFilter || isFilterOpen ? '#7c3aed' : '#8b5cf6'} />
              {hasActiveFilter ? <View style={styles.filterDot} /> : null}
            </Pressable>
            <View style={styles.iconButton}>
              <Ionicons name="locate" size={18} color="#8b5cf6" />
            </View>
          </View>
        </View>

        {isFilterOpen ? (
          <View style={styles.filterSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filter places</Text>
              <Pressable style={styles.sheetCloseButton} onPress={() => setIsFilterOpen(false)}>
                <Ionicons name="close" size={17} color="#52525b" />
              </Pressable>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color="#a1a1aa" />
              <TextInput
                placeholder="Search bars or POIs"
                placeholderTextColor="#a1a1aa"
                value={searchText}
                onChangeText={setSearchText}
                style={styles.searchInput}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContent}>
              {homeCategories.map((category) => (
                <Pressable
                  key={category}
                  style={[styles.chip, category === activeCategory && styles.chipActive]}
                  onPress={() => setActiveCategory(category)}
                >
                  <Text style={[styles.chipText, category === activeCategory && styles.chipTextActive]}>{category}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <Text style={styles.mapHint}>{filteredBars.length}/{webBars.length} nearby bars</Text>

        <Pressable style={styles.mapCard} onPress={handleMapBlankPress}>
          <View style={styles.grid}>
            {isFilterOpen || selectedBar ? (
              <Pressable style={[styles.dismissOverlay, isFilterOpen && styles.filterDismissOverlay]} onPress={handleMapBlankPress} />
            ) : null}
            {pins.map((pin, index) => {
              const bar = filteredBars[index];

              if (!bar) {
                return null;
              }

              return (
                <Pressable
                  key={bar.id}
                  style={[styles.marker, pin, selectedBar?.id === bar?.id && styles.markerSelected]}
                  onPress={(event) => {
                    event.stopPropagation();

                    if (selectedBar?.id === bar.id) {
                      return;
                    }

                    setSelectedBar(bar);
                  }}
                >
                  <VesperMarker />
                </Pressable>
              );
            })}
            <View style={styles.river} />
            <Text style={styles.mapLabel}>Map preview</Text>
          </View>
        </Pressable>

        {selectedBar ? (
          <View style={styles.previewCard}>
            <View style={styles.previewTop}>
              <View style={styles.previewIcon}>
                <Ionicons name="wine-outline" size={20} color="#8b5cf6" />
              </View>
              <View style={styles.previewText}>
                <Text style={styles.previewName}>{selectedBar.name}</Text>
                <Text style={styles.previewMeta}>{getPrimaryBarTag(selectedBar)} - {selectedBar.neighborhood}</Text>
              </View>
            </View>

            <View style={styles.previewBottom}>
              <Text style={styles.rating}>{getRatingSummary(selectedBar, 'New').text}</Text>
              <Text style={styles.distance}>{selectedBar.distance}</Text>
            </View>

            <Pressable style={styles.detailsButton} onPress={() => openBarDetails(selectedBar)}>
              <Text style={styles.detailsButtonText}>View details</Text>
              <Ionicons name="chevron-forward" size={16} color="#ffffff" />
            </Pressable>
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
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#f5f3ff',
  },
  iconButtonActive: { backgroundColor: '#ede9fe' },
  filterDot: {
    position: 'absolute',
    right: 9,
    top: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#7c3aed',
  },
  filterSheet: {
    marginBottom: 16,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.94)',
    padding: 12,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  sheetHeader: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: { color: '#111827', fontSize: 15, fontWeight: '900' },
  sheetCloseButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#f4f4f5',
  },
  searchBox: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 15,
  },
  searchInput: { marginLeft: 9, flex: 1, color: '#18181b', fontSize: 14, fontWeight: '700' },
  chipContent: { flexDirection: 'row', gap: 10, paddingTop: 10, paddingRight: 6 },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.86)',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  chipActive: { borderColor: '#ddd6fe', backgroundColor: '#ede9fe' },
  chipText: { color: '#52525b', fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: '#7c3aed' },
  mapHint: { marginBottom: 12, color: '#a1a1aa', fontSize: 13, fontWeight: '700' },
  mapCard: {
    height: 360,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff',
    backgroundColor: '#ede9fe',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
  },
  grid: { flex: 1, position: 'relative', backgroundColor: '#f5f3ff' },
  dismissOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  filterDismissOverlay: { zIndex: 30 },
  river: {
    position: 'absolute',
    left: -40,
    right: -20,
    top: 152,
    height: 76,
    transform: [{ rotate: '-15deg' }],
    backgroundColor: 'rgba(196,181,253,0.55)',
  },
  marker: {
    position: 'absolute',
    width: 38,
    height: 38,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    borderWidth: 3,
    borderColor: '#ffffff',
    opacity: 0.85,
  },
  markerSelected: { opacity: 1, transform: [{ scale: 1.08 }] },
  mapLabel: { position: 'absolute', left: 22, bottom: 22, color: '#6d28d9', fontSize: 13, fontWeight: '900' },
  previewCard: { marginTop: 18, padding: 18, borderRadius: 28, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f4f4f5' },
  previewTop: { flexDirection: 'row', alignItems: 'center' },
  previewIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f3ff' },
  previewText: { flex: 1, marginLeft: 12 },
  previewName: { color: '#18181b', fontSize: 18, fontWeight: '900' },
  previewMeta: { marginTop: 4, color: '#71717a', fontSize: 13, fontWeight: '700' },
  previewBottom: { marginTop: 16, flexDirection: 'row', justifyContent: 'space-between' },
  rating: { color: '#27272a', fontWeight: '900' },
  distance: { color: '#8b5cf6', fontWeight: '900' },
  detailsButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8b5cf6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '900', marginRight: 6 },
});

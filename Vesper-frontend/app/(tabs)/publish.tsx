import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RatingPicker } from '../../components/RatingPicker';
import { usePostStore } from '../../stores/postStore';

const moodTags = ['Cocktail', 'Rooftop', 'Speakeasy', 'Live Music', 'Club', 'Date Night'];

export default function PublishScreen() {
  const addPost = usePostStore((state) => state.addPost);
  const [barName, setBarName] = useState('');
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [shared, setShared] = useState(false);

  const toggleTag = (tag: string) => {
    setShared(false);
    setSelectedTags((currentTags) =>
      currentTags.includes(tag) ? currentTags.filter((currentTag) => currentTag !== tag) : [...currentTags, tag],
    );
  };

  const handleShare = () => {
    // TODO: Later wire Publish to POST /api/reviews when bar selection uses backend IDs.
    addPost({
      id: `${Date.now()}`,
      placeName: barName.trim() || 'Untitled place',
      rating,
      tags: selectedTags,
      story: note.trim(),
      createdAt: new Date().toISOString(),
    });
    setShared(true);
  };

  const handleRatingPress = (star: number) => {
    setShared(false);
    setRating(star);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Share your night</Text>
          <Text style={styles.subtitle}>Capture a place, a mood, and a memory from tonight.</Text>
        </View>

        <Pressable style={styles.uploadCard} onPress={() => setShared(false)}>
          <View style={styles.uploadIcon}>
            <Ionicons name="image-outline" size={26} color="#8b5cf6" />
          </View>
          <Text style={styles.uploadTitle}>Add photos</Text>
          <Text style={styles.uploadText}>Photo picker coming soon</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.label}>Place</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="wine-outline" size={19} color="#a1a1aa" />
            <TextInput
              value={barName}
              onChangeText={(value) => {
                setShared(false);
                setBarName(value);
              }}
              placeholder="Enter bar name"
              placeholderTextColor="#a1a1aa"
              style={styles.input}
            />
          </View>

          <Text style={[styles.label, styles.sectionLabel]}>Rating</Text>
          <View style={styles.ratingRow}>
            <RatingPicker value={rating} onChange={handleRatingPress} />
          </View>

          <Text style={[styles.label, styles.sectionLabel]}>Vibe tags</Text>
          <View style={styles.tagGrid}>
            {moodTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);

              return (
                <Pressable key={tag} style={[styles.tag, isSelected && styles.tagActive]} onPress={() => toggleTag(tag)}>
                  <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>{tag}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, styles.sectionLabel]}>Story</Text>
          <TextInput
            value={note}
            onChangeText={(value) => {
              setShared(false);
              setNote(value);
            }}
            placeholder="Write something about this place"
            placeholderTextColor="#a1a1aa"
            multiline
            textAlignVertical="top"
            style={styles.textArea}
          />
        </View>

        {shared ? (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={22} color="#8b5cf6" />
            <Text style={styles.successText}>Shared successfully</Text>
          </View>
        ) : null}

        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share</Text>
          <Ionicons name="sparkles" size={18} color="#ffffff" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fffdfc' },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 150 },
  header: { marginBottom: 22 },
  title: { color: '#111111', fontSize: 32, fontWeight: '900' },
  subtitle: { marginTop: 8, color: '#71717a', fontSize: 14, lineHeight: 21, fontWeight: '600' },
  uploadCard: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#ede9fe',
    backgroundColor: '#ffffff',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.09,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  uploadIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    backgroundColor: '#f5f3ff',
  },
  uploadTitle: { marginTop: 14, color: '#18181b', fontSize: 18, fontWeight: '900' },
  uploadText: { marginTop: 5, color: '#a1a1aa', fontSize: 13, fontWeight: '700' },
  card: {
    marginTop: 18,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    padding: 18,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  label: { color: '#27272a', fontSize: 13, fontWeight: '900' },
  sectionLabel: { marginTop: 22 },
  inputWrap: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f8f7fb',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  input: { marginLeft: 10, flex: 1, color: '#18181b', fontSize: 15, fontWeight: '600' },
  ratingRow: { marginTop: 12, flexDirection: 'row', gap: 9 },
  tagGrid: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#f4f4f5',
    backgroundColor: '#fafafa',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tagActive: { borderColor: '#ddd6fe', backgroundColor: '#ede9fe' },
  tagText: { color: '#52525b', fontSize: 13, fontWeight: '800' },
  tagTextActive: { color: '#7c3aed' },
  textArea: {
    marginTop: 10,
    minHeight: 128,
    borderRadius: 22,
    backgroundColor: '#f8f7fb',
    color: '#18181b',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  successCard: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 22,
    backgroundColor: '#f5f3ff',
    paddingVertical: 14,
  },
  successText: { color: '#7c3aed', fontSize: 15, fontWeight: '900' },
  shareButton: {
    marginTop: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 28,
    backgroundColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  shareButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
});

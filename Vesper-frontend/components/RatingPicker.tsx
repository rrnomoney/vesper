import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

type RatingPickerProps = {
  value: number;
  onChange: (rating: number) => void;
  max?: number;
  size?: number;
  buttonSize?: number;
  gap?: number;
};

export function RatingPicker({ value, onChange, max = 5, size = 22, buttonSize = 44, gap = 9 }: RatingPickerProps) {
  function handleStarPress(star: number) {
    onChange(value === star ? star - 1 : star);
  }

  return (
    <View
      style={[styles.row, { gap }]}
      accessibilityRole="adjustable"
      accessibilityValue={{ min: 0, max, now: value }}
    >
      {Array.from({ length: max }, (_, index) => {
        const star = index + 1;
        const isSelected = star <= value;

        return (
          <Pressable
            key={star}
            hitSlop={8}
            onPress={() => handleStarPress(star)}
            style={[styles.starButton, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }, isSelected && styles.starButtonActive]}
          >
            <Ionicons name={isSelected ? 'star' : 'star-outline'} size={size} color="#f59e0b" />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignSelf: 'flex-start' },
  starButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  starButtonActive: { backgroundColor: '#fff7ed' },
});

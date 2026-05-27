import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import { Bar } from '../data/bars';
import { getPrimaryBarTag, getStarRatingDisplay, hasReliablePrice } from '../lib/barDisplay';

function StarRatingRow({ filledStars, text, hasReviews }: { filledStars: number; text: string; hasReviews: boolean }) {
  const [ratingText, countText] = text.match(/^(.+?)\s(\(.+\))$/)?.slice(1) ?? [text, ''];

  return (
    <View className="flex-row items-center">
      {hasReviews ? (
        <View className="mr-1 flex-row items-center">
          {[0, 1, 2, 3, 4].map((index) => (
            <Ionicons key={index} name={index < filledStars ? 'star' : 'star-outline'} size={12} color="#f59e0b" />
          ))}
        </View>
      ) : (
        <Ionicons name="sparkles-outline" size={12} color="#7c3aed" />
      )}
      <Text className={`ml-1 text-[12px] font-semibold ${hasReviews ? 'text-amber-500' : 'text-violet-600'}`}>{ratingText}</Text>
      {countText ? <Text className="ml-1 text-[11px] font-semibold text-zinc-400">{countText}</Text> : null}
    </View>
  );
}

export function BarCard({ bar }: { bar: Bar }) {
  const ratingDisplay = getStarRatingDisplay(bar, 'New');
  const primaryTag = getPrimaryBarTag(bar);

  return (
    <Pressable className="mb-4 flex-row overflow-hidden rounded-[24px] border border-white bg-white shadow-lg shadow-violet-100">
      <View className="relative h-[116px] w-[118px]">
        <Image source={{ uri: bar.image }} className="h-full w-full" resizeMode="cover" />
        <View className="absolute left-2 top-2 rounded-full bg-black/45 px-2.5 py-1">
          <Text className="text-[11px] font-semibold text-white">{bar.distance}</Text>
        </View>
      </View>

      <View className="flex-1 px-3.5 py-3">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <Text numberOfLines={1} className="text-[17px] font-semibold text-zinc-950">
              {bar.name}
            </Text>
            <Text numberOfLines={1} className="mt-1 text-[12px] text-zinc-500">
              {bar.neighborhood}
            </Text>
          </View>
          <View className="h-8 w-8 items-center justify-center rounded-full bg-zinc-50">
            <Ionicons
              name={bar.isSaved ? 'bookmark' : 'bookmark-outline'}
              size={17}
              color={bar.isSaved ? '#8b5cf6' : '#a1a1aa'}
            />
          </View>
        </View>

        <View className="mt-3 flex-row items-center">
          <View className="flex-row items-center rounded-full bg-violet-50 px-2.5 py-1">
            <StarRatingRow {...ratingDisplay} />
          </View>
        </View>

        <View className="mt-auto flex-row items-center justify-between">
          <Text className="text-[12px] text-zinc-400">Avg. spend</Text>
          <Text className="text-[13px] font-semibold text-zinc-900">{hasReliablePrice(bar) ? bar.price : primaryTag}</Text>
        </View>
      </View>
    </Pressable>
  );
}

import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Extraction } from '@/types';
import { getQuickSummary } from '@/services/recommendationService';
import { round1 } from '@/utils/numbers';

interface ExtractionRowProps {
  extraction: Extraction;
  onPress: () => void;
}

export default function ExtractionRow({ extraction, onPress }: ExtractionRowProps) {
  const {
    coffeeName,
    coffeeSeller,
    gramsIn,
    yieldGrams,
    timeSeconds,
    ratio,
    rating,
    recommendation,
    date,
  } =
    extraction;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Pressable onPress={onPress} className="bg-zinc-900 rounded-xl p-4 mb-2">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-white font-medium text-sm flex-1" numberOfLines={1}>
          {coffeeName}
        </Text>
        <Text className="text-zinc-500 text-xs">{formattedDate}</Text>
      </View>
      <Text className="text-zinc-500 text-xs mb-1.5" numberOfLines={1}>
        {coffeeSeller}
      </Text>

      <View className="flex-row items-center gap-3 mb-1">
        <Text className="text-zinc-300 text-sm">
          {round1(gramsIn)}g → {round1(yieldGrams)}g
        </Text>
        <Text className="text-zinc-500 text-xs">|</Text>
        <Text className="text-zinc-300 text-sm">{timeSeconds}s</Text>
        <Text className="text-zinc-500 text-xs">|</Text>
        <Text className="text-amber-500 text-sm font-medium">{round1(ratio)}:1</Text>
      </View>

      <View className="flex-row items-center justify-between">
        {rating ? (
          <View className="flex-row items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Ionicons
                key={i}
                name={i < rating ? 'star' : 'star-outline'}
                size={12}
                color={i < rating ? '#F59E0B' : '#555'}
              />
            ))}
          </View>
        ) : (
          <Text className="text-zinc-600 text-xs">No rating</Text>
        )}
        {recommendation && (
          <Text className="text-zinc-500 text-xs" numberOfLines={1}>
            {getQuickSummary(recommendation)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Coffee } from '@/types';

interface CoffeeCardProps {
  coffee: Coffee;
  shotCount: number;
  onPress: () => void;
}

export default function CoffeeCard({ coffee, shotCount, onPress }: CoffeeCardProps) {
  const { name, remaining, boughtGrams, isActive } = coffee;
  const percentage = boughtGrams > 0 ? Math.max(0, Math.min(100, (remaining / boughtGrams) * 100)) : 0;

  return (
    <Pressable onPress={onPress} className="bg-zinc-900 rounded-2xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2 flex-1">
          <View
            className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-zinc-600'}`}
          />
          <Text className="text-white font-semibold text-base" numberOfLines={1}>
            {name}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#666" />
      </View>

      <View className="h-2 bg-zinc-800 rounded-full mb-2 overflow-hidden">
        <View
          className={`h-full rounded-full ${
            percentage > 30 ? 'bg-amber-600' : percentage > 10 ? 'bg-orange-500' : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </View>

      <View className="flex-row justify-between">
        <Text className="text-zinc-400 text-sm">
          {Math.round(remaining)}g remaining
        </Text>
        <Text className="text-zinc-500 text-sm">
          {shotCount} shot{shotCount !== 1 ? 's' : ''}
        </Text>
      </View>
    </Pressable>
  );
}

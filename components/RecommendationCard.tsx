import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Recommendation } from '@/types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onDismiss: () => void;
}

const adjustIcon = {
  coarser: 'arrow-up-circle' as const,
  finer: 'arrow-down-circle' as const,
  shorter: 'remove-circle' as const,
  longer: 'add-circle' as const,
  more: 'add-circle' as const,
  less: 'remove-circle' as const,
  same: 'checkmark-circle' as const,
};

const adjustColor = {
  coarser: '#F59E0B',
  finer: '#3B82F6',
  shorter: '#F59E0B',
  longer: '#3B82F6',
  more: '#10B981',
  less: '#EF4444',
  same: '#6B7280',
};

export default function RecommendationCard({
  recommendation,
  onDismiss,
}: RecommendationCardProps) {
  const { adjustGrind, adjustTime, adjustDose, reason, severity } = recommendation;

  return (
    <View className="bg-zinc-800 rounded-2xl p-5 mx-4 mt-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Ionicons
            name="bulb"
            size={20}
            color={severity === 'major' ? '#EF4444' : '#F59E0B'}
          />
          <Text className="text-white font-bold text-base">Recommendation</Text>
        </View>
        <View
          className={`px-2.5 py-1 rounded-full ${
            severity === 'major' ? 'bg-red-900' : 'bg-amber-900'
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              severity === 'major' ? 'text-red-300' : 'text-amber-300'
            }`}
          >
            {severity}
          </Text>
        </View>
      </View>

      <Text className="text-zinc-300 text-sm mb-4 leading-5">{reason}</Text>

      <View className="flex-row gap-4 mb-4">
        <AdjustBadge label="Grind" value={adjustGrind} />
        <AdjustBadge label="Time" value={adjustTime} />
        <AdjustBadge label="Dose" value={adjustDose} />
      </View>

      <Pressable onPress={onDismiss} className="py-2">
        <Text className="text-zinc-500 text-center text-sm">Dismiss</Text>
      </Pressable>
    </View>
  );
}

function AdjustBadge({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 bg-zinc-900 rounded-xl p-3 items-center">
      <Ionicons
        name={adjustIcon[value as keyof typeof adjustIcon] ?? 'help-circle'}
        size={22}
        color={adjustColor[value as keyof typeof adjustColor] ?? '#6B7280'}
      />
      <Text className="text-zinc-500 text-xs mt-1">{label}</Text>
      <Text className="text-white text-sm font-medium capitalize">{value}</Text>
    </View>
  );
}

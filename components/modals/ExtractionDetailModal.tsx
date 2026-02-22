import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Extraction } from '@/types';
import RecommendationCard from '@/components/RecommendationCard';
import { round1 } from '@/utils/numbers';

interface ExtractionDetailModalProps {
  visible: boolean;
  extraction: Extraction | null;
  onDismiss: () => void;
  onDelete?: (id: string) => void;
}

export default function ExtractionDetailModal({
  visible,
  extraction,
  onDismiss,
  onDelete,
}: ExtractionDetailModalProps) {
  if (!extraction) return null;

  const formattedDate = new Date(extraction.date).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable className="flex-1 bg-black/60" onPress={onDismiss} />
      <View className="bg-zinc-900 rounded-t-3xl px-6 pt-6 pb-10 max-h-[85%]">
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text className="text-xl font-bold text-white mb-1 text-center">
            {extraction.coffeeName}
          </Text>
          <Text className="text-zinc-500 text-sm mb-5 text-center">{formattedDate}</Text>

          <View className="bg-zinc-800 rounded-xl p-4 mb-4">
            <Row label="Grams In" value={`${round1(extraction.gramsIn)}g`} />
            <Row label="Yield" value={`${round1(extraction.yieldGrams)}g`} />
            <Row label="Ratio" value={`${round1(extraction.ratio)}:1`} />
            <Row label="Time" value={`${extraction.timeSeconds}s`} />
            <Row label="Grinder" value={extraction.grinderSetting ? round1(parseFloat(extraction.grinderSetting)).toString() : '—'} />
          </View>

          {extraction.rating && (
            <View className="flex-row items-center gap-2 mb-4 justify-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < extraction.rating! ? 'star' : 'star-outline'}
                  size={24}
                  color={i < extraction.rating! ? '#F59E0B' : '#555'}
                />
              ))}
            </View>
          )}

          {extraction.notes && (
            <View className="bg-zinc-800 rounded-xl p-4 mb-4">
              <Text className="text-zinc-400 text-xs mb-1">Notes</Text>
              <Text className="text-white text-sm">{extraction.notes}</Text>
            </View>
          )}

          {extraction.recommendation && (
            <RecommendationCard
              recommendation={extraction.recommendation}
              onDismiss={() => {}}
            />
          )}

          {onDelete && (
            <Pressable
              onPress={() => {
                onDelete(extraction.id);
                onDismiss();
              }}
              className="mt-4 py-3"
            >
              <Text className="text-red-500 text-center text-sm">Delete Extraction</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className="text-zinc-400 text-sm">{label}</Text>
      <Text className="text-white text-sm font-medium">{value}</Text>
    </View>
  );
}

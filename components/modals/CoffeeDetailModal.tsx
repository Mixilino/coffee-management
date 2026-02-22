import { useState, useMemo } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Coffee, Extraction } from '@/types';
import { getSuggestedSettingsForCoffee } from '@/services/recommendationService';
import { round1 } from '@/utils/numbers';

interface CoffeeDetailModalProps {
  visible: boolean;
  coffee: Coffee | null;
  shotCount: number;
  extractions: Extraction[];
  onRestockClick: () => void;
  onAdjustClick: () => void;
  onDismiss: () => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className="text-zinc-400 text-sm">{label}</Text>
      <Text className="text-white text-sm font-medium">{value}</Text>
    </View>
  );
}

export default function CoffeeDetailModal({
  visible,
  coffee,
  shotCount,
  extractions,
  onRestockClick,
  onAdjustClick,
  onDismiss,
}: CoffeeDetailModalProps) {
  const [showAllExtractions, setShowAllExtractions] = useState(false);
  const displayed = showAllExtractions ? extractions : extractions.slice(0, 5);

  const suggestedSettings = useMemo(
    () => (coffee ? getSuggestedSettingsForCoffee(coffee.id, extractions) : null),
    [coffee, extractions]
  );

  if (!coffee) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <Pressable className="flex-1 bg-black/60" onPress={onDismiss} />
      <View className="bg-zinc-900 rounded-t-3xl px-6 pt-6 pb-10 max-h-[80%]">
        <Text className="text-xl font-bold text-white mb-4 text-center">
          {coffee.name}
        </Text>

        <View className="bg-zinc-800 rounded-xl p-4 mb-4">
          <Row label="Total bought" value={`${round1(coffee.boughtGrams)}g`} />
          <Row label="Used" value={`${round1(coffee.usedGrams)}g`} />
          <Row label="Remaining" value={`${round1(coffee.remaining)}g`} />
          <Row
            label="Manual offset"
            value={`${coffee.manualOffset >= 0 ? '+' : ''}${round1(coffee.manualOffset)}g`}
          />
          <Row label="Total shots" value={`${shotCount}`} />
        </View>

        <View className="flex-row gap-3 mb-4">
          <Pressable onPress={onRestockClick} className="flex-1 bg-zinc-800 py-3 rounded-xl">
            <Text className="text-amber-500 text-center font-medium">Restock</Text>
          </Pressable>
          <Pressable onPress={onAdjustClick} className="flex-1 bg-zinc-800 py-3 rounded-xl">
            <Text className="text-amber-500 text-center font-medium">Adjust</Text>
          </Pressable>
        </View>

        {suggestedSettings ? (
          <View className="mb-4 bg-amber-900/30 rounded-xl p-3 border border-amber-700/50">
            <Text className="text-amber-500 font-semibold text-xs mb-1">Suggested for next shot</Text>
            <Text className="text-zinc-300 text-sm">
              Grind {suggestedSettings.grinderSetting} · {suggestedSettings.gramsIn}g in · ~
              {suggestedSettings.timeSeconds}s · {suggestedSettings.ratio}:1
            </Text>
          </View>
        ) : (
          <View className="mb-4 bg-zinc-800/50 rounded-xl p-3 border border-zinc-700">
            <Text className="text-zinc-500 text-sm">No extraction history — use your usual starting point.</Text>
          </View>
        )}

        {extractions.length > 0 && (
          <View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-zinc-400 text-sm">
                {showAllExtractions ? 'All Extractions' : 'Last 5 Extractions'}
              </Text>
              <Pressable
                onPress={() => setShowAllExtractions((v) => !v)}
                className="px-3 py-1.5 rounded-full bg-zinc-800"
              >
                <Text className="text-amber-500 text-xs">
                  {showAllExtractions ? 'Show last 5' : 'Show all'}
                </Text>
              </Pressable>
            </View>
            <ScrollView className={showAllExtractions ? 'max-h-64' : 'max-h-48'}>
              {displayed.map((e) => (
                <View key={e.id} className="bg-zinc-800 rounded-lg p-3 mb-2">
                  <View className="flex-row justify-between">
                    <Text className="text-white text-sm">
                      {round1(e.gramsIn)}g → {round1(e.yieldGrams)}g ({round1(e.ratio)}:1)
                    </Text>
                    <Text className="text-zinc-500 text-xs">
                      {new Date(e.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2 mt-1">
                    <Text className="text-zinc-400 text-xs">{e.timeSeconds}s</Text>
                    {e.rating && (
                      <View className="flex-row items-center gap-0.5">
                        {Array.from({ length: e.rating }).map((_, i) => (
                          <Ionicons key={i} name="star" size={10} color="#F59E0B" />
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

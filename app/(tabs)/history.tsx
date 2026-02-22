import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useExtractions, useDeleteExtraction } from '@/stores/extractionStore';
import { useCoffees } from '@/stores/coffeeStore';
import ExtractionRow from '@/components/ExtractionRow';
import ExtractionDetailModal from '@/components/modals/ExtractionDetailModal';
import type { Extraction } from '@/types';

type DateRangeKey = 'all' | '7' | '30';

export default function HistoryScreen() {
  const extractions = useExtractions();
  const coffees = useCoffees();
  const deleteExtraction = useDeleteExtraction();

  const [filterCoffeeId, setFilterCoffeeId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeKey>('all');
  const [selectedExtraction, setSelectedExtraction] = useState<Extraction | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const coffeeNames = useMemo(() => {
    const ids = new Set(extractions.map((e) => e.coffeeId));
    return coffees.filter((c) => ids.has(c.id));
  }, [coffees, extractions]);

  const filtered = useMemo(() => {
    let list = [...extractions].reverse();
    if (filterCoffeeId) {
      list = list.filter((e) => e.coffeeId === filterCoffeeId);
    }
    if (dateRange !== 'all') {
      const days = parseInt(dateRange, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      cutoff.setHours(0, 0, 0, 0);
      list = list.filter((e) => new Date(e.date) >= cutoff);
    }
    return list;
  }, [extractions, filterCoffeeId, dateRange]);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <Text className="text-2xl font-bold text-white px-4 mt-4 mb-3">History</Text>

      <View className="px-4 mb-3">
        <Text className="text-zinc-400 text-xs mb-1.5">Date range</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row gap-2">
            {(['all', '7', '30'] as const).map((key) => (
              <Pressable
                key={key}
                onPress={() => setDateRange(key)}
                className={`px-4 py-2 rounded-full ${
                  dateRange === key ? 'bg-amber-700' : 'bg-zinc-800'
                }`}
              >
                <Text className="text-white text-sm">
                  {key === 'all' ? 'All' : `Last ${key} days`}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {coffeeNames.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 mb-3 max-h-10"
        >
          <View className="flex-row gap-2">
            <Text className="text-zinc-400 text-xs mr-1 self-center">Coffee:</Text>
            <Pressable
              onPress={() => setFilterCoffeeId(null)}
              className={`px-4 py-2 rounded-full ${
                !filterCoffeeId ? 'bg-amber-700' : 'bg-zinc-800'
              }`}
            >
              <Text className="text-white text-sm">All</Text>
            </Pressable>
            {coffeeNames.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setFilterCoffeeId(c.id === filterCoffeeId ? null : c.id)}
                className={`px-4 py-2 rounded-full ${
                  filterCoffeeId === c.id ? 'bg-amber-700' : 'bg-zinc-800'
                }`}
              >
                <Text className="text-white text-sm">{c.name}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      <ScrollView className="flex-1 px-4">
        {filtered.length === 0 ? (
          <View className="bg-zinc-900 rounded-2xl p-8 items-center mt-4">
            <Ionicons name="time-outline" size={48} color="#666" />
            <Text className="text-zinc-400 mt-3 text-center text-base">
              No extractions yet. Pull your first shot in the Extract tab!
            </Text>
          </View>
        ) : (
          filtered.map((e) => (
            <ExtractionRow
              key={e.id}
              extraction={e}
              onPress={() => {
                setSelectedExtraction(e);
                setShowDetail(true);
              }}
            />
          ))
        )}
        <View className="h-8" />
      </ScrollView>

      <ExtractionDetailModal
        visible={showDetail}
        extraction={selectedExtraction}
        onDismiss={() => setShowDetail(false)}
        onDelete={deleteExtraction}
      />
    </SafeAreaView>
  );
}

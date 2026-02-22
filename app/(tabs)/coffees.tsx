import { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import {
  useCoffees,
  useCoffeeById,
  useAddCoffee,
  useRestockCoffee,
  useAdjustActualAmount,
} from '@/stores/coffeeStore';
import { useExtractions } from '@/stores/extractionStore';
import CoffeeCard from '@/components/CoffeeCard';
import AddCoffeeModal from '@/components/modals/AddCoffeeModal';
import CoffeeDetailModal from '@/components/modals/CoffeeDetailModal';
import RestockModal from '@/components/modals/RestockModal';
import AdjustModal from '@/components/modals/AdjustModal';

export default function CoffeesScreen() {
  const coffees = useCoffees();
  const extractions = useExtractions();
  const addCoffee = useAddCoffee();
  const restockCoffee = useRestockCoffee();
  const adjustActualAmount = useAdjustActualAmount();

  const [showAdd, setShowAdd] = useState(false);
  const [selectedCoffeeId, setSelectedCoffeeId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);

  const selectedCoffee = useCoffeeById(selectedCoffeeId ?? '') ?? null;

  const sorted = useMemo(
    () => [...coffees].sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1)),
    [coffees]
  );

  const shotCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of extractions) {
      map[e.coffeeId] = (map[e.coffeeId] ?? 0) + 1;
    }
    return map;
  }, [extractions]);

  const coffeeExtractions = useMemo(
    () =>
      selectedCoffeeId
        ? extractions.filter((e) => e.coffeeId === selectedCoffeeId).reverse()
        : [],
    [selectedCoffeeId, extractions]
  );

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <View className="flex-row items-center justify-between px-4 mt-4 mb-4">
        <Text className="text-2xl font-bold text-white">Coffees</Text>
        <Link href="/settings" asChild>
          <Pressable className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center">
            <Ionicons name="settings-outline" size={20} color="#999" />
          </Pressable>
        </Link>
      </View>

      <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
        {sorted.length === 0 ? (
          <View className="bg-zinc-900 rounded-2xl p-8 items-center mt-4">
            <Ionicons name="bag-outline" size={48} color="#666" />
            <Text className="text-zinc-400 mt-3 text-center text-base">
              No coffees yet. Tap + to add your first bag.
            </Text>
          </View>
        ) : (
          sorted.map((c) => (
            <CoffeeCard
              key={c.id}
              coffee={c}
              shotCount={shotCountMap[c.id] ?? 0}
              onPress={() => {
                setSelectedCoffeeId(c.id);
                setShowDetail(true);
              }}
            />
          ))
        )}
        <View className="h-24" />
      </ScrollView>

      <Pressable
        onPress={() => setShowAdd(true)}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-amber-700 items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      <AddCoffeeModal
        visible={showAdd}
        onAdd={(name, grams) => addCoffee(name, grams)}
        onDismiss={() => setShowAdd(false)}
      />

      <CoffeeDetailModal
        visible={showDetail}
        coffee={selectedCoffee}
        shotCount={selectedCoffeeId ? shotCountMap[selectedCoffeeId] ?? 0 : 0}
        extractions={coffeeExtractions}
        onRestockClick={() => {
          setShowDetail(false);
          setTimeout(() => setShowRestock(true), 300);
        }}
        onAdjustClick={() => {
          setShowDetail(false);
          setTimeout(() => setShowAdjust(true), 300);
        }}
        onDismiss={() => setShowDetail(false)}
      />

      <RestockModal
        visible={showRestock}
        coffee={selectedCoffee}
        onRestock={(mode, amount) => {
          if (selectedCoffeeId) {
            restockCoffee(selectedCoffeeId, mode, amount);
          }
          setShowRestock(false);
        }}
        onDismiss={() => setShowRestock(false)}
      />

      <AdjustModal
        visible={showAdjust}
        coffee={selectedCoffee}
        onAdjust={(actualGrams, reason) => {
          if (selectedCoffeeId) {
            adjustActualAmount(selectedCoffeeId, actualGrams, reason);
          }
          setShowAdjust(false);
        }}
        onDismiss={() => setShowAdjust(false)}
      />
    </SafeAreaView>
  );
}

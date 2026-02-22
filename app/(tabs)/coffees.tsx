import { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
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
import RestockModal from '@/components/RestockModal';
import AdjustModal from '@/components/AdjustModal';

export default function CoffeesScreen() {
  const coffees = useCoffees();
  const extractions = useExtractions();
  const addCoffee = useAddCoffee();
  const restockCoffee = useRestockCoffee();
  const adjustActualAmount = useAdjustActualAmount();

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGrams, setNewGrams] = useState('');

  const [selectedCoffeeId, setSelectedCoffeeId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showAllExtractions, setShowAllExtractions] = useState(false);

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

  const displayedExtractions = showAllExtractions ? coffeeExtractions : coffeeExtractions.slice(0, 5);

  const handleAddCoffee = () => {
    const grams = parseFloat(newGrams);
    if (!newName.trim() || isNaN(grams) || grams <= 0) {
      Alert.alert('Invalid input', 'Enter a name and valid gram amount.');
      return;
    }
    addCoffee(newName.trim(), grams);
    setNewName('');
    setNewGrams('');
    setShowAdd(false);
  };

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
                setShowAllExtractions(false);
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

      {/* Add Coffee Modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <Pressable className="flex-1 bg-black/60" onPress={() => setShowAdd(false)} />
        <View className="bg-zinc-900 rounded-t-3xl px-6 pt-6 pb-10">
          <Text className="text-xl font-bold text-white mb-5 text-center">Add Coffee</Text>
          <TextInput
            placeholder="Coffee name"
            placeholderTextColor="#666"
            value={newName}
            onChangeText={setNewName}
            className="bg-zinc-800 rounded-xl px-4 py-3 text-white mb-4"
          />
          <TextInput
            placeholder="Bag size (grams)"
            placeholderTextColor="#666"
            value={newGrams}
            onChangeText={setNewGrams}
            keyboardType="decimal-pad"
            className="bg-zinc-800 rounded-xl px-4 py-3 text-white mb-5"
          />
          <Pressable onPress={handleAddCoffee} className="bg-amber-700 py-4 rounded-xl">
            <Text className="text-white font-bold text-center text-base">Add Coffee</Text>
          </Pressable>
        </View>
      </Modal>

      {/* Coffee Detail Modal */}
      <Modal
        visible={showDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetail(false)}
      >
        <Pressable className="flex-1 bg-black/60" onPress={() => setShowDetail(false)} />
        <View className="bg-zinc-900 rounded-t-3xl px-6 pt-6 pb-10 max-h-[80%]">
          {selectedCoffee && (
            <>
              <Text className="text-xl font-bold text-white mb-4 text-center">
                {selectedCoffee.name}
              </Text>

              <View className="bg-zinc-800 rounded-xl p-4 mb-4">
                <Row label="Total bought" value={`${Math.round(selectedCoffee.boughtGrams)}g`} />
                <Row label="Used" value={`${Math.round(selectedCoffee.usedGrams)}g`} />
                <Row label="Remaining" value={`${Math.round(selectedCoffee.remaining)}g`} />
                <Row
                  label="Manual offset"
                  value={`${selectedCoffee.manualOffset >= 0 ? '+' : ''}${Math.round(selectedCoffee.manualOffset)}g`}
                />
                <Row label="Total shots" value={`${shotCountMap[selectedCoffee.id] ?? 0}`} />
              </View>

              <View className="flex-row gap-3 mb-4">
                <Pressable
                  onPress={() => {
                    setShowDetail(false);
                    setTimeout(() => setShowRestock(true), 300);
                  }}
                  className="flex-1 bg-zinc-800 py-3 rounded-xl"
                >
                  <Text className="text-amber-500 text-center font-medium">Restock</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowDetail(false);
                    setTimeout(() => setShowAdjust(true), 300);
                  }}
                  className="flex-1 bg-zinc-800 py-3 rounded-xl"
                >
                  <Text className="text-amber-500 text-center font-medium">Adjust</Text>
                </Pressable>
              </View>

              {coffeeExtractions.length > 0 && (
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
                    {displayedExtractions.map((e) => (
                      <View key={e.id} className="bg-zinc-800 rounded-lg p-3 mb-2">
                        <View className="flex-row justify-between">
                          <Text className="text-white text-sm">
                            {e.gramsIn}g → {e.yieldGrams}g ({e.ratio}:1)
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
            </>
          )}
        </View>
      </Modal>

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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className="text-zinc-400 text-sm">{label}</Text>
      <Text className="text-white text-sm font-medium">{value}</Text>
    </View>
  );
}

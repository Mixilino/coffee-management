import RatingModal from '@/components/modals/RatingModal';
import RecommendationCard from '@/components/RecommendationCard';
import Stopwatch from '@/components/Stopwatch';
import { useActiveCoffees } from '@/stores/coffeeStore';
import {
  useAddExtraction,
  useAddRatingAndNotes,
  useExtractionById,
  useExtractions,
} from '@/stores/extractionStore';
import { getSuggestedSettingsForCoffee } from '@/services/recommendationService';
import { round1 } from '@/utils/numbers';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, useEffect } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GRAMS_SMALL_STEP = 0.1;
const GRAMS_LARGE_STEP = 0.5;
const YIELD_STEP = 0.5;
const DEFAULT_GRINDER_SETTING = 15;
const DEFAULT_GRAMS_IN = 18;
const DEFAULT_YIELD_GRAMS = 36;

export default function ExtractScreen() {
  const activeCoffees = useActiveCoffees();
  const extractions = useExtractions();
  const addExtraction = useAddExtraction();
  const addRatingAndNotes = useAddRatingAndNotes();

  const [selectedCoffeeId, setSelectedCoffeeId] = useState<string | null>(null);
  const [gramsIn, setGramsIn] = useState(DEFAULT_GRAMS_IN);
  const [grinderSetting, setGrinderSetting] = useState(DEFAULT_GRINDER_SETTING);
  const [timeMode, setTimeMode] = useState<'stopwatch' | 'manual'>('stopwatch');
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [manualTime, setManualTime] = useState('');
  const [yieldGrams, setYieldGrams] = useState(DEFAULT_YIELD_GRAMS);

  const [showRating, setShowRating] = useState(false);
  const [lastExtractionId, setLastExtractionId] = useState<string | null>(null);

  const lastExtraction = useExtractionById(lastExtractionId ?? '');
  const recommendation = lastExtraction?.recommendation ?? null;

  const selectedCoffee = useMemo(
    () => activeCoffees.find((c) => c.id === selectedCoffeeId),
    [activeCoffees, selectedCoffeeId]
  );

  const suggestedSettings = useMemo(
    () => (selectedCoffeeId ? getSuggestedSettingsForCoffee(selectedCoffeeId, extractions) : null),
    [selectedCoffeeId, extractions]
  );

  useEffect(() => {
    if (!selectedCoffeeId) return;
    const s = getSuggestedSettingsForCoffee(selectedCoffeeId, extractions);
    if (s) {
      setGramsIn(round1(s.gramsIn));
      const g = parseFloat(s.grinderSetting);
      if (!isNaN(g)) setGrinderSetting(round1(g));
      setYieldGrams(round1(s.gramsIn * s.ratio));
      setManualTime(s.timeSeconds.toString());
      setTimeSeconds(0);
    }
  }, [selectedCoffeeId]);

  const ratio = gramsIn > 0 ? round1(yieldGrams / gramsIn).toFixed(1) : '0.0';
  const effectiveTime = timeMode === 'manual' ? parseInt(manualTime, 10) || 0 : timeSeconds;

  const canLog = selectedCoffeeId && gramsIn > 0 && effectiveTime > 0 && yieldGrams > 0;

  const handleLog = () => {
    Keyboard.dismiss();
    if (!selectedCoffee) {
      Alert.alert('Select a coffee', 'Please select a coffee before logging.');
      return;
    }

    const id = addExtraction({
      coffeeId: selectedCoffee.id,
      coffeeName: selectedCoffee.name,
      gramsIn,
      grinderSetting: round1(grinderSetting).toString(),
      timeSeconds: effectiveTime,
      yieldGrams,
      date: new Date().toISOString(),
    });

    setLastExtractionId(id);
    setShowRating(true);
  };

  const handleRatingSave = (rating: number, notes?: string) => {
    if (!lastExtractionId) return;
    addRatingAndNotes(lastExtractionId, rating, notes);
    setShowRating(false);
  };

  const resetForm = () => {
    setGramsIn(18);
    setGrinderSetting(2.5);
    setTimeSeconds(0);
    setManualTime('');
    setYieldGrams(36);
    setLastExtractionId(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
          <Text className="text-2xl font-bold text-white mt-4 mb-5">New Extraction</Text>

          {activeCoffees.length === 0 ? (
            <View className="bg-zinc-900 rounded-2xl p-6 items-center mb-5">
              <Ionicons name="cafe-outline" size={40} color="#666" />
              <Text className="text-zinc-400 mt-3 text-center">
                No coffees yet. Add one in the Coffees tab to start logging shots.
              </Text>
            </View>
          ) : (
            <View className="mb-5">
              <Text className="text-zinc-400 text-sm mb-2">Coffee</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {activeCoffees.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => setSelectedCoffeeId(c.id)}
                      className={`px-4 py-2.5 rounded-full ${
                        selectedCoffeeId === c.id ? 'bg-amber-700' : 'bg-zinc-800'
                      }`}
                    >
                      <Text className="text-white text-sm">
                        {c.name}{' '}
                        <Text className="text-zinc-400">({round1(c.remaining)}g)</Text>
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {selectedCoffee && suggestedSettings && (
            <View className="mb-5 bg-amber-900/30 rounded-2xl p-4 border border-amber-700/50">
              <Text className="text-amber-500 font-semibold text-sm mb-1">
                Suggested for {selectedCoffee.name}
              </Text>
              <Text className="text-zinc-300 text-sm">
                Grind {round1(parseFloat(suggestedSettings.grinderSetting) || 0)} · {round1(suggestedSettings.gramsIn)}g in · ~
                {suggestedSettings.timeSeconds}s · {round1(suggestedSettings.ratio)}:1
              </Text>
              <Text className="text-zinc-500 text-xs mt-1">From your last shot with this coffee</Text>
            </View>
          )}

          {selectedCoffee && !suggestedSettings && (
            <View className="mb-5 bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700">
              <Text className="text-zinc-400 text-sm">
                No history for {selectedCoffee.name} yet — use your usual starting point.
              </Text>
            </View>
          )}

          <View className="mb-5">
            <Text className="text-zinc-400 text-sm mb-2">Grams In</Text>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => setGramsIn((v) => round1(Math.max(0, v - GRAMS_LARGE_STEP)))}
                className="w-12 h-11 rounded-xl bg-zinc-800 items-center justify-center"
              >
                <Text className="text-white font-medium text-sm">−{GRAMS_LARGE_STEP}</Text>
              </Pressable>
              <Pressable
                onPress={() => setGramsIn((v) => round1(Math.max(0, v - GRAMS_SMALL_STEP)))}
                className="w-12 h-11 rounded-xl bg-zinc-800 items-center justify-center"
              >
                <Text className="text-white font-medium text-sm">−{GRAMS_SMALL_STEP}</Text>
              </Pressable>
              <TextInput
                value={round1(gramsIn).toString()}
                onChangeText={(t) => setGramsIn(round1(parseFloat(t) || 0))}
                keyboardType="decimal-pad"
                className="flex-1 bg-zinc-800 rounded-xl px-4 py-3 text-white text-center text-lg min-w-0"
              />
              <Pressable
                onPress={() => setGramsIn((v) => round1(v + GRAMS_SMALL_STEP))}
                className="w-12 h-11 rounded-xl bg-zinc-800 items-center justify-center"
              >
                <Text className="text-white font-medium text-sm">+{GRAMS_SMALL_STEP}</Text>
              </Pressable>
              <Pressable
                onPress={() => setGramsIn((v) => round1(v + GRAMS_LARGE_STEP))}
                className="w-12 h-11 rounded-xl bg-zinc-800 items-center justify-center"
              >
                <Text className="text-white font-medium text-sm">+{GRAMS_LARGE_STEP}</Text>
              </Pressable>
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-zinc-400 text-sm mb-2">Grinder Setting</Text>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => setGrinderSetting((v) => round1(Math.max(0, v - YIELD_STEP)))}
                className="w-12 h-11 rounded-xl bg-zinc-800 items-center justify-center"
              >
                <Text className="text-white font-medium text-sm">−{YIELD_STEP}</Text>
              </Pressable>
              <TextInput
                value={round1(grinderSetting).toString()}
                onChangeText={(t) => setGrinderSetting(round1(parseFloat(t) || 0))}
                keyboardType="decimal-pad"
                className="flex-1 bg-zinc-800 rounded-xl px-4 py-3 text-white text-center text-lg min-w-0"
              />
              <Pressable
                onPress={() => setGrinderSetting((v) => round1(v + YIELD_STEP))}
                className="w-12 h-11 rounded-xl bg-zinc-800 items-center justify-center"
              >
                <Text className="text-white font-medium text-sm">+{YIELD_STEP}</Text>
              </Pressable>
            </View>
          </View>

          <View className="mb-5">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-zinc-400 text-sm">Time</Text>
              <Pressable
                onPress={() => setTimeMode((m) => (m === 'stopwatch' ? 'manual' : 'stopwatch'))}
                className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-800"
              >
                <Ionicons
                  name={timeMode === 'stopwatch' ? 'timer' : 'keypad'}
                  size={14}
                  color="#999"
                />
                <Text className="text-zinc-400 text-xs">
                  {timeMode === 'stopwatch' ? 'Stopwatch' : 'Manual'}
                </Text>
              </Pressable>
            </View>

            {timeMode === 'stopwatch' ? (
              <View className="bg-zinc-900 rounded-2xl py-6">
                <Stopwatch onTimeUpdate={setTimeSeconds} />
              </View>
            ) : (
              <TextInput
                placeholder="Seconds"
                placeholderTextColor="#666"
                value={manualTime}
                onChangeText={setManualTime}
                keyboardType="number-pad"
                className="bg-zinc-800 rounded-xl px-4 py-3 text-white text-center text-lg"
              />
            )}
          </View>

          <View className="mb-4">
            <Text className="text-zinc-400 text-sm mb-2">Yield (grams out)</Text>
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => setYieldGrams((v) => round1(Math.max(0, v - 0.5)))}
                className="w-11 h-11 rounded-xl bg-zinc-800 items-center justify-center"
              >
                <Ionicons name="remove" size={20} color="#fff" />
              </Pressable>
              <TextInput
                value={round1(yieldGrams).toString()}
                onChangeText={(t) => setYieldGrams(round1(parseFloat(t) || 0))}
                keyboardType="decimal-pad"
                className="flex-1 bg-zinc-800 rounded-xl px-4 py-3 text-white text-center text-lg"
              />
              <Pressable
                onPress={() => setYieldGrams((v) => round1(v + 0.5))}
                className="w-11 h-11 rounded-xl bg-zinc-800 items-center justify-center"
              >
                <Ionicons name="add" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>

          <View className="bg-zinc-900 rounded-xl px-4 py-3 mb-5">
            <Text className="text-center text-lg text-amber-500 font-bold">
              Ratio: {ratio}:1
            </Text>
          </View>

          <Pressable
            onPress={handleLog}
            disabled={!canLog}
            className={`py-4 rounded-xl mb-4 ${canLog ? 'bg-amber-700' : 'bg-zinc-700'}`}
          >
            <Text className="text-white font-bold text-center text-base">Log Shot</Text>
          </Pressable>

          {recommendation && (
            <RecommendationCard
              recommendation={recommendation}
              onDismiss={resetForm}
            />
          )}

          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>

      <RatingModal
        visible={showRating}
        onSave={handleRatingSave}
        onDismiss={() => setShowRating(false)}
      />
    </SafeAreaView>
  );
}

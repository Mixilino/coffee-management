import { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useExtractions } from '@/stores/extractionStore';
import { useCoffees } from '@/stores/coffeeStore';
import { round1 } from '@/utils/numbers';

export default function StatsScreen() {
  const extractions = useExtractions();
  const coffees = useCoffees();

  const overall = useMemo(() => {
    if (extractions.length === 0) return null;
    const totalShots = extractions.length;
    const totalUsed = extractions.reduce((sum, e) => sum + e.gramsIn, 0);
    const rated = extractions.filter((e) => e.rating);
    const avgRating = rated.length > 0 ? rated.reduce((s, e) => s + e.rating!, 0) / rated.length : 0;
    const avgRatio = extractions.reduce((s, e) => s + e.ratio, 0) / totalShots;
    return { totalShots, totalUsed, avgRating, avgRatio };
  }, [extractions]);

  const perCoffee = useMemo(() => {
    return coffees
      .map((c) => {
        const shots = extractions.filter((e) => e.coffeeId === c.id);
        if (shots.length === 0) return null;
        const rated = shots.filter((e) => e.rating);
        const avgRating = rated.length > 0 ? rated.reduce((s, e) => s + e.rating!, 0) / rated.length : 0;
        const avgTime = shots.reduce((s, e) => s + e.timeSeconds, 0) / shots.length;
        const avgRatio = shots.reduce((s, e) => s + e.ratio, 0) / shots.length;
        const best = rated.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0] ?? null;
        return {
          name: c.name,
          totalShots: shots.length,
          avgRating,
          avgTime,
          avgRatio,
          bestRating: best?.rating ?? 0,
          bestDate: best ? new Date(best.date).toLocaleDateString() : '',
        };
      })
      .filter(Boolean);
  }, [coffees, extractions]);

  const trends = useMemo(() => {
    if (extractions.length < 5) return null;
    const sorted = [...extractions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const ratings = sorted.filter((e) => e.rating).map((e) => e.rating!);
    const ratios = sorted.map((e) => e.ratio);
    return { ratings, ratios };
  }, [extractions]);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <ScrollView className="flex-1 px-4">
        <Text className="text-2xl font-bold text-white mt-4 mb-5">Stats</Text>

        {!overall ? (
          <View className="bg-zinc-900 rounded-2xl p-8 items-center">
            <Ionicons name="stats-chart-outline" size={48} color="#666" />
            <Text className="text-zinc-400 mt-3 text-center text-base">
              No extractions yet. Start pulling shots to see your stats!
            </Text>
          </View>
        ) : (
          <>
            <View className="bg-zinc-900 rounded-2xl p-5 mb-4">
              <Text className="text-zinc-400 text-sm mb-3">Overall</Text>
              <View className="flex-row flex-wrap gap-3">
                <StatBox label="Total Shots" value={overall.totalShots.toString()} />
                <StatBox label="Coffee Used" value={`${round1(overall.totalUsed)}g`} />
                <StatBox
                  label="Avg Rating"
                  value={overall.avgRating > 0 ? overall.avgRating.toFixed(1) : '—'}
                  icon="star"
                />
                <StatBox label="Avg Ratio" value={`${round1(overall.avgRatio)}:1`} />
              </View>
            </View>

            {perCoffee.length > 0 && (
              <View className="mb-4">
                <Text className="text-zinc-400 text-sm mb-3">Per Coffee</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-3">
                    {perCoffee.map((c) =>
                      c ? (
                        <View key={c.name} className="bg-zinc-900 rounded-2xl p-4 w-56">
                          <Text className="text-white font-semibold mb-3" numberOfLines={1}>
                            {c.name}
                          </Text>
                          <MiniRow label="Shots" value={c.totalShots.toString()} />
                          <MiniRow
                            label="Avg Rating"
                            value={c.avgRating > 0 ? c.avgRating.toFixed(1) : '—'}
                          />
                          <MiniRow label="Avg Time" value={`${round1(c.avgTime)}s`} />
                          <MiniRow label="Avg Ratio" value={`${round1(c.avgRatio)}:1`} />
                          {c.bestRating > 0 && (
                            <MiniRow
                              label="Best Shot"
                              value={`${c.bestRating}★ (${c.bestDate})`}
                            />
                          )}
                        </View>
                      ) : null
                    )}
                  </View>
                </ScrollView>
              </View>
            )}

            {trends && (
              <View className="bg-zinc-900 rounded-2xl p-5 mb-4">
                <Text className="text-zinc-400 text-sm mb-3">Trends</Text>

                {trends.ratings.length >= 5 && (
                  <View className="mb-4">
                    <Text className="text-zinc-500 text-xs mb-2">Rating over time</Text>
                    <DotChart values={trends.ratings} maxVal={5} color="#F59E0B" />
                  </View>
                )}

                <View>
                  <Text className="text-zinc-500 text-xs mb-2">Ratio trend</Text>
                  <DotChart
                    values={trends.ratios}
                    maxVal={Math.max(...trends.ratios, 3)}
                    color="#8B5E3C"
                  />
                </View>
              </View>
            )}
          </>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: string;
}) {
  return (
    <View className="flex-1 min-w-[45%] bg-zinc-800 rounded-xl p-3">
      <Text className="text-zinc-500 text-xs mb-1">{label}</Text>
      <View className="flex-row items-center gap-1">
        {icon && (
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={14} color="#F59E0B" />
        )}
        <Text className="text-white text-lg font-bold">{value}</Text>
      </View>
    </View>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-0.5">
      <Text className="text-zinc-500 text-xs">{label}</Text>
      <Text className="text-white text-xs">{value}</Text>
    </View>
  );
}

function DotChart({
  values,
  maxVal,
  color,
}: {
  values: number[];
  maxVal: number;
  color: string;
}) {
  const height = 40;
  return (
    <View className="flex-row items-end gap-1 h-10">
      {values.map((v, i) => {
        const h = maxVal > 0 ? Math.max(4, (v / maxVal) * height) : 4;
        return (
          <View
            key={i}
            className="flex-1 rounded-full min-w-[4px]"
            style={{ height: h, backgroundColor: color }}
          />
        );
      })}
    </View>
  );
}

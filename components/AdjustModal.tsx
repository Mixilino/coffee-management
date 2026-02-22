import { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, Modal } from 'react-native';
import type { Coffee } from '@/types';

interface AdjustModalProps {
  visible: boolean;
  coffee: Coffee | null;
  onAdjust: (actualGrams: number, reason?: string) => void;
  onDismiss: () => void;
}

export default function AdjustModal({ visible, coffee, onAdjust, onDismiss }: AdjustModalProps) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (coffee && visible) {
      setAmount(Math.round(coffee.remaining).toString());
      setReason('');
    }
  }, [coffee, visible]);

  if (!coffee) return null;

  const numAmount = parseFloat(amount) || 0;
  const tracked = coffee.boughtGrams - coffee.usedGrams;
  const newOffset = numAmount - tracked;

  const handleConfirm = () => {
    onAdjust(numAmount, reason || undefined);
    setAmount('');
    setReason('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable className="flex-1 bg-black/60" onPress={onDismiss} />
      <View className="bg-zinc-900 rounded-t-3xl px-6 pt-6 pb-10">
        <Text className="text-xl font-bold text-white mb-5 text-center">
          Adjust Actual Amount
        </Text>

        <View className="bg-zinc-800 rounded-xl p-4 mb-5">
          <View className="flex-row justify-between mb-2">
            <Text className="text-zinc-400 text-sm">Tracked</Text>
            <Text className="text-white text-sm">{Math.round(tracked)}g</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-zinc-400 text-sm">You measured</Text>
            <Text className="text-amber-500 text-sm font-medium">{numAmount}g</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-zinc-400 text-sm">Offset will be</Text>
            <Text
              className={`text-sm font-medium ${
                newOffset >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {newOffset >= 0 ? '+' : ''}
              {Math.round(newOffset)}g
            </Text>
          </View>
        </View>

        <Text className="text-zinc-400 text-sm mb-2">Actual amount (grams)</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          className="bg-zinc-800 rounded-xl px-4 py-3 text-white text-center text-lg mb-4"
        />

        <Text className="text-zinc-400 text-sm mb-2">Reason (optional)</Text>
        <TextInput
          placeholder="e.g. Weighed bag"
          placeholderTextColor="#666"
          value={reason}
          onChangeText={setReason}
          className="bg-zinc-800 rounded-xl px-4 py-3 text-white mb-5"
        />

        <Pressable onPress={handleConfirm} className="bg-amber-700 py-4 rounded-xl">
          <Text className="text-white font-bold text-center text-base">Update</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

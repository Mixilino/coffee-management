import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Coffee } from '@/types';
import { round1 } from '@/utils/numbers';

type RestockMode = 'add' | 'set' | 'custom';

interface RestockModalProps {
  visible: boolean;
  coffee: Coffee | null;
  onRestock: (mode: RestockMode, amount: number) => void;
  onDismiss: () => void;
}

export default function RestockModal({ visible, coffee, onRestock, onDismiss }: RestockModalProps) {
  const [mode, setMode] = useState<RestockMode>('add');
  const [amount, setAmount] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const handleBackdrop = () => {
    if (keyboardVisible) {
      Keyboard.dismiss();
    } else {
      onDismiss();
    }
  };

  const handleConfirm = () => {
    Keyboard.dismiss();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    onRestock(mode, numAmount);
    setAmount('');
    setMode('add');
  };

  if (!coffee) return null;

  const options: { key: RestockMode; title: string; desc: string; icon: string }[] = [
    { key: 'add', title: 'Add to stock', desc: 'Add grams to bought total', icon: 'add-circle' },
    { key: 'set', title: 'Set to amount', desc: 'Set remaining to exact amount', icon: 'create' },
    { key: 'custom', title: 'Custom / Replace', desc: 'Full manual override of total', icon: 'swap-horizontal' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleBackdrop}>
      <Pressable className="flex-1 bg-black/60" onPress={handleBackdrop} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="w-full"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
          bounces={false}
        >
          <View className="bg-zinc-900 rounded-t-3xl px-6 pt-6 pb-10">
            <Text className="text-xl font-bold text-white mb-1 text-center">Restock</Text>
            <Text className="text-zinc-400 text-sm mb-5 text-center">
              Currently: ~{round1(coffee.remaining)}g remaining
            </Text>

            <View className="gap-2 mb-5">
              {options.map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => setMode(opt.key)}
                  className={`flex-row items-center gap-3 p-4 rounded-xl ${
                    mode === opt.key ? 'bg-amber-900/40 border border-amber-700' : 'bg-zinc-800'
                  }`}
                >
                  <Ionicons
                    name={opt.icon as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color={mode === opt.key ? '#D97706' : '#888'}
                  />
                  <View className="flex-1">
                    <Text className="text-white font-medium">{opt.title}</Text>
                    <Text className="text-zinc-500 text-xs">{opt.desc}</Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <TextInput
              placeholder="Grams"
              placeholderTextColor="#666"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              className="bg-zinc-800 rounded-xl px-4 py-3 text-white text-center text-lg mb-5"
            />

            <Pressable onPress={handleConfirm} className="bg-amber-700 py-4 rounded-xl">
              <Text className="text-white font-bold text-center text-base">Confirm Restock</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

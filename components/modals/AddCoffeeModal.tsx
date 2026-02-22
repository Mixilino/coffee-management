import { useState, useEffect, useMemo } from 'react';
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
  Alert,
} from 'react-native';
import type { Coffee } from '@/types';

interface AddCoffeeModalProps {
  visible: boolean;
  existingCoffees: Coffee[];
  onAdd: (name: string, seller: string, grams: number) => void;
  onRestock: (coffeeId: string, grams: number) => void;
  onDismiss: () => void;
}

const MIN_CHARS_FOR_SUGGESTIONS = 2;
const MAX_SUGGESTIONS = 5;

export default function AddCoffeeModal({
  visible,
  existingCoffees,
  onAdd,
  onRestock,
  onDismiss,
}: AddCoffeeModalProps) {
  const [newName, setNewName] = useState('');
  const [newSeller, setNewSeller] = useState('');
  const [newGrams, setNewGrams] = useState('');
  const [selectedExistingId, setSelectedExistingId] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [sellerFocused, setSellerFocused] = useState(false);

  const uniqueSellers = useMemo(
    () => Array.from(new Set(existingCoffees.map((c) => c.seller))).filter(Boolean),
    [existingCoffees]
  );

  const nameSuggestions = useMemo(() => {
    const q = newName.trim().toLowerCase();
    if (q.length < MIN_CHARS_FOR_SUGGESTIONS) return [];
    const sellerQ = newSeller.trim().toLowerCase();
    return existingCoffees
      .filter((c) => c.name.toLowerCase().includes(q))
      .filter((c) => !sellerQ || c.seller.toLowerCase().includes(sellerQ))
      .slice(0, MAX_SUGGESTIONS);
  }, [newName, newSeller, existingCoffees]);

  const sellerSuggestions = useMemo(() => {
    const q = newSeller.trim().toLowerCase();
    if (q.length < MIN_CHARS_FOR_SUGGESTIONS) return [];
    return uniqueSellers.filter((s) => s.toLowerCase().includes(q)).slice(0, MAX_SUGGESTIONS);
  }, [newSeller, uniqueSellers]);

  const selectedCoffee = selectedExistingId
    ? existingCoffees.find((c) => c.id === selectedExistingId) ?? null
    : null;
  const exactMatchSelected = Boolean(
    selectedCoffee &&
      newName.trim() === selectedCoffee.name &&
      newSeller.trim() === selectedCoffee.seller
  );
  const showNameDropdown = nameFocused && nameSuggestions.length > 0 && !exactMatchSelected;
  const showSellerDropdown = sellerFocused && sellerSuggestions.length > 0;

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

  const handleSelectSuggestion = (coffee: Coffee) => {
    setNewName(coffee.name);
    setNewSeller(coffee.seller);
    setSelectedExistingId(coffee.id);
    setNameFocused(false);
  };

  const handleSelectSellerSuggestion = (seller: string) => {
    setNewSeller(seller);
    setSellerFocused(false);
  };

  const handleNameChange = (text: string) => {
    setNewName(text);
    setSelectedExistingId(null);
  };

  const handleSellerChange = (text: string) => {
    setNewSeller(text);
    setSelectedExistingId(null);
  };

  const handleAdd = () => {
    Keyboard.dismiss();
    const grams = parseFloat(newGrams);
    if (!newName.trim() || !newSeller.trim() || isNaN(grams) || grams <= 0) {
      Alert.alert('Invalid input', 'Enter coffee name, seller, and a valid gram amount.');
      return;
    }
    const trimmed = newName.trim();
    const trimmedSeller = newSeller.trim();
    const existingById = selectedExistingId
      ? existingCoffees.find((c) => c.id === selectedExistingId)
      : null;
    const existingByPair =
      existingById ??
      existingCoffees.find(
        (c) =>
          c.name.toLowerCase() === trimmed.toLowerCase() &&
          c.seller.toLowerCase() === trimmedSeller.toLowerCase()
      );
    if (existingByPair) {
      onRestock(existingByPair.id, grams);
    } else {
      onAdd(trimmed, trimmedSeller, grams);
    }
    setNewName('');
    setNewSeller('');
    setNewGrams('');
    setSelectedExistingId(null);
    setNameFocused(false);
    setSellerFocused(false);
    onDismiss();
  };

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
            <Text className="text-xl font-bold text-white mb-5 text-center">Add Coffee</Text>
            <View className="mb-4">
              <View className="rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700">
                <TextInput
                  placeholder="Coffee name"
                  placeholderTextColor="#666"
                  value={newName}
                  onChangeText={handleNameChange}
                  onFocus={() => setNameFocused(true)}
                  className="px-4 py-3 text-white"
                />
                {showNameDropdown && (
                  <View className="border-t border-zinc-700 rounded-b-xl overflow-hidden">
                    {nameSuggestions.map((c) => (
                      <Pressable
                        key={c.id}
                        onPress={() => handleSelectSuggestion(c)}
                        className="px-4 py-3"
                        style={({ pressed }) => ({
                          backgroundColor: pressed ? 'rgba(63,63,70,0.6)' : undefined,
                        })}
                      >
                        <Text className="text-white">{c.name}</Text>
                        <Text className="text-zinc-500 text-xs mt-0.5">{c.seller}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
              {exactMatchSelected && (
                <Text className="text-amber-500 text-xs mt-1.5 px-1">
                  Adding stock to existing coffee
                </Text>
              )}
            </View>
            <View className="mb-4">
              <View className="rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700">
                <TextInput
                  placeholder="Seller"
                  placeholderTextColor="#666"
                  value={newSeller}
                  onChangeText={handleSellerChange}
                  onFocus={() => setSellerFocused(true)}
                  className="px-4 py-3 text-white"
                />
                {showSellerDropdown && (
                  <View className="border-t border-zinc-700 rounded-b-xl overflow-hidden">
                    {sellerSuggestions.map((seller) => (
                      <Pressable
                        key={seller}
                        onPress={() => handleSelectSellerSuggestion(seller)}
                        className="px-4 py-3"
                        style={({ pressed }) => ({
                          backgroundColor: pressed ? 'rgba(63,63,70,0.6)' : undefined,
                        })}
                      >
                        <Text className="text-white">{seller}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>
            <TextInput
              placeholder="Bag size (grams)"
              placeholderTextColor="#666"
              value={newGrams}
              onChangeText={setNewGrams}
              keyboardType="decimal-pad"
              className="bg-zinc-800 rounded-xl px-4 py-3 text-white mb-5"
            />
            <Pressable onPress={handleAdd} className="bg-amber-700 py-4 rounded-xl">
              <Text className="text-white font-bold text-center text-base">
                {selectedExistingId ? 'Add stock to existing' : 'Add Coffee'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

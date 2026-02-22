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
  Alert,
} from 'react-native';

interface AddCoffeeModalProps {
  visible: boolean;
  onAdd: (name: string, grams: number) => void;
  onDismiss: () => void;
}

export default function AddCoffeeModal({ visible, onAdd, onDismiss }: AddCoffeeModalProps) {
  const [newName, setNewName] = useState('');
  const [newGrams, setNewGrams] = useState('');
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

  const handleAdd = () => {
    Keyboard.dismiss();
    const grams = parseFloat(newGrams);
    if (!newName.trim() || isNaN(grams) || grams <= 0) {
      Alert.alert('Invalid input', 'Enter a name and valid gram amount.');
      return;
    }
    onAdd(newName.trim(), grams);
    setNewName('');
    setNewGrams('');
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
            <Pressable onPress={handleAdd} className="bg-amber-700 py-4 rounded-xl">
              <Text className="text-white font-bold text-center text-base">Add Coffee</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

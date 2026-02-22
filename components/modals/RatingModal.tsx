import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

const QUICK_NOTES = ['Bitter', 'Sour', 'Weak', 'Harsh', 'Perfect', 'Balanced'];

interface RatingModalProps {
  visible: boolean;
  onSave: (rating: number, notes?: string) => void;
  onDismiss: () => void;
}

export default function RatingModal({ visible, onSave, onDismiss }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [freeText, setFreeText] = useState('');

  const toggleNote = (note: string) => {
    setSelectedNotes((prev) =>
      prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]
    );
  };

  const handleSave = () => {
    const allNotes = [...selectedNotes, freeText].filter(Boolean).join(', ');
    onSave(rating, allNotes || undefined);
    setRating(0);
    setSelectedNotes([]);
    setFreeText('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable className="flex-1 bg-black/60" onPress={onDismiss} />
      <View className="bg-zinc-900 rounded-t-3xl px-6 pt-6 pb-10">
        <Text className="text-xl font-bold text-white mb-5 text-center">
          Rate Your Shot
        </Text>

        <View className="flex-row justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable key={star} onPress={() => setRating(star)} className="p-1">
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={36}
                color={star <= rating ? '#F59E0B' : '#666'}
              />
            </Pressable>
          ))}
        </View>

        <Text className="text-zinc-400 text-sm mb-2">Quick notes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            {QUICK_NOTES.map((note) => (
              <Pressable
                key={note}
                onPress={() => toggleNote(note)}
                className={`px-4 py-2 rounded-full ${
                  selectedNotes.includes(note) ? 'bg-amber-700' : 'bg-zinc-800'
                }`}
              >
                <Text className="text-white text-sm">{note}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <TextInput
          placeholder="Additional notes..."
          placeholderTextColor="#666"
          value={freeText}
          onChangeText={setFreeText}
          className="bg-zinc-800 rounded-xl px-4 py-3 text-white mb-6"
          multiline
        />

        <Pressable
          onPress={handleSave}
          disabled={rating === 0}
          className={`py-4 rounded-xl ${rating > 0 ? 'bg-amber-700' : 'bg-zinc-700'}`}
        >
          <Text className="text-white font-bold text-center text-base">
            Save & See Recommendation
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}

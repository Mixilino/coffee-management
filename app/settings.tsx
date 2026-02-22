import { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import {
  useAllCoffees,
  useImportCoffees,
  useClearAllCoffees,
} from '@/stores/coffeeStore';
import {
  useExtractions,
  useImportExtractions,
  useClearAllExtractions,
} from '@/stores/extractionStore';
import {
  exportAllData,
  parseCoffeeCsv,
  parseExtractionCsv,
} from '@/services/csvService';

export default function SettingsScreen() {
  const coffees = useAllCoffees();
  const extractions = useExtractions();
  const importCoffees = useImportCoffees();
  const importExtractions = useImportExtractions();
  const clearCoffees = useClearAllCoffees();
  const clearExtractions = useClearAllExtractions();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportAllData(coffees, extractions);
    } catch (err) {
      Alert.alert('Export Error', String(err));
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      const importedFile = new File(file.uri);
      const content = await importedFile.text();
      const fileName = file.name?.toLowerCase() ?? '';

      if (fileName.includes('coffee')) {
        const parsed = parseCoffeeCsv(content);
        Alert.alert(
          'Import Coffees',
          `Found ${parsed.length} coffees. Import will MERGE with existing data.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Import',
              onPress: () => {
                importCoffees(parsed);
                Alert.alert('Done', `Imported ${parsed.length} coffees.`);
              },
            },
          ]
        );
      } else if (fileName.includes('extraction')) {
        const parsed = parseExtractionCsv(content);
        Alert.alert(
          'Import Extractions',
          `Found ${parsed.length} extractions. Import will MERGE with existing data.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Import',
              onPress: () => {
                importExtractions(parsed);
                Alert.alert('Done', `Imported ${parsed.length} extractions.`);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Unknown File',
          'File name should contain "coffee" or "extraction" to determine import type.'
        );
      }
    } catch (err) {
      Alert.alert('Import Error', String(err));
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all coffees and extractions. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            clearCoffees();
            clearExtractions();
            Alert.alert('Done', 'All data has been cleared.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['bottom']}>
      <View className="flex-1 px-4 pt-4">
        <View className="bg-zinc-900 rounded-2xl overflow-hidden mb-6">
          <SettingsButton
            icon="cloud-download-outline"
            label="Export Data"
            sublabel={`${coffees.length} coffees, ${extractions.length} extractions`}
            onPress={handleExport}
            disabled={exporting}
          />
          <View className="h-px bg-zinc-800" />
          <SettingsButton
            icon="cloud-upload-outline"
            label="Import Data"
            sublabel="Import from CSV file"
            onPress={handleImport}
          />
        </View>

        <View className="bg-zinc-900 rounded-2xl overflow-hidden">
          <SettingsButton
            icon="trash-outline"
            label="Clear All Data"
            sublabel="Permanently delete everything"
            onPress={handleClear}
            destructive
          />
        </View>

        <Text className="text-zinc-600 text-xs text-center mt-8">
          Coffee Tracker v1.0.0
        </Text>
      </View>
    </SafeAreaView>
  );
}

function SettingsButton({
  icon,
  label,
  sublabel,
  onPress,
  destructive,
  disabled,
}: {
  icon: string;
  label: string;
  sublabel: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-row items-center gap-4 px-4 py-4"
    >
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={22}
        color={destructive ? '#EF4444' : '#999'}
      />
      <View className="flex-1">
        <Text
          className={`font-medium ${destructive ? 'text-red-500' : 'text-white'}`}
        >
          {label}
        </Text>
        <Text className="text-zinc-500 text-xs">{sublabel}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#555" />
    </Pressable>
  );
}

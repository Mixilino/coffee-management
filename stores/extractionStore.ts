import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Extraction, Recommendation } from '@/types';
import { useCoffeeStore } from './coffeeStore';
import { getRecommendation } from '@/services/recommendationService';

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}

interface ExtractionState {
  extractions: Extraction[];
}

interface ExtractionActions {
  addExtraction: (data: Omit<Extraction, 'id' | 'ratio' | 'recommendation'>) => string;
  addRatingAndNotes: (id: string, rating: number, notes?: string) => void;
  deleteExtraction: (id: string) => void;
  importExtractions: (extractions: Extraction[]) => void;
  clearAll: () => void;
}

export const useExtractionStore = create<ExtractionState & ExtractionActions>()(
  persist(
    immer((set, get) => ({
      extractions: [],

      addExtraction: (data) => {
        const id = generateId();
        const ratio = data.gramsIn > 0 ? data.yieldGrams / data.gramsIn : 0;

        set((state) => {
          state.extractions.push({
            ...data,
            id,
            ratio: Math.round(ratio * 100) / 100,
          });
        });

        const allExtractions = get().extractions;
        useCoffeeStore.getState().recalculateUsed(data.coffeeId, allExtractions);

        return id;
      },

      addRatingAndNotes: (id, rating, notes) => {
        set((state) => {
          const extraction = state.extractions.find((e) => e.id === id);
          if (!extraction) return;

          extraction.rating = rating;
          extraction.notes = notes;
          extraction.recommendation = getRecommendation(extraction);
        });
      },

      deleteExtraction: (id) => {
        const extraction = get().extractions.find((e) => e.id === id);
        if (!extraction) return;
        const coffeeId = extraction.coffeeId;

        set((state) => {
          state.extractions = state.extractions.filter((e) => e.id !== id);
        });

        const allExtractions = get().extractions;
        useCoffeeStore.getState().recalculateUsed(coffeeId, allExtractions);
      },

      importExtractions: (extractions) => {
        set((state) => {
          for (const imported of extractions) {
            const exists = state.extractions.find((e) => e.id === imported.id);
            if (!exists) {
              state.extractions.push(imported);
            }
          }
        });
      },

      clearAll: () => {
        set((state) => {
          state.extractions = [];
        });
      },
    })),
    {
      name: 'extraction-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const useExtractions = () => useExtractionStore((s) => s.extractions);
export const useExtractionsByCoffee = (coffeeId: string) => {
  const extractions = useExtractions();
  return useMemo(
    () => extractions.filter((e) => e.coffeeId === coffeeId),
    [extractions, coffeeId]
  );
};
export const useRecentExtractions = (n = 10) => {
  const extractions = useExtractions();
  return useMemo(() => extractions.slice(-n).reverse(), [extractions, n]);
};
export const useExtractionById = (id: string) => {
  const extractions = useExtractions();
  return useMemo(() => extractions.find((e) => e.id === id), [extractions, id]);
};

export const useAddExtraction = () => useExtractionStore((s) => s.addExtraction);
export const useAddRatingAndNotes = () => useExtractionStore((s) => s.addRatingAndNotes);
export const useDeleteExtraction = () => useExtractionStore((s) => s.deleteExtraction);
export const useImportExtractions = () => useExtractionStore((s) => s.importExtractions);
export const useClearAllExtractions = () => useExtractionStore((s) => s.clearAll);

import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Coffee, Extraction, OffsetLog } from '@/types';

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}

interface CoffeeState {
  coffees: Coffee[];
  offsetLogs: OffsetLog[];
}

interface CoffeeActions {
  addCoffee: (name: string, grams: number) => void;
  restockCoffee: (id: string, mode: 'add' | 'set' | 'custom', amount: number) => void;
  adjustActualAmount: (id: string, actualGrams: number, reason?: string) => void;
  recalculateUsed: (coffeeId: string, extractions: Extraction[]) => void;
  importCoffees: (coffees: Coffee[]) => void;
  clearAll: () => void;
}

export const useCoffeeStore = create<CoffeeState & CoffeeActions>()(
  persist(
    immer((set, get) => ({
      coffees: [],
      offsetLogs: [],

      addCoffee: (name, grams) => {
        const now = new Date().toISOString();
        set((state) => {
          state.coffees.push({
            id: generateId(),
            name,
            boughtGrams: grams,
            usedGrams: 0,
            manualOffset: 0,
            remaining: grams,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });
        });
      },

      restockCoffee: (id, mode, amount) => {
        set((state) => {
          const coffee = state.coffees.find((c) => c.id === id);
          if (!coffee) return;

          if (mode === 'add') {
            coffee.boughtGrams += amount;
          } else if (mode === 'set') {
            const currentComputed = coffee.boughtGrams - coffee.usedGrams + coffee.manualOffset;
            coffee.manualOffset += amount - currentComputed;
          } else {
            coffee.boughtGrams = amount + coffee.usedGrams - coffee.manualOffset;
          }

          coffee.remaining = coffee.boughtGrams - coffee.usedGrams + coffee.manualOffset;
          coffee.isActive = coffee.remaining > 0;
          coffee.updatedAt = new Date().toISOString();
        });
      },

      adjustActualAmount: (id, actualGrams, reason) => {
        set((state) => {
          const coffee = state.coffees.find((c) => c.id === id);
          if (!coffee) return;

          const previousRemaining = coffee.remaining;
          const tracked = coffee.boughtGrams - coffee.usedGrams;
          coffee.manualOffset = actualGrams - tracked;
          coffee.remaining = actualGrams;
          coffee.isActive = coffee.remaining > 0;
          coffee.updatedAt = new Date().toISOString();

          state.offsetLogs.push({
            timestamp: new Date().toISOString(),
            previousRemaining,
            newRemaining: actualGrams,
            offset: coffee.manualOffset,
            reason,
          });
        });
      },

      recalculateUsed: (coffeeId, extractions) => {
        set((state) => {
          const coffee = state.coffees.find((c) => c.id === coffeeId);
          if (!coffee) return;

          coffee.usedGrams = extractions
            .filter((e) => e.coffeeId === coffeeId)
            .reduce((sum, e) => sum + e.gramsIn, 0);
          coffee.remaining = coffee.boughtGrams - coffee.usedGrams + coffee.manualOffset;
          coffee.isActive = coffee.remaining > 0;
          coffee.updatedAt = new Date().toISOString();
        });
      },

      importCoffees: (coffees) => {
        set((state) => {
          for (const imported of coffees) {
            const exists = state.coffees.find((c) => c.id === imported.id);
            if (!exists) {
              state.coffees.push(imported);
            }
          }
        });
      },

      clearAll: () => {
        set((state) => {
          state.coffees = [];
          state.offsetLogs = [];
        });
      },
    })),
    {
      name: 'coffee-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const useCoffees = () => useCoffeeStore((s) => s.coffees);
export const useActiveCoffees = () => {
  const coffees = useCoffees();
  return useMemo(
    () => coffees.filter((c) => c.isActive && c.remaining > 0),
    [coffees]
  );
};
export const useCoffeeById = (id: string) => {
  const coffees = useCoffees();
  return useMemo(() => coffees.find((c) => c.id === id), [coffees, id]);
};

export const useAddCoffee = () => useCoffeeStore((s) => s.addCoffee);
export const useRestockCoffee = () => useCoffeeStore((s) => s.restockCoffee);
export const useAdjustActualAmount = () => useCoffeeStore((s) => s.adjustActualAmount);
export const useImportCoffees = () => useCoffeeStore((s) => s.importCoffees);
export const useClearAllCoffees = () => useCoffeeStore((s) => s.clearAll);

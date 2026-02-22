import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Coffee, Extraction, OffsetLog } from '@/types';

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

interface CoffeeState {
  coffees: Coffee[];
  offsetLogs: OffsetLog[];
}

interface CoffeeActions {
  addCoffee: (name: string, seller: string, grams: number) => void;
  restockCoffee: (id: string, mode: 'add' | 'set' | 'custom', amount: number) => void;
  adjustActualAmount: (id: string, actualGrams: number, reason?: string) => void;
  archiveCoffee: (id: string) => void;
  deleteCoffeePermanently: (id: string) => void;
  recalculateUsed: (coffeeId: string, extractions: Extraction[]) => void;
  importCoffees: (coffees: Coffee[]) => void;
  clearAll: () => void;
}

export const useCoffeeStore = create<CoffeeState & CoffeeActions>()(
  persist(
    immer((set) => ({
      coffees: [],
      offsetLogs: [],

      addCoffee: (name, seller, grams) => {
        const now = new Date().toISOString();
        const normalizedName = name.trim();
        const normalizedSeller = seller.trim() || 'Unknown';
        set((state) => {
          const existing = state.coffees.find(
            (c) =>
              !c.isArchived &&
              normalizeToken(c.name) === normalizeToken(normalizedName) &&
              normalizeToken(c.seller) === normalizeToken(normalizedSeller)
          );
          if (existing) {
            existing.boughtGrams += grams;
            existing.remaining = existing.boughtGrams - existing.usedGrams + existing.manualOffset;
            existing.isActive = existing.remaining > 0;
            existing.updatedAt = now;
            return;
          }
          state.coffees.push({
            id: generateId(),
            name: normalizedName,
            seller: normalizedSeller,
            boughtGrams: grams,
            usedGrams: 0,
            manualOffset: 0,
            remaining: grams,
            isActive: true,
            isArchived: false,
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

      archiveCoffee: (id) => {
        set((state) => {
          const coffee = state.coffees.find((c) => c.id === id);
          if (!coffee) return;
          coffee.isArchived = true;
          coffee.archivedAt = new Date().toISOString();
          coffee.isActive = false;
          coffee.updatedAt = coffee.archivedAt;
        });
      },

      deleteCoffeePermanently: (id) => {
        set((state) => {
          const coffee = state.coffees.find((c) => c.id === id);
          if (!coffee || !coffee.isArchived) return;
          state.coffees = state.coffees.filter((c) => c.id !== id);
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
          coffee.isActive = !coffee.isArchived && coffee.remaining > 0;
          coffee.updatedAt = new Date().toISOString();
        });
      },

      importCoffees: (coffees) => {
        set((state) => {
          for (const imported of coffees) {
            const exists = state.coffees.find((c) => c.id === imported.id);
            if (!exists) {
              state.coffees.push({
                ...imported,
                seller: imported.seller?.trim() || 'Unknown',
                isArchived: imported.isArchived ?? false,
                archivedAt: imported.archivedAt,
              });
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
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState: unknown, version) => {
        const state = (persistedState ?? {}) as CoffeeState;
        if (version < 2) {
          const coffees = (state.coffees ?? []).map((coffee) => ({
            ...coffee,
            seller: coffee.seller?.trim() || 'Unknown',
            isArchived: coffee.isArchived ?? false,
            archivedAt: coffee.archivedAt,
          }));
          return {
            ...state,
            coffees,
            offsetLogs: state.offsetLogs ?? [],
          };
        }
        return state;
      },
    }
  )
);

export const useAllCoffees = () => useCoffeeStore((s) => s.coffees);
export const useCoffees = () => {
  const coffees = useAllCoffees();
  return useMemo(() => coffees.filter((c) => !c.isArchived), [coffees]);
};
export const useActiveCoffees = () => {
  const coffees = useCoffees();
  return useMemo(
    () => coffees.filter((c) => c.isActive && c.remaining > 0),
    [coffees]
  );
};
export const useCoffeeById = (id: string) => {
  const coffees = useAllCoffees();
  return useMemo(() => coffees.find((c) => c.id === id), [coffees, id]);
};
export const useCoffeesByPair = (name: string, seller: string) => {
  const coffees = useAllCoffees();
  const normalizedName = normalizeToken(name);
  const normalizedSeller = normalizeToken(seller);
  return useMemo(
    () =>
      coffees.find(
        (c) =>
          normalizeToken(c.name) === normalizedName &&
          normalizeToken(c.seller) === normalizedSeller &&
          !c.isArchived
      ),
    [coffees, normalizedName, normalizedSeller]
  );
};

export const useAddCoffee = () => useCoffeeStore((s) => s.addCoffee);
export const useRestockCoffee = () => useCoffeeStore((s) => s.restockCoffee);
export const useAdjustActualAmount = () => useCoffeeStore((s) => s.adjustActualAmount);
export const useArchiveCoffee = () => useCoffeeStore((s) => s.archiveCoffee);
export const useDeleteCoffeePermanently = () => useCoffeeStore((s) => s.deleteCoffeePermanently);
export const useImportCoffees = () => useCoffeeStore((s) => s.importCoffees);
export const useClearAllCoffees = () => useCoffeeStore((s) => s.clearAll);

export interface Coffee {
  id: string;
  name: string;
  boughtGrams: number;
  usedGrams: number;
  manualOffset: number;
  remaining: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OffsetLog {
  timestamp: string;
  previousRemaining: number;
  newRemaining: number;
  offset: number;
  reason?: string;
}

export interface Extraction {
  id: string;
  coffeeId: string;
  coffeeName: string;
  gramsIn: number;
  grinderSetting: string;
  timeSeconds: number;
  yieldGrams: number;
  ratio: number;
  rating?: number;
  notes?: string;
  recommendation?: Recommendation;
  date: string;
}

export interface Recommendation {
  adjustGrind: 'coarser' | 'finer' | 'same';
  adjustTime: 'shorter' | 'longer' | 'same';
  adjustDose: 'more' | 'less' | 'same';
  reason: string;
  severity: 'minor' | 'major';
}

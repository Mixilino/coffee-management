import type { Extraction, Recommendation, SuggestedSettings } from '@/types';
import { round1 } from '@/utils/numbers';

/**
 * Suggested settings for a coffee based on that coffee's extraction history.
 * Uses the most recent extraction for this coffee so recommendations are
 * coffee-specific (e.g. Brazil grind 18 vs Ethiopia grind 10).
 */
export function getSuggestedSettingsForCoffee(
  coffeeId: string,
  extractions: Extraction[]
): SuggestedSettings | null {
  const forCoffee = extractions
    .filter((e) => e.coffeeId === coffeeId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (forCoffee.length === 0) return null;

  const last = forCoffee[0];
  const g = parseFloat(last.grinderSetting);
  return {
    grinderSetting: isNaN(g) ? last.grinderSetting : round1(g).toString(),
    gramsIn: round1(last.gramsIn),
    timeSeconds: last.timeSeconds,
    ratio: round1(last.ratio),
  };
}

export function getRecommendation(extraction: Extraction): Recommendation {
  const { timeSeconds, yieldGrams, gramsIn, notes } = extraction;
  const ratio = yieldGrams / gramsIn;
  const notesLower = notes?.toLowerCase() ?? '';

  const isBitter = notesLower.includes('bitter') || notesLower.includes('harsh');
  const isSlow = timeSeconds > 30;
  const isHighRatio = ratio > 2.5;

  const isSour =
    notesLower.includes('sour') || notesLower.includes('acidic') || notesLower.includes('weak');
  const isFast = timeSeconds < 20;
  const isLowRatio = ratio < 1.5;

  if (isBitter || isSlow || isHighRatio) {
    return {
      adjustGrind: 'coarser',
      adjustTime: 'shorter',
      adjustDose: ratio > 2.5 ? 'more' : 'same',
      reason: `Over-extracted (${isBitter ? 'bitter taste, ' : ''}${isSlow ? `${timeSeconds}s too long, ` : ''}ratio ${round1(ratio)}:1). Go coarser and aim for 22-28s.`,
      severity: isBitter && isSlow ? 'major' : 'minor',
    };
  }

  if (isSour || isFast || isLowRatio) {
    return {
      adjustGrind: 'finer',
      adjustTime: 'longer',
      adjustDose: ratio < 1.5 ? 'less' : 'same',
      reason: `Under-extracted (${isSour ? 'sour taste, ' : ''}${isFast ? `${timeSeconds}s too fast, ` : ''}ratio ${round1(ratio)}:1). Go finer and aim for 22-28s.`,
      severity: isSour && isFast ? 'major' : 'minor',
    };
  }

  return {
    adjustGrind: 'same',
    adjustTime: 'same',
    adjustDose: 'same',
    reason: `Good extraction! Ratio ${round1(ratio)}:1, time ${timeSeconds}s. Keep current settings.`,
    severity: 'minor',
  };
}

export function getQuickSummary(recommendation: Recommendation): string {
  const parts: string[] = [];

  if (recommendation.adjustGrind !== 'same') {
    parts.push(`Go ${recommendation.adjustGrind}`);
  }
  if (recommendation.adjustTime !== 'same') {
    parts.push(`${recommendation.adjustTime} time`);
  }
  if (recommendation.adjustDose !== 'same') {
    parts.push(`${recommendation.adjustDose} dose`);
  }

  if (parts.length === 0) return '→ Keep current settings';
  return `→ ${parts.join(', ')}`;
}

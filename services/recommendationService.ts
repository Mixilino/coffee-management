import type { Extraction, Recommendation } from '@/types';

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
      reason: `Over-extracted (${isBitter ? 'bitter taste, ' : ''}${isSlow ? `${timeSeconds}s too long, ` : ''}ratio ${ratio.toFixed(2)}:1). Go coarser and aim for 22-28s.`,
      severity: isBitter && isSlow ? 'major' : 'minor',
    };
  }

  if (isSour || isFast || isLowRatio) {
    return {
      adjustGrind: 'finer',
      adjustTime: 'longer',
      adjustDose: ratio < 1.5 ? 'less' : 'same',
      reason: `Under-extracted (${isSour ? 'sour taste, ' : ''}${isFast ? `${timeSeconds}s too fast, ` : ''}ratio ${ratio.toFixed(2)}:1). Go finer and aim for 22-28s.`,
      severity: isSour && isFast ? 'major' : 'minor',
    };
  }

  return {
    adjustGrind: 'same',
    adjustTime: 'same',
    adjustDose: 'same',
    reason: `Good extraction! Ratio ${ratio.toFixed(2)}:1, time ${timeSeconds}s. Keep current settings.`,
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

import type { Extraction, Recommendation, SuggestedSettings } from '@/types';
import { round1 } from '@/utils/numbers';

const THRESHOLDS = {
  timeMin: 20,
  timeMax: 30,
  ratioLow: 1.5,
  ratioHigh: 2.5,
} as const;

const SUGGESTION_GUARDRAILS = {
  ratioMin: 1.7,
  ratioMax: 2.3,
  timeMin: 22,
  timeMax: 34,
  gramsInMin: 14,
  gramsInMax: 24,
  maxGrindDeltaFromLast: 1.0,
  maxGramsInDeltaFromLast: 0.6,
  maxRatioDeltaFromLast: 0.2,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getSuggestionConfidence(extractionsCount: number, ratedCount: number): SuggestedSettings['confidence'] {
  if (extractionsCount >= 4 && ratedCount >= 2) return 'high';
  if (extractionsCount >= 2) return 'medium';
  return 'low';
}

/**
 * Suggested settings for a coffee based on that coffee's extraction history.
 * Uses weighted recent history (and ratings when present), then constrains
 * suggestions to small/safe steps from the latest shot.
 */
export function getSuggestedSettingsForCoffee(
  coffeeId: string,
  extractions: Extraction[]
): SuggestedSettings | null {
  const forCoffee = extractions
    .filter((e) => e.coffeeId === coffeeId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (forCoffee.length === 0) return null;

  const recent = forCoffee.slice(0, 6);
  const last = recent[0];
  const lastGrindNumber = parseFloat(last.grinderSetting);
  const lastRatio = last.ratio ?? (last.gramsIn > 0 ? last.yieldGrams / last.gramsIn : 2);

  let weightedGramsIn = 0;
  let weightedRatio = 0;
  let weightedTime = 0;
  let weightedGrind = 0;
  let gramsWeightSum = 0;
  let ratioWeightSum = 0;
  let timeWeightSum = 0;
  let grindWeightSum = 0;
  let ratedCount = 0;

  recent.forEach((shot, idx) => {
    const recencyWeight = 1 / (1 + idx * 0.45);
    const ratingWeight = shot.rating ? 0.85 + (shot.rating / 5) * 0.5 : 1;
    if (shot.rating) ratedCount += 1;
    const w = recencyWeight * ratingWeight;

    weightedGramsIn += shot.gramsIn * w;
    gramsWeightSum += w;

    const ratio = shot.ratio ?? (shot.gramsIn > 0 ? shot.yieldGrams / shot.gramsIn : 2);
    weightedRatio += ratio * w;
    ratioWeightSum += w;

    weightedTime += shot.timeSeconds * w;
    timeWeightSum += w;

    const grind = parseFloat(shot.grinderSetting);
    if (!isNaN(grind)) {
      weightedGrind += grind * w;
      grindWeightSum += w;
    }
  });

  const avgGramsIn = gramsWeightSum > 0 ? weightedGramsIn / gramsWeightSum : last.gramsIn;
  const avgRatio = ratioWeightSum > 0 ? weightedRatio / ratioWeightSum : lastRatio;
  const avgTime = timeWeightSum > 0 ? weightedTime / timeWeightSum : last.timeSeconds;
  const avgGrind = grindWeightSum > 0 ? weightedGrind / grindWeightSum : lastGrindNumber;

  const suggestedGramsIn = clamp(
    clamp(
      avgGramsIn,
      last.gramsIn - SUGGESTION_GUARDRAILS.maxGramsInDeltaFromLast,
      last.gramsIn + SUGGESTION_GUARDRAILS.maxGramsInDeltaFromLast
    ),
    SUGGESTION_GUARDRAILS.gramsInMin,
    SUGGESTION_GUARDRAILS.gramsInMax
  );

  const suggestedRatio = clamp(
    clamp(
      avgRatio,
      lastRatio - SUGGESTION_GUARDRAILS.maxRatioDeltaFromLast,
      lastRatio + SUGGESTION_GUARDRAILS.maxRatioDeltaFromLast
    ),
    SUGGESTION_GUARDRAILS.ratioMin,
    SUGGESTION_GUARDRAILS.ratioMax
  );

  const suggestedTime = clamp(avgTime, SUGGESTION_GUARDRAILS.timeMin, SUGGESTION_GUARDRAILS.timeMax);

  const fallbackGrind = isNaN(lastGrindNumber) ? last.grinderSetting : round1(lastGrindNumber).toString();
  let suggestedGrind = fallbackGrind;
  if (!isNaN(avgGrind) && !isNaN(lastGrindNumber)) {
    suggestedGrind = round1(
      clamp(
        avgGrind,
        lastGrindNumber - SUGGESTION_GUARDRAILS.maxGrindDeltaFromLast,
        lastGrindNumber + SUGGESTION_GUARDRAILS.maxGrindDeltaFromLast
      )
    ).toString();
  }

  const confidence = getSuggestionConfidence(recent.length, ratedCount);
  const basedOn = recent.length === 1 ? 'Based on your last shot' : `Based on your last ${recent.length} shots`;

  const hint =
    confidence === 'high'
      ? 'Reliable trend from your recent history.'
      : confidence === 'medium'
        ? 'Good starting point. Adjust by taste after this shot.'
        : 'Starter suggestion with limited history.';

  return {
    grinderSetting: suggestedGrind,
    gramsIn: round1(suggestedGramsIn),
    timeSeconds: Math.round(suggestedTime),
    ratio: round1(suggestedRatio),
    basedOn,
    hint,
    confidence,
  };
}

export function getRecommendation(extraction: Extraction): Recommendation {
  const { timeSeconds, yieldGrams, gramsIn, notes } = extraction;

  // Prefer stored ratio to avoid rounding drift; fallback to calculation
  const ratio = extraction.ratio ?? yieldGrams / gramsIn;
  const notesLower = notes?.toLowerCase() ?? '';

  const isBitter    = notesLower.includes('bitter') || notesLower.includes('harsh');
  const isSlow      = timeSeconds > THRESHOLDS.timeMax;
  const isHighRatio = ratio > THRESHOLDS.ratioHigh;

  const isSour      = notesLower.includes('sour') || notesLower.includes('acidic') || notesLower.includes('weak');
  const isFast      = timeSeconds < THRESHOLDS.timeMin;
  const isLowRatio  = ratio < THRESHOLDS.ratioLow;

  const overScore   = [isBitter, isSlow, isHighRatio].filter(Boolean).length;
  const underScore  = [isSour, isFast, isLowRatio].filter(Boolean).length;

  // Conflicting signals — likely channeling or puck prep issue
  if (overScore > 0 && underScore > 0) {
    return {
      adjustGrind: 'same',
      adjustTime:  'same',
      adjustDose:  'same',
      reason:      `Mixed signals — possible channeling or uneven distribution. Check puck prep and try again (ratio ${round1(ratio)}:1, ${timeSeconds}s).`,
      severity:    'minor',
    };
  }

  if (overScore > 0) {
    const reasons = [
      isBitter    && 'bitter taste',
      isSlow      && `${timeSeconds}s too long`,
      isHighRatio && `ratio ${round1(ratio)}:1`,
    ].filter(Boolean).join(', ');

    return {
      adjustGrind: 'coarser',
      adjustTime:  'shorter',
      adjustDose:  isHighRatio ? 'less' : 'same',  // high yield → reduce, not increase
      reason:      `Over-extracted (${reasons}). Go coarser and aim for ${THRESHOLDS.timeMin}–${THRESHOLDS.timeMax}s.`,
      severity:    overScore >= 2 ? 'major' : 'minor',
    };
  }

  if (underScore > 0) {
    const reasons = [
      isSour      && 'sour taste',
      isFast      && `${timeSeconds}s too fast`,
      isLowRatio  && `ratio ${round1(ratio)}:1`,
    ].filter(Boolean).join(', ');

    return {
      adjustGrind: 'finer',
      adjustTime:  'longer',
      adjustDose:  isLowRatio ? 'less' : 'same',
      reason:      `Under-extracted (${reasons}). Go finer and aim for ${THRESHOLDS.timeMin}–${THRESHOLDS.timeMax}s.`,
      severity:    underScore >= 2 ? 'major' : 'minor',
    };
  }

  return {
    adjustGrind: 'same',
    adjustTime:  'same',
    adjustDose:  'same',
    reason:      `Good extraction! Ratio ${round1(ratio)}:1, time ${timeSeconds}s. Keep current settings.`,
    severity:    'none',  // was 'minor' — semantically incorrect for a good shot
  };
}

export function getQuickSummary(recommendation: Recommendation): string {
  const parts: string[] = [];

  if (recommendation.adjustGrind !== 'same') parts.push(`Go ${recommendation.adjustGrind}`);
  if (recommendation.adjustTime  !== 'same') parts.push(`${recommendation.adjustTime} time`);
  if (recommendation.adjustDose  !== 'same') parts.push(`${recommendation.adjustDose} dose`);

  if (parts.length === 0) return '→ Keep current settings';
  return `→ ${parts.join(', ')}`;
}

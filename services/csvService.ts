import Papa from 'papaparse';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Coffee, Extraction, Recommendation } from '@/types';

function flattenExtraction(e: Extraction): Record<string, string | number | undefined> {
  return {
    id: e.id,
    coffeeId: e.coffeeId,
    coffeeName: e.coffeeName,
    coffeeSeller: e.coffeeSeller,
    gramsIn: e.gramsIn,
    grinderSetting: e.grinderSetting,
    timeSeconds: e.timeSeconds,
    yieldGrams: e.yieldGrams,
    ratio: e.ratio,
    rating: e.rating,
    notes: e.notes,
    rec_adjustGrind: e.recommendation?.adjustGrind,
    rec_adjustTime: e.recommendation?.adjustTime,
    rec_adjustDose: e.recommendation?.adjustDose,
    rec_reason: e.recommendation?.reason,
    rec_severity: e.recommendation?.severity,
    date: e.date,
  };
}

function unflattenExtraction(row: Record<string, string>): Extraction {
  let recommendation: Recommendation | undefined;
  if (row.rec_adjustGrind) {
    recommendation = {
      adjustGrind: row.rec_adjustGrind as Recommendation['adjustGrind'],
      adjustTime: row.rec_adjustTime as Recommendation['adjustTime'],
      adjustDose: row.rec_adjustDose as Recommendation['adjustDose'],
      reason: row.rec_reason ?? '',
      severity: (row.rec_severity as Recommendation['severity']) ?? 'minor',
    };
  }

  return {
    id: row.id,
    coffeeId: row.coffeeId,
    coffeeName: row.coffeeName,
    coffeeSeller: row.coffeeSeller || 'Unknown',
    gramsIn: parseFloat(row.gramsIn) || 0,
    grinderSetting: row.grinderSetting ?? '',
    timeSeconds: parseInt(row.timeSeconds) || 0,
    yieldGrams: parseFloat(row.yieldGrams) || 0,
    ratio: parseFloat(row.ratio) || 0,
    rating: row.rating ? parseInt(row.rating) : undefined,
    notes: row.notes || undefined,
    recommendation,
    date: row.date,
  };
}

export async function exportAllData(coffees: Coffee[], extractions: Extraction[]): Promise<void> {
  const coffeeCsv = Papa.unparse(coffees);
  const extractionCsv = Papa.unparse(extractions.map(flattenExtraction));

  const coffeeFile = new File(Paths.cache, 'coffees.csv');
  const extractionFile = new File(Paths.cache, 'extractions.csv');

  coffeeFile.write(coffeeCsv);
  extractionFile.write(extractionCsv);

  const coffeePath = coffeeFile.uri;
  const extractionPath = extractionFile.uri;

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing not available on this device');
  }

  await Sharing.shareAsync(coffeePath, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Coffees CSV',
    UTI: 'public.comma-separated-values-text',
  });

  await Sharing.shareAsync(extractionPath, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Extractions CSV',
    UTI: 'public.comma-separated-values-text',
  });
}

export function parseCoffeeCsv(csvString: string): Coffee[] {
  const result = Papa.parse<Record<string, string>>(csvString, { header: true, skipEmptyLines: true });
  return result.data
    .filter((row) => row.id && row.name)
    .map((row) => ({
      id: row.id,
      name: row.name,
      seller: row.seller?.trim() || 'Unknown',
      boughtGrams: parseFloat(row.boughtGrams) || 0,
      usedGrams: parseFloat(row.usedGrams) || 0,
      manualOffset: parseFloat(row.manualOffset) || 0,
      remaining: parseFloat(row.remaining) || 0,
      isActive: row.isActive === 'true',
      isArchived: row.isArchived === 'true',
      archivedAt: row.archivedAt || undefined,
      createdAt: row.createdAt ?? new Date().toISOString(),
      updatedAt: row.updatedAt ?? new Date().toISOString(),
    }));
}

export function parseExtractionCsv(csvString: string): Extraction[] {
  const result = Papa.parse<Record<string, string>>(csvString, { header: true, skipEmptyLines: true });
  return result.data
    .filter((row) => row.id && row.coffeeId)
    .map(unflattenExtraction);
}

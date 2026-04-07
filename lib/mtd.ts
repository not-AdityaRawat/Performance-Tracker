import { ENTRY_TYPES } from './entry-types';
import type { EntryType } from './entry-types';

export type DailyEntryRecord = {
  entryDate: string;
  productivity: number;
  entryType: EntryType;
};

export function calculateMtdPercent(entries: DailyEntryRecord[], periodDays: number) {
  if (periodDays <= 0) {
    return 0;
  }

  const entryMap = new Map(entries.map((entry) => [entry.entryDate, entry]));
  let total = 0;

  for (let index = 0; index < periodDays; index += 1) {
    const date = new Date(Date.UTC(2000, 0, 1 + index));
    const key = date.toISOString().slice(0, 10);
    const entry = entryMap.get(key);

    if (!entry || entry.entryType !== ENTRY_TYPES[0]) {
      continue;
    }

    total += entry.productivity;
  }

  return Math.round(total / periodDays);
}

export function calculateMtdPercentFromDates(entries: DailyEntryRecord[], dates: string[]) {
  if (dates.length === 0) {
    return 0;
  }

  const entryMap = new Map(entries.map((entry) => [entry.entryDate, entry]));
  let total = 0;

  for (const date of dates) {
    const entry = entryMap.get(date);
    if (entry && entry.entryType === ENTRY_TYPES[0]) {
      total += entry.productivity;
    }
  }

  return Math.round(total / dates.length);
}

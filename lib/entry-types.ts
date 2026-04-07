export const ENTRY_TYPES = ['NORMAL', 'LEAVE', 'BHF'] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];

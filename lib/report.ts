import type { EntryType } from './entry-types';
import { prisma } from './prisma';
import { calculateMtdPercentFromDates } from './mtd';
import { formatDateLabel, getMonthRange, listDatesInRange, toMonthKey } from './date';

export type ReportMonth = {
  monthKey: string;
  dates: string[];
  dateLabels: string[];
};

type ReportEntry = {
  id: string;
  entryDate: string;
  productivity: number;
  entryType: EntryType;
  note: string;
};

type MonthlyRecordSummary = {
  id: string;
  monthKey: string;
  totalWorkingDays: number;
  leaveDays: number;
  downtimeMin: number;
  processQuality: string;
  crossTraining: string;
  notes: string;
};

type DatabaseEntryRow = {
  id: string;
  entryDate: Date;
  productivity: number;
  entryType: EntryType;
  note: string;
};

type ReportEmployee = {
  id: string;
  empId: string;
  name: string;
  department: string | null;
  isActive: boolean;
  monthlyRecord: MonthlyRecordSummary | null;
  entries: ReportEntry[];
  mtd: number;
  entryMap: Record<string, ReportEntry>;
};

type EmployeeQueryResult = {
  id: string;
  empId: string;
  name: string;
  department: string | null;
  isActive: boolean;
  monthlyRecords: Array<{
    id: string;
    monthKey: string;
    totalWorkingDays: number;
    leaveDays: number;
    downtimeMin: number;
    processQuality: string;
    crossTraining: string;
    notes: string;
    entries: DatabaseEntryRow[];
  }>;
};

export async function getMonthReport(monthKey?: string) {
  const resolvedMonthKey = monthKey ?? toMonthKey(new Date());
  const { start, end } = getMonthRange(resolvedMonthKey);
  const dateList = listDatesInRange(start, end);
  const dates = dateList.map((date) => date.toISOString().slice(0, 10));
  const dateLabels = dateList.map((date) => formatDateLabel(date));

  const employees = (await prisma.employee.findMany({
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    include: {
      monthlyRecords: {
        where: { monthKey: resolvedMonthKey },
        include: { entries: { orderBy: { entryDate: 'asc' } } },
      },
    },
  })) as EmployeeQueryResult[];

  const reportEmployees: ReportEmployee[] = employees.map((employee: EmployeeQueryResult): ReportEmployee => {
    const record = employee.monthlyRecords[0] ?? null;
    const entryRows = record?.entries ?? [];
    const entries: ReportEntry[] = entryRows.map((entry: DatabaseEntryRow): ReportEntry => ({
      id: entry.id,
      entryDate: entry.entryDate.toISOString().slice(0, 10),
      productivity: entry.productivity,
      entryType: entry.entryType as EntryType,
      note: entry.note,
    }));
    const mtd = calculateMtdPercentFromDates(
      entries.map((entry) => ({
        entryDate: entry.entryDate,
        productivity: entry.productivity,
        entryType: entry.entryType,
      })),
      dates,
    );

    const entryMap = Object.fromEntries(entries.map((entry) => [entry.entryDate, entry]));

    return {
      id: employee.id,
      empId: employee.empId,
      name: employee.name,
      department: employee.department,
      isActive: employee.isActive,
      monthlyRecord: record
        ? {
            id: record.id,
            monthKey: record.monthKey,
            totalWorkingDays: record.totalWorkingDays,
            leaveDays: record.leaveDays,
            downtimeMin: record.downtimeMin,
            processQuality: record.processQuality,
            crossTraining: record.crossTraining,
            notes: record.notes,
          }
        : null,
      entries,
      mtd,
      entryMap,
    };
  });

  return {
    month: {
      monthKey: resolvedMonthKey,
      dates,
      dateLabels,
    } satisfies ReportMonth,
    employees: reportEmployees,
  };
}

export async function upsertMonthlyRecord(data: {
  employeeId: string;
  monthKey: string;
  totalWorkingDays: number;
  leaveDays: number;
  downtimeMin: number;
  processQuality?: string;
  crossTraining?: string;
  notes?: string;
}) {
  return prisma.monthlyRecord.upsert({
    where: {
      employeeId_monthKey: {
        employeeId: data.employeeId,
        monthKey: data.monthKey,
      },
    },
    create: {
      employeeId: data.employeeId,
      monthKey: data.monthKey,
      totalWorkingDays: data.totalWorkingDays,
      leaveDays: data.leaveDays,
      downtimeMin: data.downtimeMin,
      processQuality: data.processQuality ?? '',
      crossTraining: data.crossTraining ?? '',
      notes: data.notes ?? '',
    },
    update: {
      totalWorkingDays: data.totalWorkingDays,
      leaveDays: data.leaveDays,
      downtimeMin: data.downtimeMin,
      processQuality: data.processQuality ?? '',
      crossTraining: data.crossTraining ?? '',
      notes: data.notes ?? '',
    },
  });
}

export async function upsertDailyEntry(data: {
  monthlyRecordId: string;
  entryDate: string;
  productivity: number;
  entryType: EntryType;
  note?: string;
}) {
  return prisma.dailyEntry.upsert({
    where: {
      monthlyRecordId_entryDate: {
        monthlyRecordId: data.monthlyRecordId,
        entryDate: new Date(data.entryDate),
      },
    },
    create: {
      monthlyRecordId: data.monthlyRecordId,
      entryDate: new Date(data.entryDate),
      productivity: data.productivity,
      entryType: data.entryType,
      note: data.note ?? '',
    },
    update: {
      productivity: data.productivity,
      entryType: data.entryType,
      note: data.note ?? '',
    },
  });
}

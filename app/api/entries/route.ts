import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { dailyEntrySchema } from '../../../lib/validators';

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = dailyEntrySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let monthlyRecordId = parsed.data.monthlyRecordId;

  if (!monthlyRecordId) {
    if (!parsed.data.employeeId || !parsed.data.monthKey) {
      return NextResponse.json({ error: 'monthlyRecordId or employeeId + monthKey is required.' }, { status: 400 });
    }

    const monthlyRecord = await prisma.monthlyRecord.upsert({
      where: {
        employeeId_monthKey: {
          employeeId: parsed.data.employeeId,
          monthKey: parsed.data.monthKey,
        },
      },
      create: {
        employeeId: parsed.data.employeeId,
        monthKey: parsed.data.monthKey,
        totalWorkingDays: 0,
        leaveDays: 0,
        downtimeMin: 0,
        processQuality: '',
        crossTraining: '',
        notes: '',
      },
      update: {},
    });

    monthlyRecordId = monthlyRecord.id;
  }

  const entry = await prisma.dailyEntry.upsert({
    where: {
      monthlyRecordId_entryDate: {
        monthlyRecordId,
        entryDate: new Date(parsed.data.entryDate),
      },
    },
    create: {
      monthlyRecordId,
      entryDate: new Date(parsed.data.entryDate),
      productivity: parsed.data.productivity,
      entryType: parsed.data.entryType,
      note: parsed.data.note,
    },
    update: {
      productivity: parsed.data.productivity,
      entryType: parsed.data.entryType,
      note: parsed.data.note,
    },
  });

  return NextResponse.json(entry);
}

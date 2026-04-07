import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { monthlyRecordSchema } from '../../../lib/validators';

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = monthlyRecordSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const record = await prisma.monthlyRecord.upsert({
    where: {
      employeeId_monthKey: {
        employeeId: parsed.data.employeeId,
        monthKey: parsed.data.monthKey,
      },
    },
    create: parsed.data,
    update: {
      totalWorkingDays: parsed.data.totalWorkingDays,
      leaveDays: parsed.data.leaveDays,
      downtimeMin: parsed.data.downtimeMin,
      processQuality: parsed.data.processQuality,
      crossTraining: parsed.data.crossTraining,
      notes: parsed.data.notes,
    },
  });

  return NextResponse.json(record);
}

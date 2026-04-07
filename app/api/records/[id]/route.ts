import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { monthlyRecordUpdateSchema } from '../../../../lib/validators';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const payload = await request.json();
  const parsed = monthlyRecordUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const record = await prisma.monthlyRecord.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(record);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  await prisma.monthlyRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

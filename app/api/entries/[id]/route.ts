import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { dailyEntryUpdateSchema } from '../../../../lib/validators';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const payload = await request.json();
  const parsed = dailyEntryUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entry = await prisma.dailyEntry.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(entry);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  await prisma.dailyEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { employeeUpdateSchema } from '../../../../lib/validators';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const payload = await request.json();
  const parsed = employeeUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(employee);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  await prisma.employee.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

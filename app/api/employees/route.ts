import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { employeeCreateSchema } from '../../../lib/validators';

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = employeeCreateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const employee = await prisma.employee.create({
    data: parsed.data,
  });

  return NextResponse.json(employee, { status: 201 });
}

export async function GET() {
  const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(employees);
}

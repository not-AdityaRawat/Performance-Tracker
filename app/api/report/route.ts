import { NextRequest, NextResponse } from 'next/server';
import { getMonthReport } from '../../../lib/report';
import { monthKeySchema } from '../../../lib/validators';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = monthKeySchema.safeParse(searchParams.get('month') ?? undefined);
  const monthKey = parsed.success ? parsed.data : undefined;

  try {
    const report = await getMonthReport(monthKey);
    return NextResponse.json(report);
  } catch {
    return NextResponse.json({ error: 'Unable to load report. Check database connection and env variables.' }, { status: 503 });
  }
}

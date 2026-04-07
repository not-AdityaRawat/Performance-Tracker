import { NextRequest, NextResponse } from 'next/server';
import { buildWorkbookBuffer } from '../../../lib/export';
import { monthKeySchema } from '../../../lib/validators';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = monthKeySchema.safeParse(searchParams.get('month') ?? undefined);
  const monthKey = parsed.success ? parsed.data : undefined;

  try {
    const buffer = await buildWorkbookBuffer(monthKey);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="mtd-${monthKey ?? 'report'}.xlsx"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Excel export is unavailable until the database is configured.' }, { status: 503 });
  }
}

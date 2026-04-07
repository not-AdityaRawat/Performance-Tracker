# Performance Tracker

Employee MTD productivity tracker built with Next.js, TypeScript, Prisma, PostgreSQL, and ExcelJS.

## What it does
- Create, update, and delete employees.
- Store monthly productivity summaries and daily production entries.
- Calculate month-to-date productivity from daily entries.
- Export an Excel workbook that mirrors the spreadsheet-style report layout.

## Setup
1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Install dependencies.
3. Run Prisma generate and migrate.
4. Start the app.

## Scripts
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run prisma:generate`
- `npm run prisma:migrate`

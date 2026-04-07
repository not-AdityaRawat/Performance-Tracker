import ExcelJS from 'exceljs';
import { ENTRY_TYPES } from './entry-types';
import type { EntryType } from './entry-types';
import { getMonthReport } from './report';

type WorkbookEmployee = Awaited<ReturnType<typeof getMonthReport>>['employees'][number];

type WorkbookEntry = WorkbookEmployee['entries'][number];

function applyBorder(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: 'thin', color: { argb: 'FF1F2A44' } },
    left: { style: 'thin', color: { argb: 'FF1F2A44' } },
    bottom: { style: 'thin', color: { argb: 'FF1F2A44' } },
    right: { style: 'thin', color: { argb: 'FF1F2A44' } },
  };
}

export async function buildWorkbook(monthKey?: string) {
  const report = await getMonthReport(monthKey);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('MTD Tracker', {
    views: [{ state: 'frozen', ySplit: 2, xSplit: 3 }],
  });

  const totalColumns = 3 + report.month.dates.length + 4;
  sheet.columns = Array.from({ length: totalColumns }, () => ({ width: 14 }));
  sheet.getColumn(1).width = 8;
  sheet.getColumn(2).width = 14;
  sheet.getColumn(3).width = 24;

  const titleRow = sheet.addRow(['S.No', 'EMP ID', 'EMP NAME', ...report.month.dateLabels, 'Working day', 'Downtime Min', 'Cross Trng / Process Quality', 'MTD %']);
  titleRow.eachCell((cell, columnNumber) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D5AA6' } };
    applyBorder(cell);
    if (columnNumber >= 4 && columnNumber <= 3 + report.month.dates.length) {
      cell.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 45, wrapText: true };
    }
  });
  titleRow.height = 36;

  const subRow = sheet.addRow(['', '', '', ...report.month.dates.map(() => 'Prod %'), '', '', '', '']);
  subRow.eachCell((cell, columnNumber) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D5AA6' } };
    applyBorder(cell);
    if (columnNumber <= 3) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D5AA6' } };
    }
  });

  sheet.mergeCells(1, 1, 2, 1);
  sheet.mergeCells(1, 2, 2, 2);
  sheet.mergeCells(1, 3, 2, 3);
  sheet.mergeCells(1, 4, 1, 3 + report.month.dates.length);
  sheet.mergeCells(1, 4 + report.month.dates.length, 2, 4 + report.month.dates.length);
  sheet.mergeCells(1, 5 + report.month.dates.length, 2, 5 + report.month.dates.length);
  sheet.mergeCells(1, 6 + report.month.dates.length, 2, 6 + report.month.dates.length);
  sheet.mergeCells(1, 7 + report.month.dates.length, 2, 7 + report.month.dates.length);

  report.employees.forEach((employee: WorkbookEmployee, index: number) => {
    const entryMap = new Map<string, WorkbookEntry>(employee.entries.map((entry) => [entry.entryDate, entry]));
    const row = sheet.addRow([
      index + 1,
      employee.empId,
      employee.name,
      ...report.month.dates.map((date) => {
        const entry = entryMap.get(date);
        if (!entry) {
          return '';
        }

        if (entry.entryType !== ENTRY_TYPES[0]) {
          return entry.entryType === ENTRY_TYPES[1] ? 'Leave' : 'BHF';
        }

        return `${entry.productivity}%`;
      }),
      employee.monthlyRecord?.totalWorkingDays ?? '',
      employee.monthlyRecord?.downtimeMin ?? '',
      employee.monthlyRecord?.processQuality ?? '',
      `${employee.mtd}%`,
    ]);

    row.eachCell((cell, columnNumber) => {
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      applyBorder(cell);
      if (columnNumber === 4 + report.month.dates.length + 3) {
        cell.font = { bold: true };
      }
    });

    for (let col = 4; col < 4 + report.month.dates.length; col += 1) {
      const cell = row.getCell(col);
      const value = String(cell.value ?? '');
      if (value.includes('Leave')) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFA9C4F5' } };
      } else if (value.includes('BHF')) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
      } else if (value.endsWith('%')) {
        const percent = Number.parseInt(value, 10);
        cell.font = { bold: true, color: { argb: percent < 75 ? 'FFC00000' : 'FF111111' } };
      }
    }

    const mtdCell = row.getCell(7 + report.month.dates.length);
    const mtdValue = employee.mtd;
    mtdCell.font = { bold: true };
    mtdCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: mtdValue >= 120 ? 'FFA9D18E' : mtdValue >= 100 ? 'FFE2F0D9' : 'FFFFC7CE' } };
  });

  sheet.getRow(1).height = 40;
  sheet.getRow(2).height = 24;
  sheet.autoFilter = {
    from: 'A2',
    to: sheet.getCell(sheet.rowCount, sheet.columnCount).address,
  };

  return workbook;
}

export async function buildWorkbookBuffer(monthKey?: string) {
  const workbook = await buildWorkbook(monthKey);
  return workbook.xlsx.writeBuffer();
}

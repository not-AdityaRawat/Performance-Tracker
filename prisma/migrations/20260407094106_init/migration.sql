-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('NORMAL', 'LEAVE', 'BHF');

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "empId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyRecord" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "totalWorkingDays" INTEGER NOT NULL DEFAULT 0,
    "leaveDays" INTEGER NOT NULL DEFAULT 0,
    "downtimeMin" INTEGER NOT NULL DEFAULT 0,
    "processQuality" TEXT NOT NULL DEFAULT '',
    "crossTraining" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyEntry" (
    "id" TEXT NOT NULL,
    "monthlyRecordId" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "productivity" INTEGER NOT NULL DEFAULT 0,
    "entryType" "EntryType" NOT NULL DEFAULT 'NORMAL',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_empId_key" ON "Employee"("empId");

-- CreateIndex
CREATE INDEX "MonthlyRecord_monthKey_idx" ON "MonthlyRecord"("monthKey");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyRecord_employeeId_monthKey_key" ON "MonthlyRecord"("employeeId", "monthKey");

-- CreateIndex
CREATE INDEX "DailyEntry_entryDate_idx" ON "DailyEntry"("entryDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyEntry_monthlyRecordId_entryDate_key" ON "DailyEntry"("monthlyRecordId", "entryDate");

-- AddForeignKey
ALTER TABLE "MonthlyRecord" ADD CONSTRAINT "MonthlyRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyEntry" ADD CONSTRAINT "DailyEntry_monthlyRecordId_fkey" FOREIGN KEY ("monthlyRecordId") REFERENCES "MonthlyRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

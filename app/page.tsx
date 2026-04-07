'use client';

import { useEffect, useMemo, useState } from 'react';

type MonthReport = {
  monthKey: string;
  dates: string[];
  dateLabels: string[];
};

type EntryType = 'NORMAL' | 'LEAVE' | 'BHF';

type Entry = {
  id: string;
  entryDate: string;
  productivity: number;
  entryType: EntryType;
};

type MonthlyRecord = {
  id: string;
  totalWorkingDays: number;
  downtimeMin: number;
};

type EmployeeRow = {
  id: string;
  empId: string;
  name: string;
  monthlyRecord: MonthlyRecord | null;
  entries: Entry[];
  mtd: number;
};

type ReportResponse = {
  month: MonthReport;
  employees: EmployeeRow[];
};

type DraftEntry = {
  value: string;
};

const emptyDraft = (): DraftEntry => ({ value: '' });

export default function Page() {
  const [monthKey, setMonthKey] = useState('');
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [employeeForm, setEmployeeForm] = useState({ empId: '', name: '' });
  const [summaryDrafts, setSummaryDrafts] = useState<Record<string, Partial<MonthlyRecord>>>({});
  const [entryDrafts, setEntryDrafts] = useState<Record<string, Record<string, DraftEntry>>>({});

  const titleMonth = useMemo(() => {
    if (!monthKey) {
      return '';
    }

    const [year, month] = monthKey.split('-');
    return `${month}/${year}`;
  }, [monthKey]);

  const loadReport = async (targetMonthKey: string) => {
    const response = await fetch(`/api/report?month=${encodeURIComponent(targetMonthKey)}`);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      throw new Error(payload.error ?? 'Unable to load report');
    }

    return (await response.json()) as ReportResponse;
  };

  useEffect(() => {
    const current = new Date();
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    setMonthKey(key);
  }, []);

  useEffect(() => {
    if (!monthKey) {
      return;
    }

    setLoading(true);
    loadReport(monthKey)
      .then((data) => {
        setErrorMessage('');
        setReport(data);
      })
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load report');
        setReport({ month: { monthKey, dates: [], dateLabels: [] }, employees: [] });
      })
      .finally(() => setLoading(false));
  }, [monthKey]);

  useEffect(() => {
    if (!report) {
      return;
    }

    const nextSummaryDrafts: Record<string, Partial<MonthlyRecord>> = {};
    const nextEntryDrafts: Record<string, Record<string, DraftEntry>> = {};

    for (const employee of report.employees) {
      nextSummaryDrafts[employee.id] = employee.monthlyRecord ?? {
        totalWorkingDays: 0,
        downtimeMin: 0,
      };

      const employeeEntryDrafts: Record<string, DraftEntry> = {};
      for (const date of report.month.dates) {
        const existing = employee.entries.find((entry) => entry.entryDate === date);
        employeeEntryDrafts[date] = existing
          ? {
              value: existing.entryType === 'LEAVE' ? 'L' : String(existing.productivity),
            }
          : emptyDraft();
      }

      nextEntryDrafts[employee.id] = employeeEntryDrafts;
    }

    setSummaryDrafts(nextSummaryDrafts);
    setEntryDrafts(nextEntryDrafts);
  }, [report]);

  const refresh = async () => {
    if (!monthKey) {
      return;
    }

    try {
      const data = await loadReport(monthKey);
      setErrorMessage('');
      setReport(data);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to refresh data');
    }
  };

  const createEmployee = async () => {
    if (!employeeForm.empId.trim() || !employeeForm.name.trim()) {
      return;
    }

    setSaving(true);
    const response = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empId: employeeForm.empId.trim(),
        name: employeeForm.name.trim(),
        department: '',
      }),
    });

    if (!response.ok) {
      setErrorMessage('Unable to add employee. Check EMP ID uniqueness.');
      setSaving(false);
      return;
    }

    setEmployeeForm({ empId: '', name: '' });
    await refresh();
    setSaving(false);
  };

  const saveSummary = async (employeeId: string) => {
    const summary = summaryDrafts[employeeId];
    if (!summary) {
      return;
    }

    setSaving(true);
    const response = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId,
        monthKey,
        totalWorkingDays: Number(summary.totalWorkingDays ?? 0),
        leaveDays: 0,
        downtimeMin: Number(summary.downtimeMin ?? 0),
        processQuality: '',
        crossTraining: '',
        notes: '',
      }),
    });

    if (!response.ok) {
      setErrorMessage('Unable to save working days / downtime.');
      setSaving(false);
      return;
    }

    setErrorMessage('');
    await refresh();
    setSaving(false);
  };

  const saveEntry = async (employeeId: string, date: string) => {
    const employee = report?.employees.find((item) => item.id === employeeId);
    const draft = entryDrafts[employeeId]?.[date];
    if (!employee || !draft) {
      return;
    }

    const rawValue = draft.value.trim();
    const existing = employee.entries.find((entry) => entry.entryDate === date);

    if (!rawValue) {
      if (existing) {
        setSaving(true);
        await fetch(`/api/entries/${existing.id}`, { method: 'DELETE' });
        await refresh();
        setSaving(false);
      }
      return;
    }

    let entryType: EntryType = 'NORMAL';
    let productivity = 0;

    if (rawValue.toUpperCase() === 'L' || rawValue.toUpperCase() === 'LEAVE') {
      entryType = 'LEAVE';
    } else {
      const parsedProductivity = Number(rawValue);
      if (Number.isNaN(parsedProductivity) || parsedProductivity < 0 || parsedProductivity > 300) {
        setErrorMessage('Daily entry must be a number (0-300) or L for leave.');
        return;
      }
      productivity = Math.round(parsedProductivity);
    }

    setSaving(true);
    const response = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monthlyRecordId: employee.monthlyRecord?.id,
        employeeId,
        monthKey,
        entryDate: date,
        productivity,
        entryType,
        note: '',
      }),
    });

    if (!response.ok) {
      setErrorMessage('Unable to save daily entry.');
      setSaving(false);
      return;
    }

    setErrorMessage('');
    await refresh();
    setSaving(false);
  };

  const deleteEmployee = async (employeeId: string) => {
    setSaving(true);
    const response = await fetch(`/api/employees/${employeeId}`, { method: 'DELETE' });
    if (!response.ok) {
      setErrorMessage('Unable to delete employee.');
      setSaving(false);
      return;
    }

    setErrorMessage('');
    await refresh();
    setSaving(false);
  };

  const exportWorkbook = async () => {
    const response = await fetch(`/api/export?month=${encodeURIComponent(monthKey)}`);
    if (!response.ok) {
      setErrorMessage('Unable to export Excel.');
      return;
    }

    setErrorMessage('');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mtd-${monthKey}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !report) {
    return (
      <main>
        <section className="hero">
          <div>
            <h1>Employee MTD Tracker</h1>
            <p>Loading sheet...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <div>
            <h1>Employee MTD Tracker</h1>
            <p>
              Current sheet: {titleMonth}. Enter daily production as a number or type <strong>L</strong> for leave.
              Only dates up to today are shown in this month.
            </p>
          </div>
          <div className="group">
            <button className="secondary" onClick={exportWorkbook} disabled={!report.employees.length || saving}>
              Export Excel
            </button>
          </div>
        </section>

        <section className="toolbar">
          <div className="group">
            <div className="field">
              <label>Employee ID</label>
              <input
                value={employeeForm.empId}
                onChange={(event) => setEmployeeForm((current) => ({ ...current, empId: event.target.value }))}
                placeholder="11717957"
              />
            </div>
            <div className="field">
              <label>Employee Name</label>
              <input
                value={employeeForm.name}
                onChange={(event) => setEmployeeForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Pooja Gaur"
              />
            </div>
          </div>
          <button onClick={createEmployee} disabled={saving}>
            Add Employee
          </button>
        </section>

        {errorMessage && (
          <section className="panel">
            <p style={{ margin: 0, color: '#991b1b', fontWeight: 700 }}>{errorMessage}</p>
          </section>
        )}

        <section className="grid">
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>EMP ID</th>
                <th>EMP NAME</th>
                {report.month.dateLabels.map((label) => (
                  <th key={label}>{label}</th>
                ))}
                <th>Total Working Days</th>
                <th>Downtime</th>
                <th>MTD %</th>
                <th>Actions</th>
              </tr>
              <tr>
                <th></th>
                <th></th>
                <th></th>
                {report.month.dates.map((date) => (
                  <th key={date}>Prod / L</th>
                ))}
                <th></th>
                <th></th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {report.employees.map((employee, index) => {
                const summary = summaryDrafts[employee.id] ?? {
                  totalWorkingDays: 0,
                  downtimeMin: 0,
                };
                const employeeDateDrafts = entryDrafts[employee.id] ?? {};

                return (
                  <tr key={employee.id}>
                    <td>{index + 1}</td>
                    <td>{employee.empId}</td>
                    <td>{employee.name}</td>
                    {report.month.dates.map((date) => {
                      const draft = employeeDateDrafts[date] ?? emptyDraft();
                      return (
                        <td key={date}>
                          <input
                            className="cell-input"
                            value={draft.value}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              setEntryDrafts((current) => ({
                                ...current,
                                [employee.id]: {
                                  ...current[employee.id],
                                  [date]: { value: nextValue },
                                },
                              }));
                            }}
                            onBlur={() => saveEntry(employee.id, date)}
                            placeholder="112 or L"
                          />
                        </td>
                      );
                    })}
                    <td>
                      <input
                        className="cell-input"
                        type="number"
                        min={0}
                        value={summary.totalWorkingDays ?? 0}
                        onChange={(event) =>
                          setSummaryDrafts((current) => ({
                            ...current,
                            [employee.id]: {
                              ...current[employee.id],
                              totalWorkingDays: Number(event.target.value),
                            },
                          }))
                        }
                        onBlur={() => saveSummary(employee.id)}
                      />
                    </td>
                    <td>
                      <input
                        className="cell-input"
                        type="number"
                        min={0}
                        value={summary.downtimeMin ?? 0}
                        onChange={(event) =>
                          setSummaryDrafts((current) => ({
                            ...current,
                            [employee.id]: {
                              ...current[employee.id],
                              downtimeMin: Number(event.target.value),
                            },
                          }))
                        }
                        onBlur={() => saveSummary(employee.id)}
                      />
                    </td>
                    <td>
                      <span className={`status-pill ${employee.mtd >= 120 ? 'good' : employee.mtd >= 100 ? 'warn' : 'bad'}`}>
                        {employee.mtd}%
                      </span>
                    </td>
                    <td>
                      <button className="danger" type="button" onClick={() => deleteEmployee(employee.id)} disabled={saving}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}

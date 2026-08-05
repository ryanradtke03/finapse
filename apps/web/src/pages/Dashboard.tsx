import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTransactionFilters } from "../hooks/useTransactionFilters";
import {
  TransactionDetailPanel,
  type TransactionEditPatch,
} from "../components/TransactionDetailPanel";
import { CategoryFilterDropdown } from "../components/ui/CategoryFilterDropdown";
import {
  DateRangeControl,
  type DateRangeValue,
} from "../components/ui/DateRangeControl";
import { MultiSelectDropdown } from "../components/ui/MultiSelectDropdown";
import { useBudgets } from "../hooks/useBudgets";
import { useItems } from "../hooks/useItems";
import {
  useDeleteTransaction,
  useTransaction,
  useTransactionCategories,
  useTransactions,
  useTransactionSummary,
  useUpdateTransaction,
} from "../hooks/useTransactions";
import { presetRange } from "../lib/dateRanges";
import {
  getEffectiveCategory,
  getTransactionCategoryColor,
  getTransactionCategoryLabel,
  isCustomCategory,
  TRANSACTION_CATEGORY_OPTIONS,
} from "../lib/transactionCategories";

// same-length window immediately preceding the current one, for "vs last period"
function previousRange(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const rangeMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 86400000);
  const prevStart = new Date(prevEnd.getTime() - rangeMs);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: iso(prevStart), endDate: iso(prevEnd) };
}

function trendLabel(current: number, previous: number): string {
  if (previous === 0) {
    if (current === 0) return "0% vs last period";
    return "UP 100%+ vs last period";
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(pct) < 0.05) return "0% vs last period";
  const dir = pct > 0 ? "UP" : "DOWN";
  return `${dir} ${Math.abs(pct).toFixed(1)}% vs last period`;
}

function formatMoney(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Compact money for tight spots like the category legend (no cents).
function compactMoney(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

// "2026-07-06" → "Jul 6" (parsed as local midnight to avoid an off-by-one day).
function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// A single account's contribution to total balance. Credit-card and loan
// balances are money *owed*, so they subtract; everything else (checking,
// savings, investments) adds. Null balances count as 0.
function signedBalance(a: {
  type: string;
  balanceCurrent: string | null;
}): number {
  if (a.balanceCurrent == null) return 0;
  const bal = Number(a.balanceCurrent);
  const t = a.type.toLowerCase();
  return t === "credit" || t === "loan" ? -bal : bal;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface-raised px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 text-brand-text-secondary">
        {label ? shortDate(label) : ""}
      </p>
      {payload.map((row) => (
        <p key={row.dataKey} className="text-brand-text">
          {row.dataKey === "spending" ? "Spending" : "Income"}:{" "}
          <span className="font-semibold">{formatMoney(row.value)}</span>
        </p>
      ))}
    </div>
  );
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: { label: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface-raised px-3 py-2 text-xs shadow-xl">
      <p className="text-brand-text-secondary">{row.payload.label}</p>
      <p className="font-semibold text-brand-text">{formatMoney(row.value)}</p>
    </div>
  );
}

export default function Dashboard() {
  // Filters live in the URL (like the Transactions page), so views are
  // bookmarkable and the browser Back button steps out of drill-downs.
  const { filters, setFilters } = useTransactionFilters();

  // Resolve the active time-frame to concrete dates for the queries. An empty
  // URL means the default "last 30 days"; an explicit range or custom dates win.
  const queryFilters = useMemo(() => {
    const { range, ...rest } = filters;
    const r = range ?? (!rest.startDate && !rest.endDate ? "30d" : undefined);
    return r ? { ...rest, ...presetRange(r) } : rest;
  }, [filters]);

  // What the date control displays: explicit range/dates, or the 30d default.
  const dateValue: DateRangeValue = {
    range:
      filters.range ??
      (!filters.startDate && !filters.endDate ? "30d" : undefined),
    startDate: filters.startDate,
    endDate: filters.endDate,
  };

  // Income shown by default on the time-series chart (FIN-109); the legend
  // still toggles it off.
  const [showIncome, setShowIncome] = useState(true);

  // Selected recent transaction → opens the detail panel (same as Transactions).
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const items = useItems();
  const summary = useTransactionSummary(queryFilters);
  const list = useTransactions({ ...queryFilters, limit: 10 });
  const detail = useTransaction(selectedId);
  const budgetsQuery = useBudgets();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  // Full distinct-category list for the filter dropdown (same source the
  // Transactions page uses) so options aren't limited to categories that
  // happen to have spending in the current time frame, and come with colors.
  const categoriesQuery = useTransactionCategories();

  const prevFilters = useMemo(() => {
    if (!queryFilters.startDate || !queryFilters.endDate) return undefined;
    return {
      ...queryFilters,
      ...previousRange(queryFilters.startDate, queryFilters.endDate),
    };
  }, [queryFilters]);
  const prevSummary = useTransactionSummary(prevFilters);

  const accounts = items.data?.flatMap((i) => i.accounts) ?? [];

  // For the detail panel: resolve an account id → its bank + mask.
  const accountLookup = useMemo(() => {
    const map = new Map<
      string,
      { institutionName: string; mask: string | null }
    >();
    for (const item of items.data ?? []) {
      for (const a of item.accounts) {
        map.set(a.id, {
          institutionName: item.institutionName ?? "Bank",
          mask: a.mask,
        });
      }
    }
    return map;
  }, [items.data]);

  // Custom categories the user already uses (on transactions or budgets), for
  // reuse in the panel's recategorize picker (FIN-90).
  const customCategories = Array.from(
    new Set(
      [
        ...(categoriesQuery.data ?? []),
        ...(budgetsQuery.data ?? []).map((b) => b.category),
      ].filter(isCustomCategory),
    ),
  ).map((value) => ({ value, label: getTransactionCategoryLabel(value) }));

  const handleSaveTransaction = async (patch: TransactionEditPatch) => {
    if (!selectedId) return;
    await updateMutation.mutateAsync({ id: selectedId, patch });
  };

  const handleDeleteTransaction = async () => {
    if (!selectedId) return;
    await deleteMutation.mutateAsync(selectedId);
    setSelectedId(undefined);
  };

  // Preset / custom-range / arrow changes — replace history (like a dropdown).
  function handleDateChange(v: DateRangeValue) {
    setFilters({
      range: v.range ?? null,
      startDate: v.startDate ?? null,
      endDate: v.endDate ?? null,
    });
  }

  // Clicking a day in the chart narrows the whole dashboard to that single day.
  // Pushes history so Back steps out of it.
  function selectDay(date: string) {
    setFilters(
      { range: null, startDate: date, endDate: date },
      { history: "push" },
    );
  }

  // Clicking a category slice/legend scopes the dashboard to that category
  // (clicking the active one again clears it). Pushes history.
  function selectCategory(keys: string[]) {
    if (keys.length === 0) return;
    const current = filters.category ?? [];
    const same =
      keys.length === current.length && keys.every((k) => current.includes(k));
    setFilters({ category: same ? null : keys }, { history: "push" });
  }

  // Reset every filter back to the default view (last 30 days, all accounts,
  // all categories).
  function clearFilters() {
    setFilters({
      range: null,
      startDate: null,
      endDate: null,
      accountId: null,
      category: null,
      search: null,
    });
  }

  const spent = summary.data?.totalSpent ?? 0;
  const income = summary.data?.totalIncome ?? 0;
  const net = income - spent;

  const prevSpent = prevSummary.data?.totalSpent ?? 0;
  const prevIncome = prevSummary.data?.totalIncome ?? 0;
  const prevNet = prevIncome - prevSpent;

  // Normalize the (multi-select) account filter to an id list.
  const selectedAccountIds = Array.isArray(filters.accountId)
    ? filters.accountId
    : filters.accountId
      ? [filters.accountId]
      : [];

  // Point-in-time balance across accounts, respecting the Account filter.
  // Net of credit-card / loan debt (see signedBalance).
  const balanceAccounts = selectedAccountIds.length
    ? accounts.filter((a) => selectedAccountIds.includes(a.id))
    : accounts;
  const totalBalance = balanceAccounts.reduce(
    (s, a) => s + signedBalance(a),
    0,
  );
  const hasDebt = balanceAccounts.some((a) => {
    const t = a.type.toLowerCase();
    return (
      (t === "credit" || t === "loan") &&
      a.balanceCurrent != null &&
      Number(a.balanceCurrent) !== 0
    );
  });
  const soleAccount =
    selectedAccountIds.length === 1
      ? accounts.find((a) => a.id === selectedAccountIds[0])
      : undefined;
  const balanceSubtitle = soleAccount
    ? `${soleAccount.name}${soleAccount.mask ? ` ··${soleAccount.mask}` : ""}`
    : `across ${balanceAccounts.length} account${balanceAccounts.length === 1 ? "" : "s"}${
        hasDebt ? " · net of card & loan balances" : ""
      }`;

  const days =
    queryFilters.startDate && queryFilters.endDate
      ? Math.max(
          1,
          (new Date(queryFilters.endDate).getTime() -
            new Date(queryFilters.startDate).getTime()) /
            86400000,
        )
      : 30;

  // Fill every day in the selected range (not just days that had activity) so
  // the x-axis is a continuous, evenly-spaced timeline instead of a sparse,
  // jumpy one. Days with no transactions render as zero-height bars.
  const chartData = useMemo(() => {
    const byDate = new Map((summary.data?.byDay ?? []).map((d) => [d.date, d]));
    const start = queryFilters.startDate;
    const end = queryFilters.endDate;
    if (!start || !end) {
      return (summary.data?.byDay ?? []).map((d) => ({
        date: d.date,
        spending: d.spending,
        income: d.income,
      }));
    }
    const out: { date: string; spending: number; income: number }[] = [];
    for (let t = Date.parse(start); t <= Date.parse(end); t += 86400000) {
      const iso = new Date(t).toISOString().slice(0, 10);
      const row = byDate.get(iso);
      out.push({
        date: iso,
        spending: row?.spending ?? 0,
        income: row?.income ?? 0,
      });
    }
    return out;
  }, [summary.data, filters.startDate, filters.endDate]);

  const maxSpendDate = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((max, d) => (d.spending > max.spending ? d : max))
      .date;
  }, [chartData]);

  // Spending-by-category donut: top 6 slices, everything else folded into
  // "Other" so it stays legible regardless of how many categories exist.
  const donutData = useMemo(() => {
    const rows = summary.data?.byCategory ?? [];
    const sorted = [...rows].sort((a, b) => b.total - a.total);
    const slices = sorted.slice(0, 6).map((c) => ({
      key: c.category,
      keys: [c.category],
      label: getTransactionCategoryLabel(c.category),
      value: c.total,
      color: getTransactionCategoryColor(c.category),
    }));
    const rest = sorted.slice(6);
    const restTotal = rest.reduce((sum, c) => sum + c.total, 0);
    if (restTotal > 0) {
      slices.push({
        key: "__other",
        keys: rest.map((c) => c.category),
        label: "Other",
        value: restTotal,
        color: "#6b7280",
      });
    }
    return slices;
  }, [summary.data]);

  const accountOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.name}${a.mask ? ` ··${a.mask}` : ""}`,
  }));

  const categoryOptions = (categoriesQuery.data ?? []).map((value) => ({
    value,
    label: getTransactionCategoryLabel(value),
    color: getTransactionCategoryColor(value),
  }));

  // filters.category is typed string | string[] (shared with TransactionFilters);
  // the Dashboard only ever sets it as an array now — normalize for the control.
  const selectedCategories = Array.isArray(filters.category)
    ? filters.category
    : filters.category
      ? [filters.category]
      : [];

  // Human label for the currently-scoped range, shown next to "Recent
  // transactions" so it's obvious the list reflects the filter/clicked day.
  const scopeLabel =
    queryFilters.startDate && queryFilters.endDate
      ? queryFilters.startDate === queryFilters.endDate
        ? shortDate(queryFilters.startDate)
        : `${shortDate(queryFilters.startDate)} – ${shortDate(queryFilters.endDate)}`
      : null;

  // "View all" should open the Transactions page pre-filtered to the same
  // scope (date range / clicked day, account, categories).
  const viewAllHref = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.range) {
      params.set("range", filters.range);
    } else if (filters.startDate || filters.endDate) {
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
    } else {
      params.set("range", "30d"); // default view
    }
    for (const id of selectedAccountIds) params.append("accountId", id);
    for (const c of selectedCategories) params.append("category", c);
    const qs = params.toString();
    return qs ? `/transactions?${qs}` : "/transactions";
  }, [filters, selectedAccountIds, selectedCategories]);

  // Anything other than the default 30-day / all-accounts / all-categories view.
  const dateIsDefault =
    !filters.startDate &&
    !filters.endDate &&
    (!filters.range || filters.range === "30d");
  const dashboardFilterActive =
    !dateIsDefault ||
    selectedAccountIds.length > 0 ||
    selectedCategories.length > 0;

  return (
    <div className="flex flex-col gap-5">
      {/* filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <MultiSelectDropdown
            label="Account"
            values={selectedAccountIds}
            options={accountOptions}
            onChange={(values) =>
              setFilters({ accountId: values.length ? values : null })
            }
            allLabel="All Accounts"
            className="w-48"
          />
          <DateRangeControl
            label="Time frame"
            value={dateValue}
            onChange={handleDateChange}
            className="w-56"
          />
          <CategoryFilterDropdown
            label="Categories"
            values={selectedCategories}
            options={categoryOptions}
            onChange={(values) =>
              setFilters({ category: values.length ? values : null })
            }
            allLabel="All Categories"
            className="w-44"
          />
          {dashboardFilterActive && (
            <button
              type="button"
              onClick={clearFilters}
              title="Reset to the default view"
              className="flex items-center gap-1.5 self-stretch rounded-xl border border-brand-border-subtle px-4 text-sm font-medium text-brand-text-secondary transition-colors duration-150 hover:border-brand-border hover:text-brand-text"
            >
              Clear filters
              <span className="text-base leading-none">×</span>
            </button>
          )}
        </div>
      </div>

      {/* total balance — point-in-time, respects the account filter */}
      <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
        <p className="text-xs tracking-wide text-brand-text-secondary uppercase">
          Total balance
        </p>
        <p
          className={`mt-1 text-3xl font-bold ${
            totalBalance < 0 ? "text-brand-error" : "text-brand-text"
          }`}
        >
          {totalBalance < 0 ? "-" : ""}
          {formatMoney(Math.abs(totalBalance))}
        </p>
        <p className="mt-1 text-xs text-brand-text-secondary">
          {balanceSubtitle}
        </p>
      </div>

      {/* summary strip */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <p className="text-xs tracking-wide text-brand-text-secondary uppercase">
            Spending
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-error">
            {formatMoney(spent)}
          </p>
          <p className="mt-1 text-xs text-brand-text-secondary">
            {trendLabel(spent, prevSpent)}
          </p>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <p className="text-xs tracking-wide text-brand-text-secondary uppercase">
            Income
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-green">
            {formatMoney(income)}
          </p>
          <p className="mt-1 text-xs text-brand-text-secondary">
            {trendLabel(income, prevIncome)}
          </p>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <p className="text-xs tracking-wide text-brand-text-secondary uppercase">
            Net
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-text">
            {net >= 0 ? "+" : "-"}
            {formatMoney(Math.abs(net))}
          </p>
          <p className="mt-1 text-xs text-brand-text-secondary">
            {trendLabel(net, prevNet)}
          </p>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <p className="text-xs tracking-wide text-brand-text-secondary uppercase">
            Avg / day
          </p>
          <p className="mt-1 text-2xl font-bold text-brand-text">
            {formatMoney(days > 0 ? spent / days : 0)}
          </p>
          <p className="mt-1 text-xs text-brand-text-secondary">
            over {Math.round(days)} days
          </p>
        </div>
      </div>

      {/* charts */}
      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-brand-text">
              Spending over time
            </h3>
            <div className="flex items-center gap-4 text-xs text-brand-text-secondary">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand-green" />
                Spending
              </span>
              <button
                type="button"
                onClick={() => setShowIncome((v) => !v)}
                className="flex cursor-pointer items-center gap-1.5"
              >
                <span
                  className={`h-2 w-2 rounded-full ${showIncome ? "bg-brand-text-secondary" : "border border-brand-text-secondary bg-transparent"}`}
                />
                Income
              </button>
            </div>
          </div>

          {chartData.length === 0 ? (
            <p className="py-16 text-center text-sm text-brand-text-secondary">
              No transactions in this period.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={chartData}
                className="cursor-pointer"
                onClick={(state) => {
                  const date = (state as { activeLabel?: string })?.activeLabel;
                  if (typeof date === "string") selectDay(date);
                }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--color-brand-border-subtle)"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#777777", fontSize: 11 }}
                  tickFormatter={shortDate}
                  interval={Math.max(0, Math.ceil(chartData.length / 8) - 1)}
                  minTickGap={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#777777", fontSize: 11 }}
                  tickFormatter={(v) => `$${v}`}
                  width={48}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "var(--color-brand-border-subtle)" }}
                />
                <Bar
                  dataKey="spending"
                  radius={[4, 4, 0, 0]}
                  onClick={(data) => {
                    const dt = (data as { payload?: { date?: string } })
                      ?.payload?.date;
                    if (dt) selectDay(dt);
                  }}
                >
                  {chartData.map((d) => (
                    <Cell
                      key={d.date}
                      fill="var(--color-brand-green)"
                      fillOpacity={d.date === maxSpendDate ? 1 : 0.55}
                    />
                  ))}
                </Bar>
                {showIncome && (
                  <Bar
                    dataKey="income"
                    fill="var(--color-brand-text-secondary)"
                    fillOpacity={0.6}
                    radius={[4, 4, 0, 0]}
                    onClick={(data) => {
                      const dt = (data as { payload?: { date?: string } })
                        ?.payload?.date;
                      if (dt) selectDay(dt);
                    }}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <h3 className="mb-4 font-semibold text-brand-text">
            Spending by category
          </h3>
          {donutData.length === 0 ? (
            <p className="py-16 text-center text-sm text-brand-text-secondary">
              No spending in this period.
            </p>
          ) : (
            <div className="flex items-center gap-5">
              <div className="relative h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={54}
                      outerRadius={72}
                      paddingAngle={2}
                      stroke="none"
                      className="cursor-pointer"
                      onClick={(_, index) =>
                        selectCategory(donutData[index]?.keys ?? [])
                      }
                    >
                      {donutData.map((d) => (
                        <Cell key={d.key} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-brand-text">
                    {formatMoney(spent)}
                  </span>
                  <span className="text-[10px] tracking-wide text-brand-text-secondary uppercase">
                    total spent
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {donutData.map((d) => {
                  const active =
                    d.keys.length > 0 &&
                    d.keys.every((k) => selectedCategories.includes(k)) &&
                    d.keys.length === selectedCategories.length;
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => selectCategory(d.keys)}
                      className={`flex cursor-pointer items-center justify-between rounded-md px-1.5 py-1 text-left text-xs transition-colors duration-100 hover:bg-brand-surface-raised ${
                        active ? "bg-brand-surface-raised" : ""
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2 text-brand-text">
                        <span
                          className="h-2 w-2 shrink-0 rounded-sm"
                          style={{ backgroundColor: d.color }}
                        />
                        <span className="truncate">{d.label}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="font-medium text-brand-text">
                          {compactMoney(d.value)}
                        </span>
                        <span className="w-7 text-right text-brand-text-secondary">
                          {spent > 0 ? Math.round((d.value / spent) * 100) : 0}%
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* recent transactions */}
      <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-brand-text">
            Transactions
            {scopeLabel && (
              <span className="ml-2 text-sm font-normal text-brand-text-secondary">
                · {scopeLabel}
              </span>
            )}
          </h3>
          <Link
            to={viewAllHref}
            className="text-sm text-brand-green hover:text-brand-green-hover"
          >
            View all
          </Link>
        </div>

        {list.isLoading && (
          <p className="text-sm text-brand-text-secondary">Loading…</p>
        )}

        <div className="flex flex-col">
          {list.data?.transactions.map((t) => {
            const label = t.merchantName ?? t.name;
            const amount = Number(t.amount);
            const isIncome = amount < 0;
            return (
              <button
                type="button"
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`flex w-full items-center justify-between border-t border-brand-border-subtle py-3 text-left transition-colors duration-100 first:border-0 hover:bg-brand-surface-raised ${
                  selectedId === t.id ? "bg-brand-surface-raised" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-surface-raised text-sm font-medium text-brand-text-secondary">
                    {label.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-brand-text">
                      {label}
                    </p>
                    <p className="text-xs text-brand-text-secondary">
                      {getTransactionCategoryLabel(getEffectiveCategory(t))} ·{" "}
                      {shortDate(new Date(t.date).toISOString().slice(0, 10))}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold ${isIncome ? "text-brand-green" : "text-brand-error"}`}
                >
                  {isIncome ? "+" : "-"}
                  {formatMoney(Math.abs(amount))}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <TransactionDetailPanel
        open={!!selectedId}
        transaction={detail.data ?? null}
        loading={detail.isLoading}
        account={
          detail.data ? accountLookup.get(detail.data.accountId) : undefined
        }
        categoryOptions={TRANSACTION_CATEGORY_OPTIONS}
        customCategories={customCategories}
        onClose={() => setSelectedId(undefined)}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
      />
    </div>
  );
}

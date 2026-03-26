"use client"

import { useEffect, useMemo, useId, useState } from "react"
import { getWeekChart } from "@/lib/api/chart/get-week"

// ─── Types ────────────────────────────────────────────────────────────────────
type ApiWeek = {
    success: boolean
    message?: string
    year?: number
    month?: number
    labels?: string[]
    datasets?: { expense?: number[]; income?: number[] }
}

function isApiWeek(x: any): x is Required<Pick<ApiWeek, "labels" | "datasets">> & ApiWeek {
    return (
        x &&
        Array.isArray(x.labels) &&
        x.datasets &&
        Array.isArray(x.datasets.expense) &&
        Array.isArray(x.datasets.income)
    )
}

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmt = (n: number) =>
    new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(n)

const fmtShort = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
    if (n >= 1_000) return Math.round(n / 1_000) + "K"
    return String(n)
}

// ─── Constants ────────────────────────────────────────────────────────────────
const C_EXPENSE = "#D85A30"
const C_INCOME = "#1D9E75"
const C_EXP_BG = "rgba(216,90,48,0.12)"
const C_INC_BG = "rgba(29,158,117,0.10)"

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function RowSkeleton() {
    return (
        <div className="flex items-center gap-3 py-2.5">
            <div className="h-3 w-12 animate-pulse rounded-sm bg-muted" />
            <div className="h-6 flex-1 animate-pulse rounded-sm bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded-sm bg-muted" />
        </div>
    )
}

// ─── Single bar row ───────────────────────────────────────────────────────────
function BarRow({
    label,
    expense,
    income,
    maxVal,
    showIncome,
    index,
}: {
    label: string
    expense: number
    income: number
    maxVal: number
    showIncome: boolean
    index: number
}) {
    const expPct = maxVal > 0 ? (expense / maxVal) * 100 : 0
    const incPct = maxVal > 0 ? (income / maxVal) * 100 : 0

    const diff = income - expense
    const isPos = diff >= 0

    return (
        <div
            className="group relative"
            style={{ animationDelay: `${index * 40}ms` }}
        >
            {/* Hover bg */}
            <div className="absolute inset-0 -mx-3 rounded-lg opacity-0 transition-opacity group-hover:opacity-100 bg-muted/40" />

            <div className="relative flex items-center gap-3 py-2">
                {/* Label */}
                <div className="w-[52px] flex-shrink-0 truncate text-right text-[11px] font-medium text-muted-foreground">
                    {label}
                </div>

                {/* Bars */}
                <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                    {/* Expense bar */}
                    <div className="flex items-center gap-2">
                        <div className="relative h-5 flex-1 overflow-hidden rounded-sm bg-muted/30">
                            <div
                                className="absolute inset-y-0 left-0 flex items-center justify-end pr-1.5 transition-all duration-500"
                                style={{
                                    width: `${expPct}%`,
                                    background: `linear-gradient(90deg, ${C_EXP_BG}, ${C_EXPENSE}88)`,
                                    borderRight: `2px solid ${C_EXPENSE}`,
                                    minWidth: expense > 0 ? "4px" : "0",
                                }}
                            >
                                {expPct > 30 && (
                                    <span className="text-[10px] font-semibold" style={{ color: C_EXPENSE }}>
                                        {fmtShort(expense)}
                                    </span>
                                )}
                            </div>
                            {expPct <= 30 && expense > 0 && (
                                <span
                                    className="absolute left-[calc(100%+4px)] top-1/2 -translate-y-1/2 text-[10px] font-semibold whitespace-nowrap"
                                    style={{
                                        left: `calc(${expPct}% + 4px)`,
                                        color: C_EXPENSE,
                                    }}
                                >
                                    {fmtShort(expense)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Income bar (conditional) */}
                    {showIncome && (
                        <div className="flex items-center gap-2">
                            <div className="relative h-5 flex-1 overflow-hidden rounded-sm bg-muted/30">
                                <div
                                    className="absolute inset-y-0 left-0 flex items-center justify-end pr-1.5 transition-all duration-500"
                                    style={{
                                        width: `${incPct}%`,
                                        background: `linear-gradient(90deg, ${C_INC_BG}, ${C_INCOME}88)`,
                                        borderRight: `2px solid ${C_INCOME}`,
                                        minWidth: income > 0 ? "4px" : "0",
                                    }}
                                >
                                    {incPct > 30 && (
                                        <span className="text-[10px] font-semibold" style={{ color: C_INCOME }}>
                                            {fmtShort(income)}
                                        </span>
                                    )}
                                </div>
                                {incPct <= 30 && income > 0 && (
                                    <span
                                        className="absolute top-1/2 -translate-y-1/2 text-[10px] font-semibold whitespace-nowrap"
                                        style={{
                                            left: `calc(${incPct}% + 4px)`,
                                            color: C_INCOME,
                                        }}
                                    >
                                        {fmtShort(income)}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: values */}
                <div className="w-[130px] flex-shrink-0 text-right">
                    <div className="text-[11px] tabular-nums" style={{ color: C_EXPENSE }}>
                        -{fmt(expense)}
                    </div>
                    {showIncome && (
                        <>
                            <div className="text-[11px] tabular-nums" style={{ color: C_INCOME }}>
                                +{fmt(income)}
                            </div>
                            <div
                                className={`text-[10px] font-medium tabular-nums ${isPos ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                                    }`}
                            >
                                {isPos ? "▲" : "▼"} {fmt(Math.abs(diff))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border/30" />
        </div>
    )
}

// ─── Toggle pill ──────────────────────────────────────────────────────────────
function TogglePill({
    active,
    onClick,
    color,
    children,
}: {
    active: boolean
    onClick: () => void
    color: string
    children: React.ReactNode
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-all ${active
                    ? "border-transparent text-white shadow-sm"
                    : "border-border/50 bg-transparent text-muted-foreground hover:text-foreground"
                }`}
            style={active ? { background: color } : {}}
        >
            <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: active ? "white" : color }}
            />
            {children}
        </button>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function WeekData({ month, year }: { month?: number; year?: number }) {
    const id = useId()

    const [labels, setLabels] = useState<string[]>([])
    const [expense, setExpense] = useState<number[]>([])
    const [income, setIncome] = useState<number[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [meta, setMeta] = useState<{ year: number; month: number } | null>(null)
    const [showIncome, setShowIncome] = useState(false)

    useEffect(() => {
        let cancelled = false
            ; (async () => {
                try {
                    setLoading(true)
                    setError(null)
                    const json: ApiWeek = await getWeekChart()
                    if (cancelled) return
                    if (!json?.success) throw new Error(json?.message || "Ruxsat berilmadi")
                    if (!isApiWeek(json)) throw new Error("API response formati mos emas")
                    setMeta({
                        year: Number(json.year ?? year ?? new Date().getFullYear()),
                        month: Number(json.month ?? month ?? new Date().getMonth() + 1),
                    })
                    setLabels(json.labels)
                    setExpense(json.datasets.expense!.map(Number))
                    setIncome(json.datasets.income!.map(Number))
                } catch (e: any) {
                    if (!cancelled) setError(e?.message ?? "Xatolik")
                } finally {
                    if (!cancelled) setLoading(false)
                }
            })()
        return () => { cancelled = true }
    }, [month, year])

    const maxVal = useMemo(() => {
        const vals = showIncome ? [...expense, ...income] : expense
        return Math.max(1, ...vals.map(Number))
    }, [expense, income, showIncome])

    const totalExp = useMemo(() => expense.reduce((a, b) => a + b, 0), [expense])
    const totalInc = useMemo(() => income.reduce((a, b) => a + b, 0), [income])
    const totalDiff = totalInc - totalExp
    const isProfit = totalDiff >= 0

    const monthLabel = meta
        ? `${meta.year} — ${String(meta.month).padStart(2, "0")}-oy`
        : "Haftalik statistika"

    return (
        <div className="rounded-xl border border-border/50 bg-card shadow-sm">

            {/* ── Header ── */}
            <div className="flex items-start justify-between border-b border-border/30 px-5 py-4">
                <div>
                    <p className="mb-0.5 text-xs text-muted-foreground">Haftalik statistika</p>
                    <p className="text-sm font-medium text-foreground">{monthLabel}</p>
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-1.5">
                    <TogglePill
                        active={!showIncome}
                        onClick={() => setShowIncome(false)}
                        color={C_EXPENSE}
                    >
                        Chiqim
                    </TogglePill>
                    <TogglePill
                        active={showIncome}
                        onClick={() => setShowIncome(true)}
                        color={C_INCOME}
                    >
                        Ikkalasi
                    </TogglePill>
                </div>
            </div>

            {/* ── Summary strip ── */}
            {!loading && !error && (
                <div className="flex gap-px border-b border-border/30 bg-muted/20">
                    <div className="flex flex-1 flex-col items-center gap-0.5 px-4 py-3">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Chiqim</span>
                        <span className="text-sm font-semibold tabular-nums" style={{ color: C_EXPENSE }}>
                            {fmt(totalExp)}
                        </span>
                    </div>
                    {showIncome && (
                        <>
                            <div className="w-px bg-border/30" />
                            <div className="flex flex-1 flex-col items-center gap-0.5 px-4 py-3">
                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Kirim</span>
                                <span className="text-sm font-semibold tabular-nums" style={{ color: C_INCOME }}>
                                    {fmt(totalInc)}
                                </span>
                            </div>
                            <div className="w-px bg-border/30" />
                            <div className="flex flex-1 flex-col items-center gap-0.5 px-4 py-3">
                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                    {isProfit ? "Foyda" : "Zarar"}
                                </span>
                                <span
                                    className={`text-sm font-semibold tabular-nums ${isProfit
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-red-500 dark:text-red-400"
                                        }`}
                                >
                                    {isProfit ? "+" : "-"}{fmt(Math.abs(totalDiff))}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Chart body ── */}
            <div className="px-5 py-3">
                {error ? (
                    <div className="flex items-center justify-center rounded-lg bg-destructive/5 p-6 text-sm text-destructive">
                        {error}
                    </div>
                ) : loading ? (
                    <div className="space-y-0 divide-y divide-border/30">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <RowSkeleton key={i} />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Legend */}
                        <div className="mb-3 flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <span className="h-2 w-2 rounded-sm" style={{ background: C_EXPENSE }} />
                                Chiqim
                            </div>
                            {showIncome && (
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <span className="h-2 w-2 rounded-sm" style={{ background: C_INCOME }} />
                                    Kirim
                                </div>
                            )}
                        </div>

                        {/* Rows */}
                        <div>
                            {labels.map((label, i) => (
                                <BarRow
                                    key={label}
                                    label={label}
                                    expense={expense[i] ?? 0}
                                    income={income[i] ?? 0}
                                    maxVal={maxVal}
                                    showIncome={showIncome}
                                    index={i}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
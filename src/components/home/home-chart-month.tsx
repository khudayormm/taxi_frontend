"use client"

import { useEffect, useMemo, useState } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { getCurrentMonthChart } from "@/lib/api/chart/get-current-month"

type ApiMonthChart = {
    month?: string
    labels: string[]
    series: {
        income: number[]
        expense: number[]
    }
    totals?: {
        income: number
        expense: number
        profit: number
    }
}

const fmtMoney = (n: number) =>
    new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(n)

const fmtShort = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
    if (n >= 1_000) return Math.round(n / 1_000) + "K"
    return String(n)
}

type Props = {
    amount: number
}

// ── Tooltip ──────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-lg border border-border/40 bg-background px-3 py-2 text-xs shadow-md">
            <p className="mb-1 font-medium text-muted-foreground">{label}-kun</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center gap-2">
                    <span
                        className="h-2 w-2 rounded-sm"
                        style={{ background: p.color }}
                    />
                    <span className="text-muted-foreground">
                        {p.dataKey === "income" ? "Kirim" : "Chiqim"}:
                    </span>
                    <span className="font-medium tabular-nums text-foreground">
                        {fmtMoney(p.value)}
                    </span>
                </div>
            ))}
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────────────────
export function MonthIncomeExpenseAreaChart({ amount }: Props) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<ApiMonthChart | null>(null)

    useEffect(() => {
        let alive = true
            ; (async () => {
                try {
                    setLoading(true)
                    setError(null)
                    const res = (await getCurrentMonthChart()) as ApiMonthChart
                    if (!alive) return
                    setData(res)
                } catch (e: any) {
                    if (!alive) return
                    setError(e?.message || "Xatolik yuz berdi")
                } finally {
                    if (!alive) return
                    setLoading(false)
                }
            })()
        return () => { alive = false }
    }, [amount])

    const chartData = useMemo(() => {
        if (!data) return []
        return data.labels.map((d, i) => ({
            day: String(d).slice(8, 10),
            income: Number(data.series?.income?.[i] ?? 0),
            expense: Number(data.series?.expense?.[i] ?? 0),
        }))
    }, [data])

    // Show every 7th day tick
    const xTicks = useMemo(
        () => chartData.filter((_, i) => i === 0 || (i + 1) % 7 === 0).map((d) => d.day),
        [chartData]
    )

    const profit = data?.totals?.profit ?? 0
    const totalIncome = data?.totals?.income ?? 0
    const totalExpense = data?.totals?.expense ?? 0
    const isProfit = profit >= 0

    return (
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">

            {/* ── Header ── */}
            <div className="mb-3 flex items-start justify-between">
                <div>
                    <p className="mb-1 text-xs text-muted-foreground">Joriy oy hisobi</p>

                    {loading ? (
                        <div className="h-7 w-32 animate-pulse rounded-md bg-muted" />
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-medium tabular-nums text-foreground">
                                {isProfit ? "+" : ""}
                                {fmtMoney(profit)}
                            </span>
                            <span
                                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${isProfit
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                    : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                                    }`}
                            >
                                {isProfit ? (
                                    <TrendingUp className="h-3 w-3" />
                                ) : (
                                    <TrendingDown className="h-3 w-3" />
                                )}
                                {isProfit ? "Foyda" : "Zarar"}
                            </span>
                        </div>
                    )}
                </div>

                {data?.month && (
                    <span className="rounded-full border border-border/50 bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                        {data.month}
                    </span>
                )}
            </div>

            {/* ── Stat pills ── */}
            <div className="mb-3 grid grid-cols-2 gap-2">
                <StatPill
                    loading={loading}
                    color="#1D9E75"
                    label="Kirim"
                    value={totalIncome}
                />
                <StatPill
                    loading={loading}
                    color="#D85A30"
                    label="Chiqim"
                    value={totalExpense}
                />
            </div>

            {/* ── Chart ── */}
            {error ? (
                <div className="flex h-[120px] items-center justify-center rounded-lg bg-muted/40 text-sm text-destructive">
                    {error}
                </div>
            ) : loading ? (
                <div className="h-[120px] animate-pulse rounded-lg bg-muted/40" />
            ) : (
                <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={chartData} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#D85A30" stopOpacity={0.18} />
                                <stop offset="95%" stopColor="#D85A30" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                            stroke="currentColor"
                            strokeOpacity={0.07}
                        />

                        <XAxis
                            dataKey="day"
                            ticks={xTicks}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 10, fill: "currentColor", opacity: 0.4 }}
                            tickMargin={6}
                        />

                        <YAxis
                            width={36}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 9, fill: "currentColor", opacity: 0.4 }}
                            tickFormatter={fmtShort}
                            tickCount={4}
                        />

                        <Tooltip content={<CustomTooltip />} cursor={{ strokeOpacity: 0.15 }} />

                        <Area
                            dataKey="income"
                            type="monotone"
                            stroke="#1D9E75"
                            strokeWidth={1.5}
                            fill="url(#gIncome)"
                            dot={false}
                            activeDot={{ r: 3, strokeWidth: 0 }}
                        />
                        <Area
                            dataKey="expense"
                            type="monotone"
                            stroke="#D85A30"
                            strokeWidth={1.5}
                            fill="url(#gExpense)"
                            dot={false}
                            activeDot={{ r: 3, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    )
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function StatPill({
    loading,
    color,
    label,
    value,
}: {
    loading: boolean
    color: string
    label: string
    value: number
}) {
    return (
        <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/40 px-3 py-2">
            <span className="h-2 w-2 flex-shrink-0 rounded-sm" style={{ background: color }} />
            <span className="text-[11px] text-muted-foreground">{label}</span>
            {loading ? (
                <span className="ml-auto h-3.5 w-16 animate-pulse rounded bg-muted" />
            ) : (
                <span className="ml-auto text-[13px] font-medium tabular-nums text-foreground">
                    {fmtMoney(value)}
                </span>
            )}
        </div>
    )
}

function LegendItem({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
            {label}
        </div>
    )
}
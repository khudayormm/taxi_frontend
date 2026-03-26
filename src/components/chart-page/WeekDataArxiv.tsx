"use client"

import { useEffect, useMemo, useRef, useState, useId } from "react"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    type ChartData,
    type ChartOptions,
    type Chart as ChartInstance,
} from "chart.js"
import { Bar } from "react-chartjs-2"
import ChartDataLabels from "chartjs-plugin-datalabels"

import { getWeekChart } from "@/lib/api/chart/get-week"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels)

const transparentize = (rgb: string, alpha: number) => `rgba(${rgb}, ${alpha})`

const CHART_COLORS = {
    red: "255, 99, 132",
    green: "144, 238, 144",
}

type BarChartData = ChartData<"bar", number[], string>

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

const formatUZ = (n: number) => Number(n ?? 0).toLocaleString("ru-RU")

type ViewMode = "expense-only" | "both"

function WeekChartSkeleton({ rows = 6 }: { rows?: number }) {
    return (
        <div className="space-y-4 p-4">
            <Skeleton className="h-8 w-1/2" />
            <div className="space-y-3">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-8 flex-1" />
                        <Skeleton className="h-6 w-36" />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function WeekData({ month, year }: { month?: number; year?: number }) {
    const chartRef = useRef<ChartInstance<"bar"> | null>(null)
    const id = useId()

    const [labels, setLabels] = useState<string[]>([])
    const [expense, setExpense] = useState<number[]>([])
    const [income, setIncome] = useState<number[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [meta, setMeta] = useState<{ year: number; month: number } | null>(null)

    // ✅ Switch holati (true => both)
    const [showBoth, setShowBoth] = useState(false)
    const viewMode: ViewMode = showBoth ? "both" : "expense-only"

    useEffect(() => {
        let cancelled = false

            ; (async () => {
                try {
                    setLoading(true)
                    setError(null)

                    const json: ApiWeek = await getWeekChart()
                    if (cancelled) return

                    if (!json?.success) throw new Error(json?.message || "Ruxsat berilmadi")
                    if (!isApiWeek(json)) throw new Error("API response formati mos emas (labels/datasets topilmadi)")

                    const resolvedYear = Number(json.year ?? year ?? new Date().getFullYear())
                    const resolvedMonth = Number(json.month ?? month ?? new Date().getMonth() + 1)

                    setMeta({ year: resolvedYear, month: resolvedMonth })
                    setLabels(json.labels)
                    setExpense(json.datasets.expense!.map(Number))
                    setIncome(json.datasets.income!.map(Number))
                } catch (e: any) {
                    if (!cancelled) setError(e?.message ?? "Xatolik")
                } finally {
                    if (!cancelled) setLoading(false)
                }
            })()

        return () => {
            cancelled = true
        }
    }, [month, year])

    const datasets = useMemo(() => {
        const expenseDs = {
            label: "Chiqim",
            data: expense,
            backgroundColor: transparentize(CHART_COLORS.red, 0.5),
            borderRadius: 0,
            borderSkipped: false,
        }

        const incomeDs = {
            label: "Kirim",
            data: income,
            backgroundColor: transparentize(CHART_COLORS.green, 0.5),
            borderRadius: 0,
            borderSkipped: false,
        }

        return viewMode === "expense-only" ? [expenseDs] : [expenseDs, incomeDs]
    }, [expense, income, viewMode])

    const data: BarChartData = useMemo(
        () => ({
            labels,
            datasets,
        }),
        [labels, datasets]
    )

    const titleText = meta
        ? `HAFTALIK STATISTIKA — ${meta.year}-${String(meta.month).padStart(2, "0")}`
        : "HAFTALIK STATISTIKA"

    const { suggestedMax } = useMemo(() => {
        const values =
            viewMode === "expense-only"
                ? expense.map((v) => Number(v || 0))
                : [...expense, ...income].map((v) => Number(v || 0))

        const maxValue = Math.max(0, ...values)
        const maxLen = values.reduce((m, v) => Math.max(m, formatUZ(v).length), 0)

        const ratio = Math.min(0.35, 0.12 + maxLen * 0.01)
        const extra = Math.ceil(maxValue * ratio)

        return { suggestedMax: maxValue + extra }
    }, [expense, income, viewMode])

    const options: ChartOptions<"bar"> = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y",
            plugins: {
                legend: { position: "top" },
                title: { display: true, text: titleText },

                datalabels: {
                    anchor: "end",
                    align: "end",
                    offset: -2,
                    clamp: true,
                    clip: false,
                    font: { weight: "bold" },
                    color: (ctx) => {
                        const label = String(ctx.dataset.label || "").toLowerCase()
                        if (label.includes("kirim")) return "rgb(22, 163, 74)"
                        return "rgb(220, 38, 38)"
                    },
                    formatter: (value: unknown, ctx) => {
                        const n = typeof value === "number" ? value : Number(value ?? 0)
                        const label = String(ctx.dataset.label || "").toLowerCase()
                        const sign = label.includes("kirim") ? "+" : "-"
                        return `${sign}${n.toLocaleString("ru-RU")} so'm`
                    },
                },

                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const v = Number(ctx.raw ?? 0)
                            const name = String(ctx.dataset.label || "")
                            const sign = name.toLowerCase().includes("kirim") ? "+" : "-"
                            return `${name}: ${sign}${v.toLocaleString("ru-RU")} so'm`
                        },
                    },
                },
            },

            scales: {
                x: {
                    beginAtZero: true,
                    suggestedMax,
                    ticks: {
                        minRotation: 90,
                        maxRotation: 90,
                        callback: (val) => {
                            const n = Number(val)
                            return Number.isFinite(n) ? n.toLocaleString("ru-RU") : String(val)
                        },
                    },
                },
            },
        }),
        [titleText, suggestedMax]
    )

    const chartHeight = Math.max(520, (labels.length || 6) * 90)
    const skeletonRows = Math.min(10, Math.max(6, labels.length || 6))

    return (
        <div style={{ maxWidth: 900, margin: "0 auto 10px" }}>
            {/* ✅ Switch filter (icons o‘rniga matn) */}
            <div className="bg-background p-3 text-center">
                <div className="group inline-flex items-center gap-3" data-state={showBoth ? "checked" : "unchecked"}>
                    <span
                        id={`${id}-expense`}
                        className="cursor-pointer select-none text-sm font-medium group-data-[state=checked]:text-muted-foreground/70"
                        aria-controls={id}
                        onClick={() => setShowBoth(false)}
                        title="Faqat chiqim"
                    >
                        Faqat chiqim
                    </span>

                    <Switch
                        id={id}
                        checked={showBoth}
                        onCheckedChange={(v) => setShowBoth(Boolean(v))}
                        aria-labelledby={`${id}-both ${id}-expense`}
                        aria-label="Chiqim + Kirim ni yoqish/o‘chirish"
                    />

                    <span
                        id={`${id}-both`}
                        className="cursor-pointer select-none text-sm font-medium group-data-[state=unchecked]:text-muted-foreground/70"
                        aria-controls={id}
                        onClick={() => setShowBoth(true)}
                        title="Chiqim va Kirim"
                    >
                        Chiqim va Kirim
                    </span>
                </div>
            </div>

            {error && <div style={{ color: "crimson" }}>{error}</div>}

            <div style={{ height: chartHeight }}>
                {loading ? (
                    <WeekChartSkeleton rows={skeletonRows} />
                ) : (
                    <Bar
                        ref={(instance) => {
                            chartRef.current = instance ?? null
                        }}
                        options={options}
                        data={data}
                    />
                )}
            </div>
        </div>
    )
}
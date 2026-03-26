"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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

import { Skeleton } from "@/components/ui/skeleton"
import { getYearCategoryChart } from "@/lib/api/chart/get-year-category"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels)

const transparentize = (rgb: string, alpha: number) => `rgba(${rgb}, ${alpha})`

const CHART_COLORS = {
    red: "255, 99, 132",
    green: "144, 238, 144",
}

const MONTH_LABELS_UZ = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"]

type BarChartData = ChartData<"bar", number[], string>

type ApiYearCategory = {
    success: boolean
    message?: string
    year?: number
    categoryId?: number
    type?: "EXPENSE" | "INCOME"
    data?: { month: number; value: number }[]
}

function isApiYearCategory(
    x: any
): x is Required<Pick<ApiYearCategory, "data" | "type" | "year" | "categoryId">> & ApiYearCategory {
    return (
        x &&
        Array.isArray(x.data) &&
        (x.type === "EXPENSE" || x.type === "INCOME") &&
        Number.isFinite(x.year) &&
        Number.isFinite(x.categoryId)
    )
}

const formatUZ = (n: number) => Number(n ?? 0).toLocaleString("ru-RU")

export default function YearCategoryChart({
    year,
    category,
}: {
    year: number
    category: { id: number; name: string; type: "EXPENSE" | "INCOME" } // ✅ eng toza: shu typeni shu yerda yozib qo'y
}) {
    const chartRef = useRef<ChartInstance<"bar"> | null>(null)

    const [values, setValues] = useState<number[]>(Array(12).fill(0))
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [meta, setMeta] = useState<{ year: number; categoryId: number; type: "EXPENSE" | "INCOME" } | null>(null)

    useEffect(() => {
        let cancelled = false

            ; (async () => {
                try {
                    setLoading(true)
                    setError(null)

                    const json: ApiYearCategory = await getYearCategoryChart({
                        year,
                        categoryId: category.id,
                        type: category.type,
                    })
                    if (cancelled) return

                    if (!json?.success) throw new Error(json?.message || "Ruxsat berilmadi")
                    if (!isApiYearCategory(json)) throw new Error("API response formati mos emas")

                    setMeta({ year: json.year, categoryId: json.categoryId, type: json.type })

                    const arr = Array(12).fill(0)
                    for (const item of json.data) {
                        const m = Number(item.month)
                        if (m >= 0 && m <= 11) arr[m] = Number(item.value ?? 0)
                    }
                    setValues(arr)
                } catch (e: any) {
                    if (!cancelled) setError(e?.message ?? "Xatolik")
                } finally {
                    if (!cancelled) setLoading(false)
                }
            })()

        return () => {
            cancelled = true
        }
    }, [year, category.id, category.type])

    const effectiveType = meta?.type ?? category.type

    const dataset = useMemo(() => {
        const isIncome = effectiveType === "INCOME"
        return {
            label: isIncome ? "Kirim" : "Chiqim",
            data: values,
            backgroundColor: transparentize(isIncome ? CHART_COLORS.green : CHART_COLORS.red, 0.5),
            borderRadius: 0,
            borderSkipped: false,
        }
    }, [values, effectiveType])

    const data: BarChartData = useMemo(
        () => ({
            labels: MONTH_LABELS_UZ,
            datasets: [dataset],
        }),
        [dataset]
    )

    // ✅ endi title'da category.name ishlatyapmiz
    const titleText = `YILLIK STATISTIKA — ${year} (${category.name})`

    const { suggestedMax } = useMemo(() => {
        const maxValue = Math.max(0, ...values.map((v) => Number(v || 0)))
        const maxLen = values.reduce((m, v) => Math.max(m, formatUZ(v).length), 0)
        const ratio = Math.min(0.35, 0.12 + maxLen * 0.01)
        const extra = Math.ceil(maxValue * ratio)
        return { suggestedMax: maxValue + extra }
    }, [values])

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
                    color: () => (effectiveType === "INCOME" ? "rgb(22, 163, 74)" : "rgb(220, 38, 38)"),
                    formatter: (value: unknown) => {
                        const n = typeof value === "number" ? value : Number(value ?? 0)
                        const sign = effectiveType === "INCOME" ? "+" : "-"
                        return `${sign}${n.toLocaleString("ru-RU")} so'm`
                    },
                },

                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const v = Number(ctx.raw ?? 0)
                            const sign = effectiveType === "INCOME" ? "+" : "-"
                            const name = String(ctx.dataset.label || "")
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
        [titleText, suggestedMax, effectiveType]
    )

    const chartHeight = 12 * 40

    return (
        <div style={{ maxWidth: 900, margin: "0 auto 10px" }}>
            {error && <div style={{ color: "crimson" }}>{error}</div>}

            <div style={{ height: chartHeight }}>
                {loading ? (
                    <div className="space-y-4 p-4">
                        <Skeleton className="h-8 w-1/2" />
                        <div className="space-y-3">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="h-6 w-40" />
                                    <Skeleton className="h-8 flex-1" />
                                    <Skeleton className="h-6 w-36" />
                                </div>
                            ))}
                        </div>
                    </div>
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
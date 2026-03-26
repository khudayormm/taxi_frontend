"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
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
import { getYearChart } from "@/lib/api/chart/get-year"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels)

const transparentize = (rgb: string, alpha: number) => `rgba(${rgb}, ${alpha})`

const CHART_COLORS = {
    red: "255, 99, 132",
    green: "144, 238, 144",
}

const DEFAULT_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const

type BarChartData = ChartData<"bar", number[], string>

type ApiYearA = {
    success?: boolean
    message?: string
    year?: number
    labels: string[]
    datasets: { expense: number[]; income: number[] }
}

function isApiYearA(x: any): x is ApiYearA {
    return (
        x &&
        Array.isArray(x.labels) &&
        x.datasets &&
        Array.isArray(x.datasets.expense) &&
        Array.isArray(x.datasets.income)
    )
}

const formatUZ = (n: number) => Number(n ?? 0).toLocaleString("ru-RU")

export default function YearData() {
    const chartRef = useRef<ChartInstance<"bar"> | null>(null)

    const [labels, setLabels] = useState<string[]>([...DEFAULT_LABELS])
    const [expense, setExpense] = useState<number[]>(Array(12).fill(0))
    const [income, setIncome] = useState<number[]>(Array(12).fill(0))
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

            ; (async () => {
                try {
                    setLoading(true)
                    setError(null)

                    const json = await getYearChart()

                    if (cancelled) return

                    // agar backend {success:false} qaytarsa ham ushlaymiz
                    if (json?.success === false) {
                        throw new Error(json?.message || "Ruxsat berilmadi")
                    }

                    if (!isApiYearA(json)) {
                        throw new Error("API response formati mos emas (labels/datasets topilmadi)")
                    }

                    setLabels(json.labels?.length ? json.labels : [...DEFAULT_LABELS])
                    setExpense((json.datasets.expense ?? []).map(Number))
                    setIncome((json.datasets.income ?? []).map(Number))
                } catch (e: any) {
                    if (!cancelled) setError(e?.message ?? "Xatolik")
                } finally {
                    if (!cancelled) setLoading(false)
                }
            })()

        return () => {
            cancelled = true
        }
    }, [])

    const data: BarChartData = useMemo(
        () => ({
            labels,
            datasets: [
                {
                    label: "Chiqim",
                    data: expense,
                    backgroundColor: transparentize(CHART_COLORS.red, 0.5),
                    borderRadius: 0,
                    borderSkipped: false,
                },
                {
                    label: "Kirim",
                    data: income,
                    backgroundColor: transparentize(CHART_COLORS.green, 0.5),
                    borderRadius: 0,
                    borderSkipped: false,
                },
            ],
        }),
        [labels, expense, income]
    )

    // ✅ Max qiymat + label uzunligi bo‘yicha: scale max va padding hisoblash
    const { suggestedMax, rightPadPx } = useMemo(() => {
        const all = [...expense, ...income].map((v) => Number(v || 0))
        const maxValue = Math.max(0, ...all)

        const maxLen = all.reduce((m, v) => Math.max(m, formatUZ(v).length), 0)

        const ratio = Math.min(0.35, 0.12 + maxLen * 0.01)
        const extra = Math.ceil(maxValue * ratio)

        const padPx = Math.min(140, 24 + maxLen * 6)

        return { suggestedMax: maxValue + extra, rightPadPx: padPx }
    }, [expense, income])

    const options: ChartOptions<"bar"> = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: "y",

            plugins: {
                legend: { position: "top" },
                title: { display: true, text: "YILLIK STATISTIKA" },

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
                        return `${sign}${n.toLocaleString("ru-RU")}`
                    },

                    // xohlasangiz: 0 bo'lsa ko'rsatmasin
                    // display: (ctx) => Number(ctx.raw ?? 0) !== 0,
                },

                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const v = Number(ctx.raw ?? 0)
                            const name = String(ctx.dataset.label || "")
                            const sign = name.toLowerCase().includes("kirim") ? "+" : "-"
                            return `${name}: ${sign}${v.toLocaleString("ru-RU")}`
                        },
                    },
                },
            },

            scales: {
                x: {
                    beginAtZero: true,
                    suggestedMax,
                    ticks: {
                        callback: (val) => {
                            const n = Number(val)
                            return Number.isFinite(n) ? n.toLocaleString("ru-RU") : String(val)
                        },
                    },
                },
            },
        }),
        [suggestedMax, rightPadPx]
    )

    const chartHeight = Math.max(320, labels.length * 60)

    return (
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
            {loading && <div>Yuklanmoqda...</div>}
            {error && <div style={{ color: "crimson" }}>{error}</div>}

            <div style={{ height: chartHeight }}>
                <Bar
                    ref={(instance) => {
                        chartRef.current = instance ?? null
                    }}
                    options={options}
                    data={data}
                />
            </div>
        </div>
    )
}
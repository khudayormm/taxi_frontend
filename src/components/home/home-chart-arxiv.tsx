"use client"

import { useEffect, useMemo, useState } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { getCurrentMonthChart } from "@/lib/api/chart/get-current-month"


type ApiMonthChart = {
    month?: string
    labels: string[] // YYYY-MM-DD
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

const chartConfig = {
    income: {
        label: "Kirim",
        color: "var(--chart-2)",
        icon: TrendingUp,
    },
    expense: {
        label: "Chiqim",
        color: "var(--chart-1)",
        icon: TrendingDown,
    },
} satisfies ChartConfig

const fmtMoney = (n: number) =>
    new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(n)

type Props = {
    amount: number
}

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
        return () => {
            alive = false
        }
    }, [amount])

    const chartData = useMemo(() => {
        if (!data) return []
        const { labels, series } = data
        return labels.map((d, i) => ({
            day: d, // "2026-02-01"
            income: Number(series?.income?.[i] ?? 0),
            expense: Number(series?.expense?.[i] ?? 0),
        }))
    }, [data])

    const profit = data?.totals?.profit ?? 0
    const profitText =
        profit >= 0 ? `Foyda: +${fmtMoney(profit)}` : `Zarar: -${fmtMoney(Math.abs(profit))}`



    return (
        <Card>
            <CardHeader className="py-3">
                <CardTitle className="text-sm py-0"></CardTitle>
                <CardDescription>

                    <div className="flex w-full items-start gap-2 text-sm">
                        <div className="grid gap-2 w-full">
                            <div className="flex items-center gap-2 leading-none font-medium w-full">
                                {loading ? (
                                    "Hisoblanmoqda..."
                                ) : (
                                    <>
                                        <div className="flex justify-between w-full">
                                            <div>
                                                {profitText}
                                            </div>

                                            <div>
                                                {data?.month}
                                            </div>
                                        </div>
                                        {profit >= 0 ? (
                                            <TrendingUp className="h-4 w-4" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4" />
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </CardDescription>
            </CardHeader>

            <CardContent className="py-2">
                {error ? (
                    <div className="text-sm text-red-500">{error}</div>
                ) : (
                    <ChartContainer config={chartConfig}>
                        <AreaChart
                            accessibilityLayer
                            data={chartData}
                            margin={{ left: 12, right: 12 }}
                        >
                            <CartesianGrid vertical={false} />

                            <XAxis
                                dataKey="day"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                // "2026-02-19" -> "19"
                                tickFormatter={(value) => String(value).slice(8, 10)}
                            />

                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        indicator="line"
                                        // tooltip labelni chiroyli ko'rsatish
                                        labelFormatter={(label) => `Sana: ${label}`}
                                        formatter={(val, name) => [
                                            fmtMoney(Number(val)),
                                            name === "income" ? " Kirim " : " Chiqim ",
                                        ]}
                                    />
                                }
                            />

                            {/* Kirim */}
                            <Area
                                dataKey="income"
                                type="natural"
                                fill="var(--color-income)"
                                fillOpacity={0.35}
                                stroke="var(--color-income)"
                                stackId="a"
                            />

                            {/* Chiqim */}
                            <Area
                                dataKey="expense"
                                type="natural"
                                fill="var(--color-expense)"
                                fillOpacity={0.35}
                                stroke="var(--color-expense)"
                                stackId="a"
                            />

                            <ChartLegend content={<ChartLegendContent />} />
                        </AreaChart>
                    </ChartContainer>
                )}
            </CardContent>

            <CardFooter className="py-0">

            </CardFooter>
        </Card>
    )
}

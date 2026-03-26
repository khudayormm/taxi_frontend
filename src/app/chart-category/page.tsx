"use client"

import { useEffect, useMemo, useState } from "react"

import YearCategoryChart from "@/components/chart-page/YearCategoryData"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCategories } from "@/lib/api/category/get-categories"

const triggerClass =
    "w-full flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all " +
    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground " +
    "data-[state=active]:shadow-md " +
    "text-muted-foreground hover:text-foreground hover:bg-muted"

export type Cat = { id: number; name: string; type: "EXPENSE" | "INCOME" }

const ChartCategoryPage = () => {
    const tg = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null

    const [catType, setCatType] = useState<"EXPENSE" | "INCOME">("EXPENSE")
    const [categories, setCategories] = useState<Cat[]>([])
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)

    const [loadingCats, setLoadingCats] = useState(true)
    const [catsError, setCatsError] = useState<string | null>(null)

    const year = new Date().getFullYear()

    // Telegram back button
    useEffect(() => {
        if (!tg) return

        tg.BackButton?.show()
        const handler = () => window.history.back()
        tg.onEvent("backButtonClicked", handler)

        return () => {
            tg.offEvent("backButtonClicked", handler)
            tg.BackButton?.hide()
        }
    }, [tg])

    // Categories fetch
    useEffect(() => {
        let cancelled = false

            ; (async () => {
                setLoadingCats(true)
                setCatsError(null)

                const res = await getCategories(catType)
                if (cancelled) return

                if (!res?.success) {
                    setCategories([])
                    setSelectedCategoryId(null)
                    setCatsError(res?.message || "Kategoriya olishda xatolik")
                    setLoadingCats(false)
                    return
                }

                const list: Cat[] = (res.categories || []).map((c: any) => ({
                    id: Number(c.id),
                    name: String(c.name),
                    type: c.type as "EXPENSE" | "INCOME",
                }))

                setCategories(list)
                setSelectedCategoryId(list[0]?.id ?? null)
                setLoadingCats(false)
            })()

        return () => {
            cancelled = true
        }
    }, [catType])

    // tanlangan category object
    const selectedCategory = useMemo(
        () => categories.find((c) => c.id === selectedCategoryId) ?? null,
        [categories, selectedCategoryId]
    )

    const showYearChart = !!selectedCategory

    return (
        <div className="w-full">
            <Tabs defaultValue="year">
                {/* ✅ Bitta qator: chapda YILLIK, o‘ngda Chiqim/Kirim */}
                <TabsList className="w-full grid grid-cols-[1fr_auto] items-center bg-background border-0 gap-2 mb-2">
                    <TabsTrigger value="year" className={triggerClass}>
                        <span className="text-xs font-medium py-1">YILLIK</span>
                    </TabsTrigger>

                    {/* Segmented switch */}
                    <div className="flex rounded-xl border bg-muted/40 p-1">
                        <button
                            type="button"
                            onClick={() => setCatType("EXPENSE")}
                            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${catType === "EXPENSE"
                                ? "bg-background shadow text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Chiqim
                        </button>

                        <button
                            type="button"
                            onClick={() => setCatType("INCOME")}
                            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all ${catType === "INCOME"
                                ? "bg-background shadow text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Kirim
                        </button>
                    </div>
                </TabsList>

                <TabsContent value="year">
                    <div className="space-y-4 py-2">
                        {/* Categories select */}
                        <div className="space-y-2">

                            {loadingCats ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : catsError ? (
                                <div className="text-sm text-red-600">{catsError}</div>
                            ) : categories.length === 0 ? (
                                <div className="text-sm text-muted-foreground">Kategoriya yo‘q</div>
                            ) : (
                                <Select
                                    value={selectedCategoryId ? String(selectedCategoryId) : undefined}
                                    onValueChange={(v) => setSelectedCategoryId(Number(v))}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Kategoriyani tanlang..." />
                                    </SelectTrigger>

                                    <SelectContent position="popper">
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={String(cat.id)}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Chart */}
                        {showYearChart && (
                            <YearCategoryChart year={year} category={selectedCategory} />
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default ChartCategoryPage
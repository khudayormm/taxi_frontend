"use client"

import { useEffect, useState } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { getCategories } from "@/lib/api/category/get-categories"

type Category = {
    id: number
    name: string
}

type Props = {
    selectedCategory: number | null
    setSelectedCategory: (category: number) => void
}

const SKELETON_COUNT = 10

export default function IncomeCats({ selectedCategory, setSelectedCategory }: Props) {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<any>(null)

    useEffect(() => {
        let mounted = true

            ; (async () => {
                try {
                    setLoading(true)
                    setError(null)

                    // ✅ Income kategoriyalarini olish
                    const data = await getCategories("INCOME")

                    if (!mounted) return

                    if (!data?.success) {
                        throw new Error(data?.message ?? "Kategoriyalarni olishda xatolik")
                    }

                    setCategories((data.categories ?? []) as Category[])
                } catch (err: any) {
                    if (!mounted) return
                    setError(err?.toJSON ? err.toJSON() : err?.message ?? err)
                } finally {
                    if (!mounted) return
                    setLoading(false)
                }
            })()

        return () => {
            mounted = false
        }
    }, [])

    if (error) return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>

    return (
        <>
            {loading ? (
                <div className="flex flex-wrap gap-2">
                    {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-full border bg-muted/40">
                            <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ))}
                </div>
            ) : (
                <RadioGroup
                    value={selectedCategory == null ? "" : String(selectedCategory)}
                    onValueChange={(value) => setSelectedCategory(Number(value))}
                >
                    {/* ✅ WRAP ko‘rinish */}
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => {
                            const isSelected = selectedCategory === cat.id

                            return (
                                <label
                                    key={cat.id}
                                    className={[
                                        "flex items-center gap-2 px-4 py-2.5 rounded-full border cursor-pointer transition-all duration-200",
                                        "select-none",
                                        isSelected
                                            ? "border-blue-500 bg-blue-500/15 shadow-sm"
                                            : "border-border bg-background hover:bg-muted/60 hover:border-muted-foreground/30",
                                        // ✅ bosilganda bilinishi uchun
                                        "active:scale-[0.98]",
                                    ].join(" ")}
                                >
                                    <RadioGroupItem value={String(cat.id)} id={String(cat.id)} className="flex-shrink-0" />
                                    <span className={["text-sm font-medium", isSelected ? "text-foreground" : "text-muted-foreground"].join(" ")}>
                                        {cat.name}
                                    </span>
                                </label>
                            )
                        })}
                    </div>
                </RadioGroup>
            )}
        </>
    )
}
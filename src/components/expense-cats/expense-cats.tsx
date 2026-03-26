"use client"

import { useEffect, useMemo, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { getCategories } from "@/lib/api/category/get-categories"
import type { WheelPickerOption } from "@/components/wheel-picker"
import { WheelPicker, WheelPickerWrapper } from "@/components/wheel-picker"

type Category = {
    id: number
    name: string
}

type Props = {
    selectedCategory: number | null
    setSelectedCategory: (category: number) => void
}

export default function ExpenseCats({ selectedCategory, setSelectedCategory }: Props) {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<any>(null)

    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    setLoading(true)
                    setError(null)

                    const data = await getCategories("EXPENSE")
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

    const options: WheelPickerOption[] = useMemo(
        () =>
            categories.map((c) => ({
                label: c.name,
                value: String(c.id),
            })),
        [categories]
    )

    // WheelPicker’ga beriladigan value string bo‘lsin
    const value = selectedCategory == null ? undefined : String(selectedCategory)

    if (error) return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>

    if (loading) {
        return (
            <div className="w-full rounded-xl border p-4">
                <div className="space-y-3">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        )
    }

    if (!options.length) {
        return <div className="text-sm text-muted-foreground">Kategoriya topilmadi</div>
    }

    return (
        <WheelPickerWrapper className="mx-auto w-full max-w-full rounded-xl border bg-background p-2">
            <WheelPicker
                options={options}
                // agar component controlled bo‘lsa:
                value={value}
                onValueChange={(v: string) => setSelectedCategory(Number(v))}
                // fallback sifatida default:
                defaultValue={value ?? options[0]?.value}
            />
        </WheelPickerWrapper>
    )
}
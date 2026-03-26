"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { getCategories } from "@/lib/api/category/get-categories"
import type { WheelPickerOption } from "@/components/wheel-picker"
import { WheelPicker, WheelPickerWrapper } from "@/components/wheel-picker"
import { AddCategoryDialog } from "./add-category-modal"

type Category = { id: number; name: string }
type CategoryType = "INCOME" | "EXPENSE"

type Props = {
    type: CategoryType
    selectedCategory: number | null
    setSelectedCategory: (categoryId: number) => void
    className?: string
    title?: string
    showAddButtonWhenHasCategories?: boolean
}

export default function CategoryWheelPicker({
    type,
    selectedCategory,
    setSelectedCategory,
    className,
    title = "Kategoriyalar",
    showAddButtonWhenHasCategories = true,
}: Props) {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true) // faqat birinchi load uchun
    const [refreshing, setRefreshing] = useState(false) // refetch uchun (flicker yo‘q)
    const [error, setError] = useState<any>(null)

    const didInitRef = useRef(false)

    const fetchCategories = useCallback(
        async (mode: "initial" | "refresh" = "refresh") => {
            try {
                if (mode === "initial") setLoading(true)
                else setRefreshing(true)

                setError(null)
                const data = await getCategories(type)

                if (!data?.success) {
                    throw new Error(data?.message ?? "Kategoriyalarni olishda xatolik")
                }

                const next = (data.categories ?? []) as Category[]
                setCategories(next)
            } catch (err: any) {
                setError(err?.toJSON ? err.toJSON() : err?.message ?? err)
            } finally {
                if (mode === "initial") setLoading(false)
                else setRefreshing(false)
            }
        },
        [type]
    )

    // ✅ initial fetch
    useEffect(() => {
        didInitRef.current = false
        fetchCategories("initial")
    }, [fetchCategories])

    // ✅ categories kelgach, selectedCategory yo‘q bo‘lsa birinchisini tanlash (1 marta)
    useEffect(() => {
        if (categories.length === 0) return

        const hasSelected = selectedCategory != null && categories.some((c) => c.id === selectedCategory)
        if (!hasSelected && !didInitRef.current) {
            didInitRef.current = true
            setSelectedCategory(categories[0].id)
        }
    }, [categories, selectedCategory, setSelectedCategory])

    const options: WheelPickerOption[] = useMemo(
        () =>
            categories.map((c) => ({
                label: c.name,
                value: String(c.id),
            })),
        [categories]
    )

    // ✅ controlled value: faqat options ichida bor bo‘lsa beramiz
    const value = useMemo(() => {
        if (selectedCategory == null) return undefined
        const s = String(selectedCategory)
        return options.some((o) => o.value === s) ? s : undefined
    }, [selectedCategory, options])

    if (error) {
        return (
            <pre className={["text-xs whitespace-pre-wrap", className].filter(Boolean).join(" ")}>
                {JSON.stringify(error, null, 2)}
            </pre>
        )
    }

    if (loading) {
        return (
            <div className={["w-full rounded-xl border p-4", className].filter(Boolean).join(" ")}>
                <div className="space-y-3">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        )
    }

    // ✅ kategoriya yo‘q bo‘lsa
    if (!options.length) {
        return (
            <div className={["w-full rounded-xl border bg-background p-4", className].filter(Boolean).join(" ")}>
                <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-foreground">{title}</div>

                    <AddCategoryDialog
                        type={type}
                        onSuccess={() => fetchCategories("refresh")} // ✅ skeletonga qaytmaydi
                    />
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                    Kategoriya topilmadi. Davom etish uchun kategoriya qo‘shing.
                </p>
            </div>
        )
    }

    return (
        <div className={["w-full", className].filter(Boolean).join(" ")}>
            {showAddButtonWhenHasCategories && (
                <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-foreground">{title}</div>
                        {refreshing ? <span className="text-[11px] text-muted-foreground">Yangilanmoqda...</span> : null}
                    </div>

                    <AddCategoryDialog
                        type={type}
                        onSuccess={() => fetchCategories("refresh")} // ✅ flicker yo‘q
                    />
                </div>
            )}

            <WheelPickerWrapper className="mx-auto w-full max-w-full rounded-xl border bg-background p-2">
                <WheelPicker
                    options={options}
                    value={value} // ✅ faqat controlled
                    onValueChange={(v: string) => setSelectedCategory(Number(v))}
                />
            </WheelPickerWrapper>
        </div>
    )
}
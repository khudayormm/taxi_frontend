"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// ✅ faqat shu API bor dedingiz
import { editCategory } from "@/lib/api/category/edit-category"

type CategoryType = "EXPENSE" | "INCOME"

type Category = {
    id: number
    name: string
    description?: string
    type: CategoryType
    _count?: {
        expenses?: number
        incomes?: number
    }
}

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    category: Category | null
    onUpdated?: (updated: Category) => void
    title?: string
}

function RadioCircle({ checked }: { checked: boolean }) {
    return (
        <span
            className={cn(
                "inline-flex h-4 w-4 items-center justify-center rounded-full border transition",
                checked ? "border-primary" : "border-muted-foreground/40"
            )}
            aria-hidden="true"
        >
            <span
                className={cn(
                    "h-2.5 w-2.5 rounded-full transition",
                    checked ? "bg-primary" : "bg-transparent"
                )}
            />
        </span>
    )
}

export function EditCategoryModal({
    open,
    onOpenChange,
    category,
    onUpdated,
    title = "Kategoriyani tahrirlash",
}: Props) {
    const [name, setName] = useState("")
    const [type, setType] = useState<CategoryType>("EXPENSE")
    const [saving, setSaving] = useState(false)

    // ✅ category o'zgarsa form reset
    useEffect(() => {
        if (!category) {
            setName("")
            setType("EXPENSE")
            setSaving(false)
            return
        }
        setName(category.name ?? "")
        setType(category.type ?? "EXPENSE")
        setSaving(false)
    }, [category?.id])

    const canSubmit = useMemo(() => {
        if (!category) return false
        const n = name.trim()
        if (!n) return false
        const unchanged = n === (category.name ?? "").trim() && type === category.type
        return !unchanged && !saving
    }, [category, name, type, saving])

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!category) return

        const n = name.trim()
        if (!n) {
            toast.error("Kategoriya nomini kiriting")
            return
        }

        try {
            setSaving(true)

            const payload = {
                categoryId: category.id, // ✅ MUHIM
                name: n,
                type, // "EXPENSE" | "INCOME"
            }

            const result = await editCategory(payload)

            if (!result?.success) {
                throw new Error(result?.message || "Kategoriya yangilanmadi")
            }

            toast.success(result?.message ?? "Kategoriya yangilandi")

            const updated: Category = {
                ...category,
                name: n,
                type,
            }

            onUpdated?.(updated)
            onOpenChange(false)
        } catch (err: any) {
            toast.error(err?.message || "Saqlashda xatolik")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="top-0 mt-6 translate-y-0 sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                {!category ? (
                    <div className="space-y-4">
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                        <div className="flex justify-end gap-2 pt-2">
                            <Skeleton className="h-9 w-24" />
                        </div>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="space-y-4">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Kategoriya nomi</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Masalan: Oziq-ovqat"
                                disabled={saving}
                            />
                        </div>

                        {/* ✅ Type (Radio + circle) */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Turi</label>

                            <RadioGroup
                                value={type}
                                onValueChange={(v) => setType(v as CategoryType)}
                                className="grid grid-cols-2 gap-2"
                                disabled={saving}
                            >
                                {/* EXPENSE */}
                                <Label
                                    htmlFor="type-expense"
                                    className={cn(
                                        "flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm font-medium transition",
                                        "hover:bg-accent",
                                        type === "EXPENSE"
                                            ? "border-primary bg-primary/10"
                                            : "border-border bg-background"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <RadioCircle checked={type === "EXPENSE"} />
                                        <span>Chiqim</span>
                                    </div>

                                    <RadioGroupItem value="EXPENSE" id="type-expense" className="sr-only" />
                                </Label>

                                {/* INCOME */}
                                <Label
                                    htmlFor="type-income"
                                    className={cn(
                                        "flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm font-medium transition",
                                        "hover:bg-accent",
                                        type === "INCOME"
                                            ? "border-primary bg-primary/10"
                                            : "border-border bg-background"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <RadioCircle checked={type === "INCOME"} />
                                        <span>Kirim</span>
                                    </div>

                                    <RadioGroupItem value="INCOME" id="type-income" className="sr-only" />
                                </Label>
                            </RadioGroup>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={saving}>
                                    Yopish
                                </Button>
                            </DialogClose>

                            <Button type="submit" disabled={!canSubmit}>
                                {saving ? "Saqlanmoqda..." : "Saqlash"}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
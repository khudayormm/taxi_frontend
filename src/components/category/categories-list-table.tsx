"use client"

import { useEffect, useMemo, useState } from "react"
import { PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { getCategories } from "@/lib/api/category/get-categories"
import { deleteCategory } from "@/lib/api/category/delete-category"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { EditCategoryModal } from "./edit-category-modal"

type Category = {
    id: number
    name: string
    description?: string
    type: "EXPENSE" | "INCOME"
    _count?: {
        expenses?: number
        incomes?: number
    }
}

const SKELETON_ROWS = 6

export default function CategoriesListTable({
    type = "EXPENSE",
}: {
    type?: "EXPENSE" | "INCOME"
}) {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<any>(null)

    // edit modal state
    const [editOpen, setEditOpen] = useState(false)
    const [selected, setSelected] = useState<Category | null>(null)

    useEffect(() => {
        let mounted = true

        const fetchCategories = async () => {
            setLoading(true)
            setError(null)

            try {
                const data = await getCategories(type)
                if (!mounted) return

                if (data?.success) {
                    setCategories(data.categories ?? [])
                } else {
                    setError(data?.message ?? "Kategoriyalarni olishda xatolik")
                }
            } catch (err: any) {
                if (!mounted) return
                setError(err?.toJSON ? err.toJSON() : err)
            } finally {
                if (!mounted) return
                setLoading(false)
            }
        }

        fetchCategories()
        return () => {
            mounted = false
        }
    }, [type])

    const handleDelete = async (c: Category) => {
        const ok = confirm(`Kategoriya "${c.name}" o‘chiriladi. Davom etilsinmi?`)
        if (!ok) return

        const res = await deleteCategory({ categoryId: c.id })

        if (res?.success) {
            setCategories((prev) => prev.filter((x) => x.id !== c.id))
            toast.success(res?.message ?? "Kategoriya o‘chirildi")
        } else {
            toast.error(res?.message ?? "Kategoriya o‘chirilmadi")
        }
    }

    const openEdit = (c: Category) => {
        setSelected(c)
        setEditOpen(true)
    }

    const handleUpdated = (updated: Category) => {
        setCategories((prev) =>
            prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)),
        )
    }

    const getCountValue = (c: Category) =>
        type === "EXPENSE" ? (c._count?.expenses ?? 0) : (c._count?.incomes ?? 0)

    if (error) {
        return (
            <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(error, null, 2)}
            </pre>
        )
    }

    return (
        <div className="w-full space-y-3 mt-3">
            <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                    Kategoriyalarni tahrirlash yoki o‘chirish uchun tugmalardan foydalaning
                </p>
            </div>

            {/* ✅ Edit Modal */}
            <EditCategoryModal
                open={editOpen}
                onOpenChange={(v) => {
                    setEditOpen(v)
                    if (!v) setSelected(null)
                }}
                category={selected}
                onUpdated={handleUpdated}
            />

            <div className="[&>div]:rounded-sm [&>div]:border">
                <Table>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                                <TableRow key={i} className="border-b h-12">
                                    <TableCell className="py-2 px-3">
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-40" />
                                            <Skeleton className="h-3 w-28" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2 px-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <>
                                {categories.map((c) => (
                                    <TableRow key={c.id} className="border-b h-12">
                                        <TableCell className="py-2 px-3">
                                            <div className="leading-tight">
                                                <div className="font-medium text-sm">{c.name}</div>

                                                {/* ✅ type ga qarab count */}
                                                <span className="text-muted-foreground text-xs">
                                                    {getCountValue(c)} ta
                                                </span>
                                            </div>
                                        </TableCell>

                                        <TableCell className="py-2 px-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full"
                                                    aria-label={`category-${c.id}-edit`}
                                                    onClick={() => openEdit(c)}
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full text-rose-600 hover:text-rose-700"
                                                    aria-label={`category-${c.id}-remove`}
                                                    onClick={() => handleDelete(c)}
                                                >
                                                    <Trash2Icon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {categories.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="text-muted-foreground py-8 text-center text-sm"
                                        >
                                            Hozircha kategoriyalar yo‘q
                                        </TableCell>
                                    </TableRow>
                                )}
                            </>
                        )}
                    </TableBody>
                </Table>
            </div>

            <p className="text-muted-foreground mt-2 text-center text-sm">
                Categories: ({loading ? "..." : categories.length})
            </p>
        </div>
    )
}
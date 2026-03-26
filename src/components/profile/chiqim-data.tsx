"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { convertToSumma } from "@/lib/utils"
import { format } from "date-fns"
import { uz } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { getExpense } from "@/lib/api/expense/get-expense"
import { deleteExpense } from "@/lib/api/expense/delete-expense"
import { toast } from "sonner"
import { Search, SlidersHorizontal, X, ChevronDown, Calendar, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
// ── agar use-debounce hook yo'q bo'lsa, quyidagini @/hooks/use-debounce.ts ga saqlang:
// import { useEffect, useState } from "react"
// export function useDebounce<T>(value: T, delay = 400): T {
//   const [d, setD] = useState(value)
//   useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t) }, [value, delay])
//   return d
// }

const SKELETON_ROWS = 5
const PAGE_SIZE = 10

type Item = {
    id: number
    amount: any
    description: string
    createdAt: string
    date: string
    category: { id: number; name: string }
}

type SortOption = "newest" | "oldest" | "highest" | "lowest"

const SORT_LABELS: Record<SortOption, string> = {
    newest: "Yangi avval",
    oldest: "Eski avval",
    highest: "Ko'p summa",
    lowest: "Kam summa",
}

export default function ChiqimDataList() {
    const [items, setItems] = useState<Item[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState<any>(null)
    const [page, setPage] = useState(1)
    const [hasNext, setHasNext] = useState(false)
    const [total, setTotal] = useState<number | null>(null)

    const [selectedItem, setSelectedItem] = useState<Item | null>(null)
    const [open, setOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

    // ── Filter state ──
    const [search, setSearch] = useState("")
    const debouncedSearch = useDebounce(search, 400)
    const [filterOpen, setFilterOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
    const [selectedCategoryName, setSelectedCategoryName] = useState<string>("")
    const [sortBy, setSortBy] = useState<SortOption>("newest")
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const filterRef = useRef<HTMLDivElement>(null)

    // Kategoriyalar ro'yxati (filter paneli uchun, birinchi yuklashdan olinadi)
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([])

    const activeFilterCount = [
        !!selectedCategory,
        sortBy !== "newest",
        !!dateFrom,
        !!dateTo,
    ].filter(Boolean).length

    // ── Asosiy fetch (barcha filter parametrlari backend ga yuboriladi) ──
    const fetchPage = useCallback(
        async (targetPage: number, mode: "replace" | "append") => {
            try {
                if (mode === "replace") setLoading(true)
                else setLoadingMore(true)
                setError(null)

                const data = await getExpense({
                    page: targetPage,
                    limit: PAGE_SIZE,
                    search: debouncedSearch || undefined,
                    categoryId: selectedCategory ?? undefined,
                    sortBy,
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined,
                })

                if (!data?.success) throw new Error(data?.message ?? "Xatolik")

                const list: Item[] = (data.expenses ?? []) as Item[]

                if (mode === "replace") {
                    setItems(list)
                    // Kategoriya ro'yxatini faqat birinchi yuklanishda (hech qanday filter yo'q) saqlaymiz
                    if (targetPage === 1 && categories.length === 0 && !selectedCategory && !debouncedSearch) {
                        const map = new Map<number, string>()
                        list.forEach((i) => { if (i.category?.id) map.set(i.category.id, i.category.name) })
                        setCategories(Array.from(map.entries()).map(([id, name]) => ({ id, name })))
                    }
                } else {
                    setItems((prev) => [...prev, ...list])
                }

                setPage(data?.pagination?.page ?? targetPage)
                setHasNext(Boolean(data?.pagination?.hasNext))
                if (data?.pagination?.total != null) setTotal(data.pagination.total)
            } catch (err: any) {
                setError(err?.message ?? err)
            } finally {
                setLoading(false)
                setLoadingMore(false)
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [debouncedSearch, selectedCategory, sortBy, dateFrom, dateTo]
    )

    // Filter o'zgarganda 1-sahifadan qayta yuklash
    useEffect(() => {
        fetchPage(1, "replace")
    }, [fetchPage])

    // Delete keyin aktiv filterlarda qayta yuklash
    const refetchCurrentPages = async (currentPage: number) => {
        try {
            setError(null)
            const allItems: Item[] = []
            for (let p = 1; p <= currentPage; p++) {
                const data = await getExpense({
                    page: p,
                    limit: PAGE_SIZE,
                    search: debouncedSearch || undefined,
                    categoryId: selectedCategory ?? undefined,
                    sortBy,
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined,
                })
                if (!data?.success) throw new Error(data?.message ?? "Xatolik")
                allItems.push(...((data.expenses ?? []) as Item[]))
                if (p === currentPage) {
                    setHasNext(Boolean(data?.pagination?.hasNext))
                    if (data?.pagination?.total != null) setTotal(data.pagination.total)
                }
            }
            setItems(allItems)
            setPage(currentPage)
        } catch (err: any) {
            setError(err?.message ?? err)
        }
    }

    // Filter dropdown tashqarisiga bosganda yopish
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setFilterOpen(false)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    const resetFilters = () => {
        setSelectedCategory(null)
        setSelectedCategoryName("")
        setSortBy("newest")
        setDateFrom("")
        setDateTo("")
    }

    const handleDeleteSubmit = async () => {
        if (!selectedItem) return
        try {
            setDeleting(true)
            await deleteExpense({ expenseId: selectedItem.id })
            setOpen(false)
            await refetchCurrentPages(page)
            toast.success("Chiqim muvaffaqqiyatli o'chirildi", {
                duration: 3000,
                position: "top-center",
                style: { background: "#333", color: "#fff" },
            })
        } catch (err) {
            console.error(err)
        } finally {
            setDeleting(false)
        }
    }

    if (error) {
        return <p className="text-sm text-rose-500">{error}</p>
    }

    return (
        <div className="w-full min-h-[280px] space-y-3">

            {/* ── Search + Filter bar ── */}
            <div className="flex gap-2 items-center">
                {/* Search input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Qidirish..."
                        className={cn(
                            "w-full h-9 pl-8 pr-8 text-sm rounded-md border bg-background",
                            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
                            "placeholder:text-muted-foreground transition-shadow"
                        )}
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter button */}
                <div className="relative" ref={filterRef}>
                    <Button
                        size="sm"
                        variant="outline"
                        className={cn(
                            "h-9 gap-1.5 px-3 text-sm",
                            activeFilterCount > 0 && "border-rose-400 text-rose-600"
                        )}
                        onClick={() => setFilterOpen((v) => !v)}
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Filter</span>
                        {activeFilterCount > 0 && (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white leading-none">
                                {activeFilterCount}
                            </span>
                        )}
                        <ChevronDown className={cn(
                            "h-3 w-3 text-muted-foreground transition-transform duration-200",
                            filterOpen && "rotate-180"
                        )} />
                    </Button>

                    {/* Filter Dropdown Panel */}
                    {filterOpen && (
                        <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border bg-background shadow-xl p-4 space-y-4 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150">

                            {/* Sort */}
                            <div className="space-y-1.5">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Saralash</p>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                                        <button
                                            key={key}
                                            onClick={() => setSortBy(key)}
                                            className={cn(
                                                "text-xs px-2 py-1.5 rounded-md border transition-all font-medium",
                                                sortBy === key
                                                    ? "bg-rose-50 border-rose-400 text-rose-700"
                                                    : "hover:bg-muted text-muted-foreground"
                                            )}
                                        >
                                            {SORT_LABELS[key]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Category */}
                            {categories.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                        <Tag className="h-3 w-3" /> Kategoriya
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        <button
                                            onClick={() => { setSelectedCategory(null); setSelectedCategoryName("") }}
                                            className={cn(
                                                "text-xs px-2.5 py-1 rounded-full border transition-all font-medium",
                                                !selectedCategory
                                                    ? "bg-rose-50 border-rose-400 text-rose-700"
                                                    : "hover:bg-muted text-muted-foreground"
                                            )}
                                        >
                                            Barchasi
                                        </button>
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => {
                                                    setSelectedCategory(cat.id)
                                                    setSelectedCategoryName(cat.name)
                                                }}
                                                className={cn(
                                                    "text-xs px-2.5 py-1 rounded-full border transition-all font-medium",
                                                    selectedCategory === cat.id
                                                        ? "bg-rose-50 border-rose-400 text-rose-700"
                                                        : "hover:bg-muted text-muted-foreground"
                                                )}
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Date range */}
                            <div className="space-y-1.5">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> Sana oralig'i
                                </p>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="flex-1 h-8 px-2 text-xs rounded-md border bg-background focus:outline-none focus:ring-1 focus:ring-rose-400"
                                    />
                                    <span className="text-muted-foreground text-xs shrink-0">—</span>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="flex-1 h-8 px-2 text-xs rounded-md border bg-background focus:outline-none focus:ring-1 focus:ring-rose-400"
                                    />
                                </div>
                            </div>

                            {/* Reset */}
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={resetFilters}
                                    className="w-full text-xs text-rose-500 hover:text-rose-700 font-medium transition-colors flex items-center justify-center gap-1 pt-1 border-t"
                                >
                                    <X className="h-3 w-3" /> Filterni tozalash
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Active filter chips */}
            {(selectedCategory || dateFrom || dateTo) && (
                <div className="flex flex-wrap gap-1.5">
                    {selectedCategory && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-medium">
                            <Tag className="h-2.5 w-2.5" />
                            {selectedCategoryName}
                            <button onClick={() => { setSelectedCategory(null); setSelectedCategoryName("") }} className="hover:text-rose-800">
                                <X className="h-2.5 w-2.5" />
                            </button>
                        </span>
                    )}
                    {dateFrom && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-medium">
                            <Calendar className="h-2.5 w-2.5" /> {dateFrom}
                            <button onClick={() => setDateFrom("")} className="hover:text-rose-800"><X className="h-2.5 w-2.5" /></button>
                        </span>
                    )}
                    {dateTo && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-medium">
                            <Calendar className="h-2.5 w-2.5" /> {dateTo}
                            <button onClick={() => setDateTo("")} className="hover:text-rose-800"><X className="h-2.5 w-2.5" /></button>
                        </span>
                    )}
                </div>
            )}

            {/* ── Table ── */}
            <div className="[&>div]:rounded-sm [&>div]:border min-h-[220px]">
                <Table>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                                <TableRow key={i} className="border-b h-12">
                                    <TableCell className="py-2 px-3">
                                        <div className="space-y-1">
                                            <Skeleton className="h-3.5 w-28" />
                                            <Skeleton className="h-3 w-36" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2 px-3 text-right">
                                        <Skeleton className="h-3.5 w-20 ml-auto" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="py-12 text-center">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Search className="h-8 w-8 opacity-20" />
                                        <p className="text-sm">
                                            {search || activeFilterCount > 0
                                                ? "Hech narsa topilmadi"
                                                : "Hozircha chiqim ma'lumotlari yo'q"}
                                        </p>
                                        {(search || activeFilterCount > 0) && (
                                            <button
                                                onClick={() => { setSearch(""); resetFilters() }}
                                                className="text-xs text-rose-500 hover:text-rose-700 underline"
                                            >
                                                Filtrni tozalash
                                            </button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow
                                    key={item.id}
                                    className="border-b h-12 cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => { setSelectedItem(item); setOpen(true) }}
                                >
                                    <TableCell className="py-2 px-3">
                                        <div className="font-medium text-sm">{item.category?.name ?? "-"}</div>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(item.date), "EEE, dd MMM yyyy, HH:mm", { locale: uz })}
                                        </p>
                                    </TableCell>
                                    <TableCell className="py-2 px-3 text-right">
                                        <span className="font-semibold text-rose-700 text-sm">
                                            − {convertToSumma(item.amount)} so'm
                                        </span>
                                        <p className="text-xs text-muted-foreground">{item.description || "-"}</p>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3">
                <p className="text-muted-foreground text-sm">
                    {loading
                        ? "..."
                        : total != null
                            ? `${items.length} / ${total} ta chiqim`
                            : `Jami: ${items.length} ta chiqim`}
                </p>
                {!loading && hasNext && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchPage(page + 1, "append")}
                        disabled={loadingMore}
                    >
                        {loadingMore ? "Yuklanmoqda..." : "Yana yuklash"}
                    </Button>
                )}
            </div>

            {/* ── Bottom Sheet ── */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="bottom" className="rounded-t-2xl p-0">
                    <div className="flex justify-center pt-3 pb-2">
                        <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
                    </div>
                    {selectedItem && (
                        <div className="px-4 pb-8 space-y-4">
                            <div className="rounded-lg border divide-y text-sm">
                                <div className="flex justify-between px-3 py-2">
                                    <span className="text-muted-foreground">Kategoriya</span>
                                    <span className="font-medium">{selectedItem.category?.name ?? "—"}</span>
                                </div>
                                <div className="flex justify-between px-3 py-2">
                                    <span className="text-muted-foreground">Summa</span>
                                    <span className="font-semibold text-rose-700">
                                        − {convertToSumma(selectedItem.amount)} so'm
                                    </span>
                                </div>
                                <div className="flex justify-between px-3 py-2">
                                    <span className="text-muted-foreground">Sana</span>
                                    <span>{format(new Date(selectedItem.createdAt), "dd MMM yyyy, HH:mm")}</span>
                                </div>
                                <div className="flex justify-between px-3 py-2">
                                    <span className="text-muted-foreground">Izoh</span>
                                    <span className="text-right max-w-[180px]">{selectedItem.description || "—"}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={deleting}>
                                    Bekor qilish
                                </Button>
                                <Button
                                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                                    onClick={handleDeleteSubmit}
                                    disabled={deleting}
                                >
                                    {deleting ? "O'chirilmoqda..." : "O'chirish"}
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { getIncomes } from "@/lib/api/income/get-incomes"
import { convertToSumma } from "@/lib/utils"
import { format } from "date-fns"
import { uz } from "date-fns/locale"
import { Button } from "@/components/ui/button"

const SKELETON_ROWS = 5
const LIMIT = 20

export default function KirimDataList() {
    const [incomes, setIncomes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState<any>(null)

    const [page, setPage] = useState(1)
    const [hasNext, setHasNext] = useState(false)

    const fetchPage = async (targetPage: number, mode: "replace" | "append") => {
        try {
            if (mode === "replace") setLoading(true)
            else setLoadingMore(true)

            setError(null)

            const data = await getIncomes({ page: targetPage, limit: LIMIT })

            if (!data?.success) {
                throw new Error(data?.message ?? "Kirim ma'lumotlarini olishda xatolik")
            }

            const list = data?.incomes ?? []

            if (mode === "replace") setIncomes(list)
            else setIncomes((prev) => [...prev, ...list])

            setPage(data?.pagination?.page ?? targetPage)
            setHasNext(Boolean(data?.pagination?.hasNext))
        } catch (err: any) {
            setError(err?.toJSON ? err.toJSON() : err?.message ?? err)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }

    useEffect(() => {
        let mounted = true

            ; (async () => {
                if (!mounted) return
                setIncomes([])
                setPage(1)
                setHasNext(false)
                await fetchPage(1, "replace")
            })()

        return () => {
            mounted = false
        }
    }, [])

    const handleLoadMore = async () => {
        if (!hasNext || loadingMore) return
        await fetchPage(page + 1, "append")
    }

    if (error) {
        return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
    }

    return (
        <div className="w-full min-h-[280px]">
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
                        ) : (
                            <>
                                {incomes.map((c) => (
                                    <TableRow key={c.id} className="border-b h-12">
                                        <TableCell className="py-2 px-3">
                                            <div className="leading-tight">
                                                <div className="font-medium text-sm">{c?.category?.name ?? "-"}</div>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(c.createdAt), "EEE, dd MMM yyyy, HH:mm", { locale: uz })}
                                                </p>
                                            </div>
                                        </TableCell>

                                        <TableCell className="py-2 px-3 text-right">
                                            <span className="font-semibold text-green-700 text-sm">
                                                + {convertToSumma(c.amount)} so‘m
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {incomes.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-muted-foreground py-10 text-center text-sm">
                                            Hozircha kirim ma&apos;lumotlari yo‘q
                                        </TableCell>
                                    </TableRow>
                                )}
                            </>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-3 flex items-center justify-center gap-3">
                <p className="text-muted-foreground text-center text-sm">
                    Kirim ma&apos;lumotlari: {loading ? "..." : `(${incomes.length})`}
                </p>

                {!loading && hasNext && (
                    <Button size="sm" variant="outline" onClick={handleLoadMore} disabled={loadingMore}>
                        {loadingMore ? "Yuklanmoqda..." : "Yana yuklash"}
                    </Button>
                )}
            </div>
        </div>
    )
}
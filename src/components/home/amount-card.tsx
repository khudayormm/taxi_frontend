"use client"

import React, { useMemo, useState } from "react"
import { convertToSumma, cn } from "@/lib/utils"
import { AnimatedTransactionButton } from "../ui/button-06"
import { KirimModal } from "../kirim-modal/kirim-modal"
import { ChiqimModal } from "../chiqim-modal/ChiqimModal"
import { AnimatePresence, motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type StatusType = "new" | "active" | "inactive" | "destructive"

type Props = {
    title: string
    description?: string
    status?: StatusType
    statusText?: string
    disabled: boolean
    amount: number
    loading: boolean
    setAmount: React.Dispatch<React.SetStateAction<number>>
}

export default function AmountCard({
    title,
    description,
    status,
    statusText,
    disabled,
    amount,
    loading,
    setAmount,
}: Props) {
    const [kirimModalOpen, setKirimModalOpen] = useState(false)
    const [chiqimModalOpen, setChiqimModalOpen] = useState(false)

    const handleOpenKirim = () => {
        if (disabled) return
        setKirimModalOpen(true)
    }

    const handleOpenChiqim = () => {
        if (disabled || amount === 0) return
        setChiqimModalOpen(true)
    }

    const isChiqimDisabled = disabled || amount === 0

    // ✅ Badge o‘rniga ribbon config
    const ribbon = useMemo(() => {
        if (!status) return null

        const map: Record<StatusType, { label: string; className: string }> = {
            new: {
                label: statusText ?? "Yangi",
                className: "bg-amber-500 text-black",
            },
            active: {
                label: statusText ?? "Faol",
                className: "bg-emerald-500 text-white",
            },
            inactive: {
                label: statusText ?? "Nofaol",
                className: "bg-slate-500 text-white",
            },
            destructive: {
                label: statusText ?? "Diqqat",
                className: "bg-rose-500 text-white",
            },
        }

        return map[status]
    }, [status, statusText])

    if (loading) {
        return (
            <Card className="p-0 ring-0 border-2 rounded-2xl relative overflow-hidden shadow-none">
                <CardContent className="p-0">
                    <div className="px-6 py-4 flex flex-col gap-5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-28" />
                                <Skeleton className="h-3 w-44" />
                            </div>
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>

                        <Separator />

                        <div className="flex flex-col items-center gap-3">
                            <Skeleton className="h-7 w-44" />
                            <div className="flex items-center w-full gap-3">
                                <Skeleton className="h-11 w-full rounded-xl" />
                                <Skeleton className="h-11 w-full rounded-xl" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <Card
                className={cn(
                    "p-0 ring-0 border-2 rounded-2xl relative overflow-hidden shadow-none",
                    disabled && "opacity-60"
                )}
            >
                {/* ✅ Ribbon */}
                {ribbon ? (
                    <div className="pointer-events-none absolute right-0 top-0 z-10 h-20 w-20 overflow-hidden">
                        <div
                            className={cn(
                                "absolute right-[-44px] top-[18px] w-[160px] rotate-45 px-1 py-1 text-center text-[10px] font-medium tracking-wide",
                                ribbon.className
                            )}
                        >
                            {ribbon.label}
                        </div>
                    </div>
                ) : null}

                <CardContent className="p-0">
                    <div className="px-6 py-4 flex flex-col gap-5">
                        {/* header */}
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-lg font-medium text-card-foreground">{title}</p>
                                {description ? (
                                    <p className="text-xs font-normal text-muted-foreground">{description}</p>
                                ) : null}
                            </div>
                        </div>

                        <Separator />

                        {/* amount */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative h-[32px] overflow-hidden">
                                <AnimatePresence mode="popLayout">
                                    <motion.h3
                                        key={amount}
                                        initial={{ y: 10, opacity: 0, filter: "blur(4px)" }}
                                        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                                        exit={{ y: -10, opacity: 0, filter: "blur(4px)" }}
                                        transition={{ duration: 0.18, ease: "easeOut" }}
                                        className="text-2xl font-mono tracking-tighter text-card-foreground"
                                    >
                                        {convertToSumma(amount)} so&apos;m
                                    </motion.h3>
                                </AnimatePresence>
                            </div>

                            {/* actions */}
                            <div className="flex items-center w-full gap-3">
                                <AnimatedTransactionButton type="kirim" disabled={disabled} onClick={handleOpenKirim} />
                                <AnimatedTransactionButton type="chiqim" disabled={isChiqimDisabled} onClick={handleOpenChiqim} />
                            </div>

                            {amount === 0 ? (
                                <p className="text-[11px] text-muted-foreground">Chiqim qilish uchun avval kirim kiriting</p>
                            ) : null}
                        </div>
                    </div>

                    {/* optional bg image */}
                    <img
                        src="https://images.shadcnspace.com/assets/backgrounds/stats-01.webp"
                        alt="bg"
                        width={211}
                        height={168}
                        className="absolute bottom-0 right-0 hidden sm:block opacity-40 pointer-events-none select-none"
                    />
                </CardContent>
            </Card>

            {!disabled && (
                <>
                    <KirimModal open={kirimModalOpen} onOpenChange={setKirimModalOpen} setAmount={setAmount} amountData={amount} />
                    <ChiqimModal
                        open={chiqimModalOpen}
                        onOpenChange={setChiqimModalOpen}
                        setAmount={setAmount}
                        amountData={amount}
                    />
                </>
            )}
        </>
    )
}
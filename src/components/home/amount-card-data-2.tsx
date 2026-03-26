"use client"

import React, { useState } from "react"
import { convertToSumma } from "@/lib/utils"
import { AnimatedTransactionButton } from "../ui/button-06"
import { KirimModal } from "../kirim-modal/kirim-modal"
import { ChiqimModal } from "../chiqim-modal/ChiqimModal"
import { AnimatePresence, motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowDownLeft, ArrowUpRight } from "lucide-react"

type StatusType = "new" | "active" | "inactive" | "destructive"

type LastTx = {
    title: string
    amount: number
    createdAt?: string
}

type Props = {
    title: string
    description?: string
    status?: StatusType
    statusText?: string
    disabled: boolean
    amount: number
    loading: boolean
    setAmount: React.Dispatch<React.SetStateAction<number>>
    lastIncome?: LastTx | null
    lastExpense?: LastTx | null
}

function StatusRibbon({ status = "active", text }: { status?: StatusType; text?: string }) {
    const cfg = {
        new: { label: text ?? "Yangi", ribbon: "bg-amber-500" },
        active: { label: text ?? "Faol", ribbon: "bg-emerald-600" },
        inactive: { label: text ?? "Nofaol", ribbon: "bg-slate-600" },
        destructive: { label: text ?? "Diqqat", ribbon: "bg-rose-600" },
    }[status]

    return (
        <div className="pointer-events-none absolute -right-10 top-5 rotate-45">
            <div className={`px-10 py-1 text-[11px] font-semibold text-white shadow-sm ${cfg.ribbon}`}>
                {cfg.label}
            </div>
        </div>
    )
}

function LastTxRow({ type, tx }: { type: "income" | "expense"; tx?: LastTx | null }) {
    const isIncome = type === "income"
    const Icon = isIncome ? ArrowUpRight : ArrowDownLeft

    if (!tx) {
        return (
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground/70">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 opacity-60" />
                    <span>{isIncome ? "Oxirgi kirim" : "Oxirgi chiqim"}: yo‘q</span>
                </div>
                <span>—</span>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
                <Icon className={`h-4 w-4 ${isIncome ? "text-emerald-600" : "text-rose-600"}`} />
                <span className="text-muted-foreground/80 shrink-0">
                    {isIncome ? "Oxirgi kirim:" : "Oxirgi chiqim:"}
                </span>
                <span className="font-medium text-foreground truncate">{tx.title}</span>
            </div>

            <div className="text-right shrink-0">
                <div className={`font-semibold ${isIncome ? "text-emerald-700" : "text-rose-700"}`}>
                    {isIncome ? "+" : "-"}
                    {convertToSumma(tx.amount)} so&apos;m
                </div>
                {tx.createdAt ? (
                    <div className="text-[10px] text-muted-foreground/70">{tx.createdAt}</div>
                ) : null}
            </div>
        </div>
    )
}

const AmountCardData2 = ({
    title,
    description,
    status,
    statusText,
    disabled,
    amount,
    loading,
    setAmount,
    lastIncome,
    lastExpense,
}: Props) => {
    const [kirimModalOpen, setKirimModalOpen] = useState(false)
    const [chiqimModalOpen, setChiqimModalOpen] = useState(false)

    const handleOpenKirim = () => {
        if (disabled) return
        setKirimModalOpen(true)
    }

    const handleOpenChiqim = () => {
        if (disabled) return
        setChiqimModalOpen(true)
    }

    if (loading) {
        return (
            <div className="py-4 border rounded-2xl bg-muted/30">
                <div className="flex flex-col items-center gap-3">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-7 w-44" />
                    <div className="w-full px-5 mt-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                    <div className="flex items-center w-full gap-3 px-5 mt-2">
                        <Skeleton className="h-11 w-full rounded-xl" />
                        <Skeleton className="h-11 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <div
                className={`
          relative overflow-hidden
          flex flex-col items-center gap-2 justify-between
          py-4 border rounded-2xl transition-all
          ${disabled ? "bg-gray-100 opacity-60" : "bg-blue-100"}
        `}
            >
                {status ? <StatusRibbon status={status} text={statusText} /> : null}

                <div className="text-center">
                    <h1 className="uppercase text-blue-800 text-xs text-muted-foreground tracking-widest">
                        {title}
                    </h1>

                    {description ? (
                        <p className="text-xs text-muted-foreground/80 mt-1 mb-2 px-5">
                            {description}
                        </p>
                    ) : (
                        <div className="h-3 mb-2" />
                    )}

                    <div className="relative h-[32px] overflow-hidden">
                        <AnimatePresence mode="popLayout">
                            <motion.h3
                                key={amount}
                                initial={{ y: 10, opacity: 0, filter: "blur(4px)" }}
                                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                                exit={{ y: -10, opacity: 0, filter: "blur(4px)" }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className="text-2xl font-mono tracking-tighter text-muted-foreground"
                            >
                                {convertToSumma(amount)} so&apos;m
                            </motion.h3>
                        </AnimatePresence>
                    </div>
                </div>

                {/* ✅ Oxirgi kirim/chiqim — shaffof */}
                <div className="w-full px-5 mt-1">
                    <div className="rounded-xl border border-black/10 px-3 py-2 space-y-1">
                        <LastTxRow type="income" tx={lastIncome} />
                        <div className="h-px bg-black/10" />
                        <LastTxRow type="expense" tx={lastExpense} />
                    </div>
                </div>

                <div className="flex items-center w-full gap-3 px-5">
                    <AnimatedTransactionButton type="kirim" disabled={disabled} onClick={handleOpenKirim} />
                    <AnimatedTransactionButton type="chiqim" disabled={disabled} onClick={handleOpenChiqim} />
                </div>
            </div>

            {!disabled && (
                <>
                    <KirimModal
                        open={kirimModalOpen}
                        onOpenChange={setKirimModalOpen}
                        setAmount={setAmount}
                        amountData={amount}
                    />
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

export default AmountCardData2
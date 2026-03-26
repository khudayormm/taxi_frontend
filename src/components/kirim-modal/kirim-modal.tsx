"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowDownLeft, ArrowLeft } from "lucide-react"
import { createIncome } from "@/lib/api/income/create-income"
import { cn } from "@/lib/utils"
import CategoryWheelPicker from "../category/wheel-select-category"

interface KirimModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    setAmount: (value: number) => void
    amountData: number
}

const MAX_VALUE = 99_999_999

const kirimSchema = z.object({
    amount: z
        .string()
        .min(1, "Miqdorni kiriting")
        .refine((val) => parseInt(val.replace(/\s/g, ""), 10) > 0, {
            message: "0 dan katta bo'lishi kerak",
        })
        .refine((val) => parseInt(val.replace(/\s/g, ""), 10) <= MAX_VALUE, {
            message: `Maksimal: ${MAX_VALUE.toLocaleString("ru-RU")}`,
        }),
    description: z.string().optional(),
})

type KirimFormData = z.infer<typeof kirimSchema>

const formatSum = (digits: string) => {
    if (!digits) return ""
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

const onlyDigits = (s: string) => (s || "").replace(/\D/g, "")

const clampDigitsToMax = (d: string) => {
    const n = parseInt(d || "0", 10)
    if (!Number.isFinite(n)) return ""
    if (n <= 0) return ""
    if (n > MAX_VALUE) return String(MAX_VALUE)
    return String(n)
}

export function KirimModal({ open, onOpenChange, setAmount, amountData }: KirimModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

    const [digits, setDigits] = useState("")
    const [isFocused, setIsFocused] = useState(false)

    const {
        handleSubmit,
        formState: { errors },
        setValue,
        reset,
    } = useForm<KirimFormData>({
        resolver: zodResolver(kirimSchema),
        mode: "onChange",
        defaultValues: { amount: "", description: "" },
    })

    useEffect(() => {
        setValue("amount", formatSum(digits), { shouldValidate: true })
    }, [digits, setValue])

    useEffect(() => {
        if (!open) {
            setIsFocused(false)
            setError(null)
            setSelectedCategory(null)
            setDigits("")
            reset({ amount: "", description: "" })
        }
    }, [open, reset])

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value
        const nextDigits = clampDigitsToMax(onlyDigits(raw))
        setDigits(nextDigits)
        setError(null)
    }

    const onSubmit = async (data: KirimFormData) => {
        setLoading(true)
        setError(null)

        try {
            const amountNumber = parseInt(data.amount.replace(/\s/g, ""), 10)

            if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
                setError("Miqdor 0 dan katta bo'lishi kerak")
                return
            }
            if (amountNumber > MAX_VALUE) {
                setError(`Maksimal summa: ${MAX_VALUE.toLocaleString("ru-RU")}`)
                return
            }
            if (selectedCategory === null) {
                setError("Turini tanlang")
                return
            }

            const result = await createIncome({
                amount: amountNumber,
                categoryId: selectedCategory,
                description: data.description,
            })

            if (result?.success === false) {
                setError(typeof result === "string" ? result : (result as any)?.message ?? "Xatolik")
                return
            }

            reset({ amount: "", description: "" })
            setDigits("")
            setIsFocused(false)

            setAmount(amountData + amountNumber)
            onOpenChange(false)
        } catch (err: any) {
            setError(err?.message ?? "Xatolik")
        } finally {
            setLoading(false)
        }
    }

    const formattedAmount = useMemo(() => formatSum(digits), [digits])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                style={{
                    "--tw-enter-translate-x": "0%",
                    "--tw-exit-translate-x": "0%",
                    "--tw-enter-scale": "1",
                    "--tw-exit-scale": "1",
                } as React.CSSProperties}
                className={cn(
                    "w-screen h-[100dvh] max-w-none rounded-none p-0 border-0 shadow-none bg-background",
                    "flex flex-col overflow-hidden",
                    "!bottom-0 !top-auto !left-0 !translate-x-0 !translate-y-0",
                    "data-[state=open]:slide-in-from-bottom-full data-[state=closed]:slide-out-to-bottom-full duration-300"
                )}
            >
                {/* 1. Header: Chiziqcha va kichkina sarlavha */}
                <div className="pt-3 pb-2 shrink-0">
                    <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3" />
                    <DialogHeader>
                        <DialogTitle className="text-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                            Pulni kirim qilish
                        </DialogTitle>
                    </DialogHeader>
                </div>

                {/* 2. Content */}
                <div className="flex-1 px-4 flex flex-col gap-3 overflow-hidden mt-1">

                    {/* Amount Input */}
                    <div className="shrink-0 space-y-1">
                        <div
                            className={cn(
                                "group relative flex flex-row items-center justify-between rounded-xl border transition-all duration-300",
                                "bg-muted/30 px-3 py-2",
                                isFocused
                                    ? "border-primary/60 bg-primary/5 ring-2 ring-primary/10"
                                    : "border-input hover:border-ring/40"
                            )}
                            onClick={() => setIsFocused(true)}
                        >
                            <div className="flex flex-col flex-1 gap-0">
                                <span
                                    className={cn(
                                        "text-[9px] font-bold uppercase tracking-widest transition-colors duration-300",
                                        isFocused ? "text-primary" : "text-muted-foreground/70"
                                    )}
                                >
                                    Summa
                                </span>

                                <Input
                                    id="amount"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={formattedAmount}
                                    onChange={handleAmountChange}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    pattern="[0-9\s]*"
                                    className={cn(
                                        "h-6 border-0 bg-transparent p-0 shadow-none",
                                        "text-xl font-mono font-bold tracking-tight",
                                        "focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40",
                                        errors.amount ? "text-destructive" : "text-foreground"
                                    )}
                                />
                            </div>

                            <div
                                className={cn(
                                    "ml-2 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider transition-all duration-300",
                                    isFocused
                                        ? "bg-primary text-primary-foreground shadow-sm scale-105"
                                        : "bg-muted-foreground/10 text-muted-foreground"
                                )}
                            >
                                UZS
                            </div>
                        </div>

                        {/* Xatolik xabarlari */}
                        <div className="min-h-[16px] px-1">
                            {errors.amount && <p className="text-[11px] font-medium text-destructive leading-none">{errors.amount.message}</p>}
                            {error && <p className="text-[11px] font-medium text-destructive leading-none">{String(error)}</p>}
                        </div>
                    </div>

                    {/* Wheel Picker: Border va shadow umuman olib tashlandi */}
                    <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
                        <CategoryWheelPicker
                            type="INCOME"
                            showAddButtonWhenHasCategories={true}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                        />
                    </div>
                </div>

                {/* 3. Footer */}
                <div className="shrink-0 border-t border-border/50 bg-background/90 backdrop-blur-xl px-4 py-3 pb-6">
                    <Button
                        type="button"
                        disabled={!selectedCategory || loading || digits.length === 0}
                        className={cn(
                            "w-full h-11 text-[14px] font-semibold rounded-lg transition-all",
                            "bg-[#0088cc] hover:bg-[#0077b5] text-white",
                            "disabled:opacity-50 disabled:shadow-none"
                        )}
                        onClick={handleSubmit(onSubmit)}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                                Jarayonda...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <ArrowDownLeft className="h-4 w-4" />
                                Pul Kirim Qilish
                            </div>
                        )}
                    </Button>

                    <Button
                        type="button"
                        onClick={() => {
                            reset()
                            setDigits("")
                            setIsFocused(false)
                            onOpenChange(false)
                        }}
                        variant="outline"
                        // Orqaga tugmasi: Border qoshildi, Slate rangida
                        className={cn(
                            "mt-2 w-full h-10 gap-2 text-[13px] font-medium transition-all rounded-lg",
                            "border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300",
                            "hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Orqaga qaytish
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import _ as z from "zod"
import _ as Portal from "@radix-ui/react-portal"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
ArrowDownLeft, ArrowLeft, ArrowRight,
CalendarDays, CheckCircle2, FileText, Tag,
} from "lucide-react"

import { createExpense } from "@/lib/api/expense/create-expense"
import { getCategories } from "@/lib/api/category/get-categories"
import CategoryWheelPicker from "../category/wheel-select-category"
import DateTimeWheel, { type DateTimeWheelRef, type DateTimeValue } from "../time-wheel/DateTimeWheel"

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChiqimModalProps {
open: boolean
onOpenChange: (open: boolean) => void
setAmount: (value: number) => void
amountData: number
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_VALUE = 99_999_999

const amountSchema = z.object({
amount: z
.string()
.min(1, "Miqdorni kiriting")
.refine((val) => parseInt(val.replace(/\s/g, ""), 10) > 0, {
message: "Miqdor 0 dan katta bo'lishi kerak",
})
.refine((val) => parseInt(val.replace(/\s/g, ""), 10) <= MAX_VALUE, {
message: `Maksimal summa: ${MAX_VALUE.toLocaleString("ru-RU")}`,
}),
})

type AmountFormData = z.infer<typeof amountSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatSum = (digits: string) =>
digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : ""

const onlyDigits = (s: string) => (s || "").replace(/\D/g, "")

const clampDigitsToMax = (d: string) => {
const n = parseInt(d || "0", 10)
if (!Number.isFinite(n) || n <= 0) return ""
return n > MAX_VALUE ? String(MAX_VALUE) : String(n)
}

const formatDisplayDate = (d: Date): string =>
d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "long", year: "numeric" })

const nowDateValue = (): DateTimeValue => {
const n = new Date()
return { day: n.getDate(), month: n.getMonth() + 1, year: n.getFullYear(), hour: n.getHours(), minute: n.getMinutes() }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ChiqimModal({ open, onOpenChange, amountData, setAmount }: ChiqimModalProps) {
// UI state
const [step, setStep] = useState<1 | 2>(1)
const [showDatePicker, setShowDatePicker] = useState(false)

    // Form state
    const [digits, setDigits] = useState("")
    const [isFocused, setIsFocused] = useState(false)
    const [description, setDescription] = useState("")

    // Category
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
    const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null)
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([])

    // Date
    const [selectedDate, setSelectedDate] = useState<DateTimeValue>(nowDateValue)
    const [displayDate, setDisplayDate] = useState(() => formatDisplayDate(new Date()))
    const dateWheelRef = useRef<DateTimeWheelRef>(null)

    // API
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const {
        formState: { errors },
        setValue,
        reset,
    } = useForm<AmountFormData>({
        resolver: zodResolver(amountSchema),
        mode: "onChange",
        defaultValues: { amount: "" },
    })

    // Sync amount input with form
    useEffect(() => {
        setValue("amount", formatSum(digits), { shouldValidate: true })
    }, [digits, setValue])

    // Load categories once
    useEffect(() => {
        getCategories({ type: "EXPENSE" })
            .then((data) => { if (Array.isArray(data)) setCategories(data) })
            .catch(() => { })
    }, [])

    // Reset on close
    useEffect(() => {
        if (!open) {
            setStep(1)
            setShowDatePicker(false)
            setDigits("")
            setDescription("")
            setIsFocused(false)
            setSelectedCategory(null)
            setSelectedCategoryName(null)
            setError(null)
            setSelectedDate(nowDateValue())
            setDisplayDate(formatDisplayDate(new Date()))
            reset({ amount: "" })
        }
    }, [open, reset])

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDigits(clampDigitsToMax(onlyDigits(e.target.value)))
        setError(null)
    }

    const handleStep1Continue = () => {
        if (!digits || parseInt(digits, 10) <= 0) { setError("Miqdorni kiriting"); return }
        if (!selectedCategory) { setError("Turini tanlang"); return }
        setError(null)
        setStep(2)
    }

    const handleDateConfirm = () => {
        const val = dateWheelRef.current?.getValue()
        if (val) {
            setSelectedDate(val)
            setDisplayDate(formatDisplayDate(new Date(val.year, val.month - 1, val.day)))
        }
        setShowDatePicker(false)
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError(null)
        try {
            const amountNumber = parseInt(digits, 10)
            const isoDate = new Date(
                selectedDate.year, selectedDate.month - 1, selectedDate.day,
                selectedDate.hour, selectedDate.minute
            ).toISOString()

            const result = await createExpense({
                amount: amountNumber,
                categoryId: selectedCategory!,
                description: description.trim() || undefined,
                date: isoDate,
            })

            if (result?.success === false) {
                setError((result as any)?.message ?? "Xatolik")
                return
            }

            setAmount(amountData - amountNumber)
            onOpenChange(false)
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.response?.data?.error || err?.message || "Xatolik")
        } finally {
            setLoading(false)
        }
    }

    const formattedAmount = useMemo(() => formatSum(digits), [digits])

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="w-screen h-[100dvh] max-w-none left-0 top-0 translate-x-0 translate-y-0 rounded-none p-0 overflow-hidden border-0 shadow-none flex flex-col"
                >
                    {/* ── Header ── */}
                    <div className="px-6 pt-4 shrink-0">
                        <DialogHeader>
                            <DialogTitle className="text-center text-sm font-medium text-muted-foreground tracking-wide uppercase">
                                {step === 1 ? "Chiquvchi summani ro'yxatga olish" : "Izoh qo'shish"}
                            </DialogTitle>
                        </DialogHeader>

                        {/* Step dots */}
                        <div className="flex items-center justify-center gap-1.5 mt-3">
                            <div className={["h-1.5 rounded-full transition-all", step === 1 ? "w-5 bg-blue-500" : "w-1.5 bg-blue-500/40"].join(" ")} />
                            <div className={["h-1.5 rounded-full transition-all", step === 2 ? "w-5 bg-blue-500" : "w-1.5 bg-muted-foreground/20"].join(" ")} />
                        </div>
                    </div>

                    {/* ── Step 1: Summa + Kategoriya ── */}
                    {step === 1 && (
                        <>
                            <div className="flex-1 px-6 overflow-hidden pb-28 space-y-4 mt-4">
                                {/* Amount input */}
                                <div className="space-y-2">
                                    <div
                                        className={["relative rounded-xl border transition-all bg-muted/40 px-3 pt-2 pb-2",
                                            isFocused
                                                ? "border-blue-500/60 ring-4 ring-blue-500/15 shadow-[0_0_0_1px_rgba(59,130,246,0.35)]"
                                                : "border-border hover:border-blue-500/30",
                                        ].join(" ")}
                                        onClick={() => setIsFocused(true)}
                                    >
                                        <div className={["absolute left-4 top-2 text-[10px] font-semibold tracking-widest uppercase transition-colors",
                                            isFocused ? "text-blue-600" : "text-muted-foreground/70"].join(" ")}>
                                            Summa
                                        </div>
                                        <Input
                                            id="amount" type="text" inputMode="numeric" placeholder="0"
                                            value={formattedAmount}
                                            onChange={handleAmountChange}
                                            onFocus={() => setIsFocused(true)}
                                            onBlur={() => setIsFocused(false)}
                                            pattern="[0-9\s]*"
                                            className={["mt-4 h-8 border-0 bg-transparent px-1 pr-14 text-xl font-mono font-semibold tracking-tight leading-none focus-visible:ring-0 focus-visible:ring-offset-0",
                                                errors.amount ? "text-rose-600" : "text-foreground"].join(" ")}
                                        />
                                        <span className={["absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all",
                                            isFocused ? "bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/20" : "bg-muted text-muted-foreground ring-1 ring-border"].join(" ")}>
                                            UZS
                                        </span>
                                    </div>
                                    {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
                                    {error && <p className="text-xs text-red-500">{error}</p>}
                                </div>

                                {/* Category */}
                                <CategoryWheelPicker
                                    type="EXPENSE"
                                    showAddButtonWhenHasCategories={true}
                                    selectedCategory={selectedCategory}
                                    setSelectedCategory={(id: number) => {
                                        setSelectedCategory(id)
                                        setSelectedCategoryName(categories.find(c => c.id === id)?.name ?? null)
                                    }}
                                />
                            </div>

                            {/* Footer step 1 */}
                            <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur px-4 py-3 space-y-2">
                                <Button
                                    type="button"
                                    disabled={!selectedCategory || digits.length === 0}
                                    className="w-full h-11 text-base font-semibold rounded-lg bg-[#0088cc] hover:bg-[#0077b5] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    onClick={handleStep1Continue}
                                >
                                    <div className="flex items-center gap-2">
                                        <ArrowDownLeft className="h-5 w-5" />
                                        Pul Chiqim Qilish
                                        <ArrowRight className="h-4 w-4 ml-auto opacity-60" />
                                    </div>
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => onOpenChange(false)}
                                    className="w-full h-10 gap-2 text-sm font-medium text-muted-foreground bg-muted/40 hover:bg-muted/70 active:scale-[0.98] transition-all ring-1 ring-border"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Orqaga
                                </Button>
                            </div>
                        </>
                    )}

                    {/* ── Step 2: Izoh + Sana ── */}
                    {step === 2 && (
                        <>
                            <div className="flex-1 px-6 pt-4 overflow-y-auto flex flex-col gap-3 pb-28">
                                {/* Kategoriya ko'rsatish */}
                                {selectedCategoryName && (
                                    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3">
                                        <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                                            <Tag className="h-4 w-4 text-rose-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/50">Kategoriya</p>
                                            <p className="text-sm font-semibold text-foreground mt-0.5">{selectedCategoryName}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Sana tugmasi */}
                                <button
                                    type="button"
                                    onClick={() => setShowDatePicker(true)}
                                    className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 flex items-center justify-between hover:border-blue-500/40 hover:bg-muted/60 active:scale-[0.99] transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                            <CalendarDays className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/50">Sana</p>
                                            <p className="text-sm font-semibold text-foreground mt-0.5">{displayDate}</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
                                </button>

                                {/* Izoh */}
                                <div className="rounded-xl border bg-muted/40 px-4 pt-3 pb-2 focus-within:border-blue-500/60 focus-within:ring-4 focus-within:ring-blue-500/15 border-border transition-all duration-200">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <FileText className="h-3 w-3 text-muted-foreground/50" />
                                        <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/50">Izoh (ixtiyoriy)</span>
                                    </div>
                                    <textarea
                                        value={description}
                                        onChange={(e) => { if (e.target.value.length <= 200) setDescription(e.target.value) }}
                                        placeholder="Masalan: Do'kondan oziq-ovqat, kafe, transport..."
                                        rows={2}
                                        className="w-full bg-transparent resize-none outline-none text-sm font-medium leading-relaxed text-foreground placeholder:text-muted-foreground/30"
                                    />
                                    <div className="flex justify-end">
                                        <span className={["text-[10px] tabular-nums", description.length > 180 ? "text-rose-500 font-semibold" : "text-muted-foreground/30"].join(" ")}>
                                            {description.length}/200
                                        </span>
                                    </div>
                                </div>

                                {error && <p className="text-xs text-red-500 px-1">{error}</p>}
                            </div>

                            {/* Footer step 2 */}
                            <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur px-4 py-3 space-y-2">
                                <Button
                                    type="button"
                                    disabled={loading}
                                    onClick={handleSubmit}
                                    className="w-full h-11 text-base font-semibold rounded-lg bg-[#0088cc] hover:bg-[#0077b5] text-white transition-all"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin" />
                                            Saqlanmoqda...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5" />
                                            Saqlash
                                        </div>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => { setError(null); setStep(1) }}
                                    className="w-full h-10 gap-2 text-sm font-medium text-muted-foreground bg-muted/40 hover:bg-muted/70 active:scale-[0.98] transition-all ring-1 ring-border"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Orqaga
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Date Picker: Portal orqali Dialog ustidan chiqadi ── */}
            {open && showDatePicker && (
                <Portal.Root>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        style={{ zIndex: 9998 }}
                        onClick={() => setShowDatePicker(false)}
                    />

                    {/* Bottom sheet */}
                    <div
                        className="fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl flex flex-col"
                        style={{ zIndex: 9999, boxShadow: "0 -8px 48px rgba(0,0,0,0.22)" }}
                    >
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
                        </div>

                        {/* Header */}
                        <div className="px-5 pb-3 border-b border-border/40">
                            <p className="text-center text-sm font-medium text-muted-foreground tracking-wide uppercase">
                                Sana tanlash
                            </p>
                        </div>

                        {/* Wheel — key bilan remount qilinadi, qotib qolmaydi */}
                        <div className="px-5 pt-5 pb-4">
                            <DateTimeWheel
                                key={`wheel-${showDatePicker}-${selectedDate.day}-${selectedDate.month}-${selectedDate.year}`}
                                ref={dateWheelRef}
                                large
                                defaultValue={selectedDate}
                            />
                        </div>

                        {/* Buttons */}
                        <div className="px-5 pb-8 pt-2 flex gap-2">
                            <Button
                                type="button"
                                onClick={() => setShowDatePicker(false)}
                                className="flex-1 h-11 text-sm font-medium rounded-xl text-muted-foreground bg-muted/40 hover:bg-muted/70 ring-1 ring-border"
                            >
                                Bekor
                            </Button>
                            <Button
                                type="button"
                                onClick={handleDateConfirm}
                                className="flex-[2] h-11 text-base font-semibold rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Tasdiqlash
                            </Button>
                        </div>
                    </div>
                </Portal.Root>
            )}
        </>
    )

}

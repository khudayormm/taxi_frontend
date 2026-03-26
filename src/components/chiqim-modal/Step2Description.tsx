"use client"

import { useState } from "react"
import {
    ArrowDownLeft, ArrowLeft, ArrowRight,
    CalendarDays, CheckCircle2, FileText, Tag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatePickerSheet } from "./DatePickerSheet"
import { formatDisplayDate, nowDateValue } from "./helpers"
import type { DateTimeValue } from "./types"

interface Step2DescriptionProps {
    amountFormatted: string
    categoryName: string | null
    description: string
    error: string | null
    loading: boolean
    onDescriptionChange: (val: string) => void
    onSubmit: (isoDate: string) => void
    onBack: () => void
}

export function Step2Description({
    amountFormatted,
    categoryName,
    description,
    error,
    loading,
    onDescriptionChange,
    onSubmit,
    onBack,
}: Step2DescriptionProps) {
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [selectedDate, setSelectedDate] = useState<DateTimeValue>(nowDateValue)
    const [displayDate, setDisplayDate] = useState(() => formatDisplayDate(new Date()))

    const handleDateConfirmed = (val: DateTimeValue) => {
        setSelectedDate(val)
        setDisplayDate(formatDisplayDate(new Date(val.year, val.month - 1, val.day)))
        setShowDatePicker(false)
    }

    const handleSubmit = () => {
        const isoDate = new Date(
            selectedDate.year,
            selectedDate.month - 1,
            selectedDate.day,
            selectedDate.hour,
            selectedDate.minute,
        ).toISOString()
        onSubmit(isoDate)
    }

    return (
        <>
            <div className="flex-1 px-6 pt-4 overflow-y-auto flex flex-col gap-3 pb-28">

                {/* Kategoriya */}
                {categoryName && (
                    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3">
                        <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                            <Tag className="h-4 w-4 text-rose-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/50">
                                Kategoriya
                            </p>
                            <p className="text-sm font-semibold text-foreground mt-0.5">{categoryName}</p>
                        </div>
                    </div>
                )}

                {/* Summa */}
                <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-4 py-3">
                    <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                        <ArrowDownLeft className="h-4 w-4 text-rose-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/50">
                            Summa
                        </p>
                        <p className="text-sm font-mono font-bold text-rose-600 mt-0.5">
                            -{amountFormatted} UZS
                        </p>
                    </div>
                </div>

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
                            <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/50">
                                Sana
                            </p>
                            <p className="text-sm font-semibold text-foreground mt-0.5">{displayDate}</p>
                        </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
                </button>

                {/* Izoh */}
                <div className="rounded-xl border bg-muted/40 px-4 pt-3 pb-2 focus-within:border-blue-500/60 focus-within:ring-4 focus-within:ring-blue-500/15 border-border transition-all duration-200">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <FileText className="h-3 w-3 text-muted-foreground/50" />
                        <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/50">
                            Izoh (ixtiyoriy)
                        </span>
                    </div>
                    <textarea
                        autoFocus
                        value={description}
                        onChange={(e) => {
                            if (e.target.value.length <= 200) onDescriptionChange(e.target.value)
                        }}
                        placeholder="Masalan: Do'kondan oziq-ovqat, kafe, transport..."
                        rows={2}
                        className="w-full bg-transparent resize-none outline-none text-sm font-medium leading-relaxed text-foreground placeholder:text-muted-foreground/30"
                    />
                    <div className="flex justify-end">
                        <span className={[
                            "text-[10px] tabular-nums",
                            description.length > 180 ? "text-rose-500 font-semibold" : "text-muted-foreground/30",
                        ].join(" ")}>
                            {description.length}/200
                        </span>
                    </div>
                </div>

                {error && <p className="text-xs text-red-500 px-1">{error}</p>}
            </div>

            {/* Footer */}
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
                    onClick={onBack}
                    className="w-full h-10 gap-2 text-sm font-medium text-muted-foreground bg-muted/40 hover:bg-muted/70 active:scale-[0.98] transition-all ring-1 ring-border"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Orqaga
                </Button>
            </div>

            {/* DatePickerSheet — AlertDialog sifatida */}
            <DatePickerSheet
                open={showDatePicker}
                selectedDate={selectedDate}
                onConfirm={handleDateConfirmed}
                onCancel={() => setShowDatePicker(false)}
            />
        </>
    )
}
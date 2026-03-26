"use client"

import React from "react"
import { ArrowDownLeft, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import CategoryWheelPicker from "../category/wheel-select-category"
import type { FieldErrors } from "react-hook-form"
import type { AmountFormData } from "./types"

interface Step1AmountProps {
    formattedAmount: string
    isFocused: boolean
    setIsFocused: (v: boolean) => void
    formErrors: FieldErrors<AmountFormData>
    error: string | null
    selectedCategory: number | null
    digits: string
    onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onCategorySelect: (id: number) => void
    onContinue: () => void
    onClose: () => void
}

export function Step1Amount({
    formattedAmount,
    isFocused,
    setIsFocused,
    formErrors,
    error,
    selectedCategory,
    digits,
    onAmountChange,
    onCategorySelect,
    onContinue,
    onClose,
}: Step1AmountProps) {
    return (
        <>
            <div className="flex-1 px-6 overflow-hidden pb-28 space-y-4 mt-4">
                {/* Amount input */}
                <div className="space-y-2">
                    <div
                        className={[
                            "relative rounded-xl border transition-all bg-muted/40 px-3 pt-2 pb-2",
                            isFocused
                                ? "border-blue-500/60 ring-4 ring-blue-500/15 shadow-[0_0_0_1px_rgba(59,130,246,0.35)]"
                                : "border-border hover:border-blue-500/30",
                        ].join(" ")}
                        onClick={() => setIsFocused(true)}
                    >
                        <div className={[
                            "absolute left-4 top-2 text-[10px] font-semibold tracking-widest uppercase transition-colors",
                            isFocused ? "text-blue-600" : "text-muted-foreground/70",
                        ].join(" ")}>
                            Summa
                        </div>

                        <Input
                            id="amount"
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={formattedAmount}
                            onChange={onAmountChange}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            pattern="[0-9\s]*"
                            className={[
                                "mt-4 h-8 border-0 bg-transparent px-1 pr-14",
                                "text-xl font-mono font-semibold tracking-tight leading-none",
                                "focus-visible:ring-0 focus-visible:ring-offset-0",
                                formErrors.amount ? "text-rose-600" : "text-foreground",
                            ].join(" ")}
                        />

                        <span className={[
                            "absolute right-3 top-1/2 -translate-y-1/2",
                            "rounded-lg px-2 py-1 text-[11px] font-semibold transition-all",
                            isFocused
                                ? "bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/20"
                                : "bg-muted text-muted-foreground ring-1 ring-border",
                        ].join(" ")}>
                            UZS
                        </span>
                    </div>

                    {formErrors.amount && (
                        <p className="text-xs text-red-500">{formErrors.amount.message}</p>
                    )}
                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>

                {/* Category */}
                <CategoryWheelPicker
                    type="EXPENSE"
                    showAddButtonWhenHasCategories={true}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={onCategorySelect}
                />
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur px-4 py-3 space-y-2">
                <Button
                    type="button"
                    disabled={!selectedCategory || digits.length === 0}
                    className="w-full h-11 text-base font-semibold rounded-lg bg-[#0088cc] hover:bg-[#0077b5] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    onClick={onContinue}
                >
                    <div className="flex items-center gap-2">
                        <ArrowDownLeft className="h-5 w-5" />
                        Pul Chiqim Qilish
                        <ArrowRight className="h-4 w-4 ml-auto opacity-60" />
                    </div>
                </Button>

                <Button
                    type="button"
                    onClick={onClose}
                    className="w-full h-10 gap-2 text-sm font-medium text-muted-foreground bg-muted/40 hover:bg-muted/70 active:scale-[0.98] transition-all ring-1 ring-border"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Orqaga
                </Button>
            </div>
        </>
    )
}

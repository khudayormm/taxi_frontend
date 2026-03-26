"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ChiqimModalProps } from "./types"
import { useChiqimForm } from "./useChiqimForm"
import { Step1Amount } from "./Step1Amount"
import { Step2Description } from "./Step2Description"

export function ChiqimModal({ open, onOpenChange, amountData, setAmount }: ChiqimModalProps) {
    const form = useChiqimForm({ open, onOpenChange, amountData, setAmount })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-screen h-[100dvh] max-w-none left-0 top-0 translate-x-0 translate-y-0 rounded-none p-0 overflow-hidden border-0 shadow-none flex flex-col">

                {/* Header */}
                <div className="px-6 pt-4 shrink-0">
                    <DialogHeader>
                        <DialogTitle className="text-center text-sm font-medium text-muted-foreground tracking-wide uppercase">
                            {form.step === 1
                                ? "Chiquvchi summani ro'yxatga olish"
                                : "Izoh qo'shish"}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Step dots */}
                    <div className="flex items-center justify-center gap-1.5 mt-3">
                        <div className={[
                            "h-1.5 rounded-full transition-all",
                            form.step === 1 ? "w-5 bg-blue-500" : "w-1.5 bg-blue-500/40",
                        ].join(" ")} />
                        <div className={[
                            "h-1.5 rounded-full transition-all",
                            form.step === 2 ? "w-5 bg-blue-500" : "w-1.5 bg-muted-foreground/20",
                        ].join(" ")} />
                    </div>
                </div>

                {/* Step 1 */}
                {form.step === 1 && (
                    <Step1Amount
                        formattedAmount={form.formattedAmount}
                        isFocused={form.isFocused}
                        setIsFocused={form.setIsFocused}
                        formErrors={form.formErrors}
                        error={form.error}
                        selectedCategory={form.selectedCategory}
                        digits={form.digits}
                        onAmountChange={form.handleAmountChange}
                        onCategorySelect={form.handleCategorySelect}
                        onContinue={form.handleStep1Continue}
                        onClose={() => onOpenChange(false)}
                    />
                )}

                {/* Step 2 */}
                {form.step === 2 && (
                    <Step2Description
                        amountFormatted={form.formattedAmount}
                        categoryName={form.selectedCategoryName}
                        description={form.description}
                        error={form.error}
                        loading={form.loading}
                        onDescriptionChange={form.setDescription}
                        onSubmit={form.handleSubmit}
                        onBack={() => { form.setError(null); form.setStep(1) }}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}
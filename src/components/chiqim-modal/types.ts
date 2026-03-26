import * as z from "zod"
import type { DateTimeValue } from "../time-wheel/DateTimeWheel"

export const MAX_VALUE = 99_999_999

export const amountSchema = z.object({
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

export type AmountFormData = z.infer<typeof amountSchema>

export interface ChiqimModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    setAmount: (value: number) => void
    amountData: number
}

export type { DateTimeValue }

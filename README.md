This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# harajat

// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
provider = "prisma-client-js"
}

datasource db {
provider = "postgresql"
url = env("DATABASE_URL")
}

model User {
id Int @id @default(autoincrement())
userId String @unique // Telegram user ID (string sifatida)
chatId String // Telegram chat ID (string)
firstName String
username String?
profilePic String? // Profil rasm URL'si
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
lastAccess DateTime?

expenses Expense[]
incomes Income[]
categories Category[]

@@map("users")
}

model Category {
id Int @id @default(autoincrement())
name String // Kategoriya nomi
description String?
color String @default("#3B82F6") // Hex rang kodi
type CategoryType // "expense" yoki "income"
icon String? // Emoji yoki icon
userId Int // Qaysi foydalanuvchiga tegishli
createdAt DateTime @default(now())

// Aloqalar (Relations)
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
expenses Expense[] // Bu kategoriyaga tegishli harajatlar
incomes Income[] // Bu kategoriyaga tegishli daromadlar

// Bir foydalanuvchida bir xil nomli 2ta kategoriya bo'lmasligi kerak
@@unique([name, userId, type])
@@map("categories")
}

model Expense {
id Int @id @default(autoincrement())
amount Decimal @db.Decimal(10, 2) // Pul miqdori (2 kasr raqam)
description String? // Ixtiyoriy tavsif
date DateTime @default(now()) // Harajat qilingan sana
categoryId Int // Qaysi kategoriyaga tegishli
userId Int // Qaysi foydalanuvchiga tegishli
createdAt DateTime @default(now()) // Yaratilgan vaqt
updatedAt DateTime @updatedAt // Yangilangan vaqt

// Aloqalar (Relations)
category Category @relation(fields: [categoryId], references: [id])
user User @relation(fields: [userId], references: [id], onDelete: Cascade)

// Tez qidiruv uchun index (userId va date bo'yicha)
@@index([userId, date])
@@map("expenses")
}

model Income {
id Int @id @default(autoincrement())
amount Decimal @db.Decimal(10, 2)
description String?
categoryId Int
category Category @relation(fields: [categoryId], references: [id])
date DateTime @default(now())
userId Int
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

user User @relation(fields: [userId], references: [id], onDelete: Cascade)

@@index([userId, date])
@@map("incomes")
}

enum CategoryType {
EXPENSE
INCOME
}

"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import \* as z from "zod"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowDownLeft, ArrowLeft } from "lucide-react"

import { createExpense } from "@/lib/api/expense/create-expense"
import CategoryWheelPicker from "../category/wheel-select-category"

interface ChiqimModalProps {
open: boolean
onOpenChange: (open: boolean) => void
setAmount: (value: number) => void
amountData: number
}

const MAX_VALUE = 99_999_999

const chiqimSchema = z.object({
amount: z
.string()
.min(1, "Miqdorni kiriting")
.refine((val) => parseInt(val.replace(/\s/g, ""), 10) > 0, {
message: "Miqdor 0 dan katta bo'lishi kerak",
})
.refine((val) => parseInt(val.replace(/\s/g, ""), 10) <= MAX_VALUE, {
message: `Maksimal summa: ${MAX_VALUE.toLocaleString("ru-RU")}`,
}),
description: z.string().optional(),
})

type ChiqimFormData = z.infer<typeof chiqimSchema>

const formatSum = (digits: string) => {
if (!digits) return ""
return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

// ✅ faqat raqam qoldirish
const onlyDigits = (s: string) => (s || "").replace(/\D/g, "")

// ✅ MAX_VALUE dan oshirmaslik (digits ko‘rinishida)
const clampDigitsToMax = (d: string) => {
const n = parseInt(d || "0", 10)
if (!Number.isFinite(n)) return ""
if (n <= 0) return ""
if (n > MAX_VALUE) return String(MAX_VALUE)
return String(n)
}

export function ChiqimModal({ open, onOpenChange, amountData, setAmount }: ChiqimModalProps) {
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
    } = useForm<ChiqimFormData>({
        resolver: zodResolver(chiqimSchema),
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

    // ✅ input yozilganda digits ni yangilash
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value
        const nextDigits = clampDigitsToMax(onlyDigits(raw))
        setDigits(nextDigits)
        setError(null)
    }

    const onSubmit = async (data: ChiqimFormData) => {
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

            const result = await createExpense({
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

            setAmount(amountData - amountNumber)
            onOpenChange(false)
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Xatolik"

            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    const formattedAmount = useMemo(() => formatSum(digits), [digits])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={[
                    "w-screen h-[100dvh] max-w-none",
                    "left-0 top-0 translate-x-0 translate-y-0",
                    "rounded-none p-0 overflow-hidden",
                    "border-0 shadow-none to-muted/30",
                    "flex flex-col",
                ].join(" ")}
            >
                {/* Header */}
                <div className="px-6 pt-4">
                    <DialogHeader>
                        <DialogTitle className="text-center text-sm font-medium text-muted-foreground tracking-wide uppercase">
                            {"Chiquvchi summani ro'yxatga olish"}
                        </DialogTitle>
                    </DialogHeader>
                </div>

                {/* Content */}
                <div className="flex-1 px-6 overflow-hidden pb-28 space-y-4">
                    {/* Amount Input */}
                    <div className="space-y-2">
                        <div
                            className={[
                                "relative rounded-xl border transition-all",
                                "bg-muted/40",
                                "px-3 pt-2 pb-2",
                                isFocused
                                    ? "border-blue-500/60 ring-4 ring-blue-500/15 shadow-[0_0_0_1px_rgba(59,130,246,0.35)]"
                                    : "border-border hover:border-blue-500/30",
                            ].join(" ")}
                            onClick={() => setIsFocused(true)}
                        >
                            <div
                                className={[
                                    "absolute left-4 top-2 text-[10px] font-semibold tracking-widest uppercase transition-colors",
                                    isFocused ? "text-blue-600" : "text-muted-foreground/70",
                                ].join(" ")}
                            >
                                Summa
                            </div>

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
                                className={[
                                    "mt-4 h-8 border-0 bg-transparent px-1 pr-14",
                                    "text-xl font-mono font-semibold tracking-tight leading-none",
                                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                                    errors.amount ? "text-rose-600" : "text-foreground",
                                ].join(" ")}
                            />

                            <span
                                className={[
                                    "absolute right-3 top-1/2 -translate-y-1/2",
                                    "rounded-lg px-2 py-1 text-[11px] font-semibold transition-all",
                                    isFocused
                                        ? "bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/20"
                                        : "bg-muted text-muted-foreground ring-1 ring-border",
                                ].join(" ")}
                            >
                                UZS
                            </span>
                        </div>

                        {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
                        {error && <p className="text-xs text-red-500 mt-1">{String(error)}</p>}
                    </div>

                    {/* Category */}
                    <div>
                        <CategoryWheelPicker
                            type="EXPENSE"
                            showAddButtonWhenHasCategories={true}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur px-4 py-3">
                    <Button
                        type="button"
                        disabled={!selectedCategory || loading || digits.length === 0}
                        variant="telegram"
                        className="w-full h-11 text-base font-semibold rounded-lg bg-[#0088cc] hover:bg-[#0077b5] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        onClick={handleSubmit(onSubmit)}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin" />
                                Jarayonda...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <ArrowDownLeft className="h-5 w-5" />
                                Pul Chiqim Qilish
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
                        className="
              mt-2 w-full gap-2 text-sm font-medium
              text-muted-foreground
              bg-muted/40
              hover:bg-muted/70
              active:bg-muted
              active:scale-[0.98]
              transition-all
              ring-1 ring-border
            "
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Orqaga
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )

}
# taxi_frontend

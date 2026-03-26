"use client"

import React from "react"
import { forwardRef, useImperativeHandle, useRef } from "react"
import type { WheelPickerOption } from "@/components/wheel-picker"
import { WheelPicker, WheelPickerWrapper } from "@/components/wheel-picker"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const createArray = (length: number, add = 0): WheelPickerOption<number>[] =>
    Array.from({ length }, (_, i) => {
        const v = i + add
        return { label: v.toString().padStart(2, "0"), value: v }
    })

const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month, 0).getDate()

const monthOptions: WheelPickerOption<number>[] = [
    { label: "Yanvar", value: 1 },
    { label: "Fevral", value: 2 },
    { label: "Mart", value: 3 },
    { label: "Aprel", value: 4 },
    { label: "May", value: 5 },
    { label: "Iyun", value: 6 },
    { label: "Iyul", value: 7 },
    { label: "Avgust", value: 8 },
    { label: "Sentabr", value: 9 },
    { label: "Oktabr", value: 10 },
    { label: "Noyabr", value: 11 },
    { label: "Dekabr", value: 12 },
]

const currentYear = new Date().getFullYear()
const yearOptions: WheelPickerOption<number>[] = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - 4 + i
    return { label: y.toString(), value: y }
})

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DateTimeValue {
    day: number
    month: number
    year: number
    hour: number
    minute: number
}

export interface DateTimeWheelRef {
    getValue: () => DateTimeValue
}

interface DateTimeWheelProps {
    defaultValue?: Partial<DateTimeValue>
    large?: boolean
}

// ─── Layout ───────────────────────────────────────────────────────────────────
const ITEM_H = 40
const ITEM_H_LARGE = 52

function getOuterStyle(large?: boolean): React.CSSProperties {
    const h = large ? ITEM_H_LARGE : ITEM_H
    return {
        ["--rwp-item-height" as string]: `${h}px`,
        height: `${h * 4}px`,
    }
}

const highlightClassNames = {
    highlightWrapper: "bg-zinc-800/90 dark:bg-zinc-200 ring-0 rounded-md",
    highlightItem: "font-bold text-white dark:text-zinc-900 tracking-wide",
}

// ─── Component ────────────────────────────────────────────────────────────────
// MUHIM: Bu komponent UNCONTROLLED — faqat defaultValue ishlatadi, value prop yo'q.
// Qayta mount qilish kerak bo'lsa parent key={...} bersin.
// getValue() ref orqali joriy tanlangan qiymatni qaytaradi.
const DateTimeWheel = forwardRef<DateTimeWheelRef, DateTimeWheelProps>(
    ({ defaultValue, large }, ref) => {
        const now = new Date()

        const initDay = defaultValue?.day ?? now.getDate()
        const initMonth = defaultValue?.month ?? now.getMonth() + 1
        const initYear = defaultValue?.year ?? now.getFullYear()
        const initHour = defaultValue?.hour ?? now.getHours()
        const initMinute = defaultValue?.minute ?? now.getMinutes()

        // Internal mutable ref — re-render qilmasdan o'zgaradi
        const current = useRef<DateTimeValue>({
            day: initDay,
            month: initMonth,
            year: initYear,
            hour: initHour,
            minute: initMinute,
        })

        useImperativeHandle(ref, () => ({
            getValue: () => ({ ...current.current }),
        }))

        const initDayOptions = createArray(getDaysInMonth(initYear, initMonth), 1)

        return (
            <div className="w-full">
                <div className="grid grid-cols-3 mb-1.5 px-1">
                    <span className="text-[10px] font-medium text-muted-foreground/50 text-center">Kun</span>
                    <span className="text-[10px] font-medium text-muted-foreground/50 text-center">Oy</span>
                    <span className="text-[10px] font-medium text-muted-foreground/50 text-center">Yil</span>
                </div>

                <div style={getOuterStyle(large)} className="overflow-hidden rounded-lg">
                    <WheelPickerWrapper className="w-full !h-full">
                        <WheelPicker
                            options={initDayOptions}
                            defaultValue={initDay}
                            onValueChange={(v) => {
                                current.current.day = v as number
                            }}
                            classNames={highlightClassNames}
                        />
                        <WheelPicker
                            options={monthOptions}
                            defaultValue={initMonth}
                            onValueChange={(v) => {
                                current.current.month = v as number
                            }}
                            classNames={highlightClassNames}
                        />
                        <WheelPicker
                            options={yearOptions}
                            defaultValue={initYear}
                            onValueChange={(v) => {
                                current.current.year = v as number
                            }}
                            classNames={highlightClassNames}
                        />
                    </WheelPickerWrapper>
                </div>
            </div>
        )
    }
)

DateTimeWheel.displayName = "DateTimeWheel"

export default DateTimeWheel
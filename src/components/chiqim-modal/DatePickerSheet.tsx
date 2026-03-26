"use client"

import { useRef } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import DateTimeWheel, { type DateTimeWheelRef, type DateTimeValue } from "../time-wheel/DateTimeWheel"

interface DatePickerSheetProps {
    open: boolean
    selectedDate: DateTimeValue
    onConfirm: (val: DateTimeValue) => void
    onCancel: () => void
}

export function DatePickerSheet({
    open,
    selectedDate,
    onConfirm,
    onCancel,
}: DatePickerSheetProps) {
    const dateWheelRef = useRef<DateTimeWheelRef>(null)

    return (
        <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
            <DialogPrimitive.Portal>
                {/* Overlay */}
                <DialogPrimitive.Overlay
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-300"
                    style={{ zIndex: 9998 }}
                />

                {/* Bottom sheet */}
                <DialogPrimitive.Content
                    style={{ zIndex: 9999 }}
                    className={[
                        "fixed bottom-0 left-0 right-0",
                        "bg-background rounded-t-2xl flex flex-col",
                        "shadow-[0_-8px_48px_rgba(0,0,0,0.22)]",
                        "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom",
                        "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom",
                        "duration-300",
                    ].join(" ")}
                >
                    {/* Handle */}
                    <div className="flex justify-center pt-3 pb-2">
                        <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
                    </div>

                    {/* Header */}
                    <div className="px-5 pb-3 border-b border-border/40">
                        <DialogPrimitive.Title className="text-center text-sm font-medium text-muted-foreground tracking-wide uppercase">
                            Sana tanlash
                        </DialogPrimitive.Title>
                    </div>

                    {/* Wheel */}
                    <div className="px-5 pt-5 pb-4">
                        <DateTimeWheel
                            key={`${selectedDate.day}-${selectedDate.month}-${selectedDate.year}`}
                            ref={dateWheelRef}
                            large
                            defaultValue={selectedDate}
                        />
                    </div>

                    {/* Buttons */}
                    <div className="px-5 pb-8 pt-2 flex gap-2">
                        <Button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 h-11 text-sm font-medium rounded-xl text-muted-foreground bg-muted/40 hover:bg-muted/70 ring-1 ring-border"
                        >
                            Bekor
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                const val = dateWheelRef.current?.getValue()
                                if (val) onConfirm(val)
                                else onCancel()
                            }}
                            className="flex-[2] h-11 text-base font-semibold rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white"
                        >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Tasdiqlash
                        </Button>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}
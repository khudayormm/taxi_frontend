"use client"

import React, { useEffect, useRef } from "react"
import Keyboard from "simple-keyboard"
import "simple-keyboard/build/css/index.css"

type AmountKeyboardProps = {
    digits: string
    onDigitsChange: (digits: string) => void
    maxValue?: number
    className?: string
}

const onlyDigits = (s: string) => (s || "").replace(/\D/g, "")

export default function AmountKeyboard({ digits, onDigitsChange, maxValue, className }: AmountKeyboardProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const keyboardRef = useRef<any>(null)

    // ✅ doim eng oxirgi digits ni olish uchun (stale closure bo‘lmasin)
    const digitsRef = useRef<string>("")
    useEffect(() => {
        digitsRef.current = onlyDigits(digits)
    }, [digits])

    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        // StrictMode/dev uchun tozalash
        el.innerHTML = ""
        if (keyboardRef.current?.destroy) keyboardRef.current.destroy()
        keyboardRef.current = null

        const k = new Keyboard(el, {
            theme: "hg-theme-default hg-layout-numeric amount-kb",
            layout: {
                default: ["1 2 3", "4 5 6", "7 8 9", "000 0 {bksp}"],
            },
            display: {
                "{bksp}": "⌫",
            },

            // ✅ hamma logika shu yerda: bksp + maxValue
            onKeyPress: (btn: string) => {
                const current = digitsRef.current
                let next = current

                if (btn === "{bksp}") {
                    next = current.slice(0, -1)
                } else if (btn === "000") {
                    next = current + "000"
                } else if (/^\d$/.test(btn)) {
                    next = current + btn
                } else {
                    return
                }

                // ✅ max tekshiruv (999_999_999 dan oshirmaymiz)
                if (maxValue != null) {
                    const n = next ? Number(next) : 0
                    if (n > maxValue) {
                        // ❌ o‘zgartirmaymiz, keyboard inputni ham eski holatga qaytaramiz
                        k.setInput(current)
                        return
                    }
                }

                // ✅ state + keyboard input sync
                digitsRef.current = next
                onDigitsChange(next)
                k.setInput(next)
            },
        })

        keyboardRef.current = k

        // initial sync
        k.setInput(onlyDigits(digits))

        return () => {
            try {
                if (keyboardRef.current?.destroy) keyboardRef.current.destroy()
            } catch { }
            keyboardRef.current = null
            if (el) el.innerHTML = ""
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxValue])

    // ✅ tashqaridan digits o‘zgarsa keyboardni sync qilamiz
    useEffect(() => {
        const k = keyboardRef.current
        if (!k) return
        const d = onlyDigits(digits)
        if (k.getInput?.() !== d) k.setInput(d)
    }, [digits])

    return (
        <div className={className}>
            <div ref={containerRef} />

            {/* ⚠️ CSS ichida // comment bo‘lmasin (CSS buziladi). */}
            <style jsx global>{``}</style>
        </div>
    )
}
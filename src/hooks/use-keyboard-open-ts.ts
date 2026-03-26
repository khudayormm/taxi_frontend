"use client"

import { useEffect, useRef, useState } from "react"

function getTgWebApp(): any | null {
    if (typeof window === "undefined") return null
    return (window as any).Telegram?.WebApp ?? null
}

export function useKeyboardOpen(threshold = 120) {
    const [keyboardOpen, setKeyboardOpen] = useState(false)
    const baseHeightRef = useRef<number | null>(null)

    useEffect(() => {
        const tg = getTgWebApp()

        const compute = () => {
            const winHeight = window.innerHeight
            const tgHeight: number | undefined = tg?.viewportHeight
            const vvHeight: number | undefined = window.visualViewport?.height

            if (baseHeightRef.current == null) {
                baseHeightRef.current = tgHeight ?? vvHeight ?? winHeight
            }

            const base = baseHeightRef.current
            const current = tgHeight ?? vvHeight ?? winHeight

            if (base == null) return

            const diff = base - current
            setKeyboardOpen(diff > threshold)
        }

        compute()

        const onTgViewportChanged = () => compute()
        try {
            tg?.onEvent?.("viewportChanged", onTgViewportChanged)
        } catch { }

        const vv = window.visualViewport
        const onResize = () => compute()

        vv?.addEventListener("resize", onResize)
        window.addEventListener("resize", onResize)

        return () => {
            try {
                tg?.offEvent?.("viewportChanged", onTgViewportChanged)
            } catch { }
            vv?.removeEventListener("resize", onResize)
            window.removeEventListener("resize", onResize)
        }
    }, [threshold])

    return keyboardOpen
}
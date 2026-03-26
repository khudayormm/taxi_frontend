import type { DateTimeValue } from "./types"

export const formatSum = (digits: string): string =>
    digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : ""

export const onlyDigits = (s: string): string => (s || "").replace(/\D/g, "")

export const clampDigitsToMax = (d: string, max: number): string => {
    const n = parseInt(d || "0", 10)
    if (!Number.isFinite(n) || n <= 0) return ""
    return n > max ? String(max) : String(n)
}

export const formatDisplayDate = (d: Date): string =>
    d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "long", year: "numeric" })

export const nowDateValue = (): DateTimeValue => {
    const n = new Date()
    return {
        day: n.getDate(),
        month: n.getMonth() + 1,
        year: n.getFullYear(),
        hour: n.getHours(),
        minute: n.getMinutes(),
    }
}

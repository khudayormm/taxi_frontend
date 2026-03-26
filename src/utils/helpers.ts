import { isValid } from "date-fns"

export function toSafeDate(input?: number | string | Date) {
    if (input == null) return new Date()

    // Date kelgan bo‘lsa
    if (input instanceof Date) return isValid(input) ? input : new Date()

    // Number kelgan bo‘lsa: seconds vs milliseconds
    if (typeof input === "number") {
        const ms = input < 1e12 ? input * 1000 : input // 1e12 dan kichik bo‘lsa seconds deb olamiz
        const d = new Date(ms)
        return isValid(d) ? d : new Date()
    }

    // String kelgan bo‘lsa (eng yaxshisi ISO yuboring)
    const d = new Date(input)
    return isValid(d) ? d : new Date()
}

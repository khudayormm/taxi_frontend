"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import {
    Users, UserPlus, Trash2, Phone,
    Crown, Baby, User, Loader2, CheckCircle2,
    X, ShieldCheck, RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import api from "@/lib/api/api-config/api"

// ── Types ──
type Role = "OTA" | "ONA" | "FARZAND" | "BOSHQA"  // backend enum bilan mos

type FamilyMember = {
    id: number
    phone: string
    role: Role
    isVerified: boolean
    joinedAt: string
}

// ── Role config ──
const ROLES: { value: Role; label: string; icon: React.ReactNode; active: string }[] = [
    { value: "OTA", label: "Ota", icon: <Crown className="h-4 w-4" />, active: "border-amber-400 bg-amber-50 text-amber-700" },
    { value: "ONA", label: "Ona", icon: <Crown className="h-4 w-4" />, active: "border-rose-400  bg-rose-50  text-rose-700" },
    { value: "FARZAND", label: "Farzand", icon: <Baby className="h-4 w-4" />, active: "border-sky-400   bg-sky-50   text-sky-700" },
    { value: "BOSHQA", label: "Boshqa", icon: <User className="h-4 w-4" />, active: "border-slate-400 bg-slate-50 text-slate-700" },
]

const roleInfo = (r: Role) => ROLES.find((x) => x.value === r) ?? ROLES[3]

const BADGE_CLS: Record<Role, string> = {
    OTA: "border-amber-200 bg-amber-50 text-amber-600",
    ONA: "border-rose-200  bg-rose-50  text-rose-600",
    FARZAND: "border-sky-200   bg-sky-50   text-sky-600",
    BOSHQA: "border-slate-200 bg-slate-50 text-slate-600",
}

// ── Phone mask: 998 XX XXX XX XX ──
function applyMask(raw: string): string {
    const digits = raw.replace(/\D/g, "")
    const body = digits.startsWith("998") ? digits.slice(3) : digits
    const d = body.slice(0, 9)
    let result = "998"
    if (d.length > 0) result += " " + d.slice(0, 2)
    if (d.length > 2) result += " " + d.slice(2, 5)
    if (d.length > 5) result += " " + d.slice(5, 7)
    if (d.length > 7) result += " " + d.slice(7, 9)
    return result
}

function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
                type="tel"
                inputMode="numeric"
                value={value}
                onChange={(e) => onChange(applyMask(e.target.value))}
                onKeyDown={(e) => { if (e.key === "Backspace" && value === "998") e.preventDefault() }}
                onFocus={() => { if (!value) onChange("998") }}
                placeholder="998 XX XXX XX XX"
                maxLength={16}
                className={cn(
                    "w-full h-10 pl-9 pr-3 text-sm rounded-lg border bg-background tracking-wide font-mono",
                    "focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground transition-shadow"
                )}
            />
        </div>
    )
}

// ── OTP Input (4 boxes) ──
const OTP_LENGTH = 4

function OtpInput({ value, onChange, disabled }: {
    value: string
    onChange: (v: string) => void
    disabled?: boolean
}) {
    const refs = useRef<(HTMLInputElement | null)[]>([])

    const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            if (value[i]) {
                const next = value.split(""); next[i] = ""; onChange(next.join(""))
            } else if (i > 0) {
                refs.current[i - 1]?.focus()
                const next = value.split(""); next[i - 1] = ""; onChange(next.join(""))
            }
        }
    }

    const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const digit = e.target.value.replace(/\D/g, "").slice(-1)
        if (!digit) return
        const next = value.split("")
        next[i] = digit
        onChange(next.join("").slice(0, OTP_LENGTH))
        if (i < OTP_LENGTH - 1) refs.current[i + 1]?.focus()
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH)
        onChange(pasted)
        refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
    }

    return (
        <div className="flex gap-3 justify-center">
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                <input
                    key={i}
                    ref={(el) => { refs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[i] ?? ""}
                    disabled={disabled}
                    onChange={(e) => handleChange(i, e)}
                    onKeyDown={(e) => handleKey(i, e)}
                    onPaste={handlePaste}
                    className={cn(
                        "w-13 h-14 text-center text-xl font-bold rounded-xl border-2 bg-background",
                        "focus:outline-none focus:border-primary transition-colors",
                        value[i] ? "border-primary text-foreground" : "border-border text-muted-foreground",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                />
            ))}
        </div>
    )
}

// ── OTP Modal ──
function OtpModal({ phone, role, onSuccess, onClose }: {
    phone: string
    role: Role
    onSuccess: (member: FamilyMember) => void
    onClose: () => void
}) {
    const [otp, setOtp] = useState("")
    const [verifying, setVerifying] = useState(false)
    const [resending, setResending] = useState(false)
    const [countdown, setCountdown] = useState(60)

    useEffect(() => {
        if (countdown <= 0) return
        const t = setInterval(() => setCountdown((c) => c - 1), 1000)
        return () => clearInterval(t)
    }, [countdown])

    const handleVerify = async (code = otp) => {
        if (code.length < OTP_LENGTH) return
        try {
            setVerifying(true)
            const res = await api.post("/family/verify-number", { phone, code, role })
            if (!res.data?.success) throw new Error(res.data?.message ?? "Xatolik")

            // Backend qaytargan haqiqiy member obyektini ishlatamiz
            onSuccess(res.data.member)
            toast.success("Raqam tasdiqlandi!", {
                position: "top-center",
                style: { background: "#333", color: "#fff" },
            })
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Kod noto'g'ri", { position: "top-center" })
            setOtp("")
        } finally {
            setVerifying(false)
        }
    }

    const handleResend = async () => {
        try {
            setResending(true)
            await api.post("/family/send/telegram-bot", { phone })
            setCountdown(60)
            setOtp("")
            toast.success("Kod qayta yuborildi", {
                position: "top-center",
                style: { background: "#333", color: "#fff" },
            })
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Qayta yuborishda xatolik")
        } finally {
            setResending(false)
        }
    }

    // 4-raqam to'liq kiritilganda avtomatik verify
    useEffect(() => {
        if (otp.length === OTP_LENGTH) handleVerify(otp)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [otp])

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
            <div
                className="w-full max-w-md rounded-t-2xl bg-background shadow-2xl animate-in slide-in-from-bottom duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
                </div>
                <div className="flex items-center justify-between px-4 pt-2 pb-1">
                    <div />
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="px-6 pb-10 space-y-6">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <ShieldCheck className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="text-base font-semibold">Tasdiqlash kodi</h3>
                        <p className="text-sm text-muted-foreground">
                            <span className="font-mono font-medium text-foreground">{phone}</span>{" "}
                            raqamini tasdiqlash kodi{" "}
                            <span className="font-medium text-foreground">Telegram botingizga</span>{" "}
                            yuborildi. Uni quyiga kiriting
                        </p>
                    </div>

                    <OtpInput value={otp} onChange={setOtp} disabled={verifying} />

                    <Button
                        className="w-full"
                        onClick={() => handleVerify()}
                        disabled={otp.length < OTP_LENGTH || verifying}
                    >
                        {verifying
                            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Tekshirilmoqda...</>
                            : <><CheckCircle2 className="h-4 w-4 mr-2" />Tasdiqlash</>
                        }
                    </Button>

                    <div className="text-center">
                        {countdown > 0 ? (
                            <p className="text-xs text-muted-foreground">
                                Qayta yuborish{" "}
                                <span className="font-mono font-medium text-foreground tabular-nums">
                                    00:{String(countdown).padStart(2, "0")}
                                </span>{" "}
                                dan keyin
                            </p>
                        ) : (
                            <button
                                onClick={handleResend}
                                disabled={resending}
                                className="text-xs text-primary hover:underline disabled:opacity-50 flex items-center gap-1 mx-auto"
                            >
                                {resending && <Loader2 className="h-3 w-3 animate-spin" />}
                                Kodni qayta yuborish
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ════════════════════════════════════════════════════════════════════════════
// ASOSIY KOMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function SettingsProfile() {
    const [tab, setTab] = useState<"members" | "add">("members")
    const [members, setMembers] = useState<FamilyMember[]>([])
    const [loadingMembers, setLoadingMembers] = useState(true)
    const [membersError, setMembersError] = useState<string | null>(null)

    const [phone, setPhone] = useState("")
    const [role, setRole] = useState<Role>("FARZAND")
    const [sending, setSending] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [otpOpen, setOtpOpen] = useState(false)

    // ── A'zolarni yuklash ──
    const fetchMembers = useCallback(async () => {
        try {
            setLoadingMembers(true)
            setMembersError(null)
            const res = await api.post("/family/family/members")
            if (!res.data?.success) throw new Error(res.data?.message ?? "Xatolik")
            setMembers(res.data.members ?? [])
        } catch (err: any) {
            setMembersError(err?.response?.data?.message ?? err?.message ?? "Xatolik yuz berdi")
        } finally {
            setLoadingMembers(false)
        }
    }, [])

    useEffect(() => {
        fetchMembers()
    }, [fetchMembers])

    // ── Step 1: OTP yuborish ──
    const [notRegistered, setNotRegistered] = useState(false)

    const handleSend = async () => {
        const digits = phone.replace(/\D/g, "")
        if (digits.length < 12) {
            toast.error("To'liq telefon raqam kiriting", { position: "top-center" })
            return
        }
        setNotRegistered(false)
        try {
            setSending(true)
            const res = await api.post("/family/send/telegram-bot", { phone })
            if (!res.data?.success) throw new Error(res.data?.message ?? "Xatolik")
            setOtpOpen(true)
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? "Xatolik yuz berdi"
            const is404 = err?.response?.status === 404
            if (is404) setNotRegistered(true)
            else toast.error(msg, { position: "top-center" })
        } finally {
            setSending(false)
        }
    }

    // ── Step 2: verify muvaffaqqiyatli ──
    const handleVerifySuccess = (member: FamilyMember) => {
        setMembers((prev) => [...prev, member])
        setOtpOpen(false)
        setPhone("")
        setRole("FARZAND")
        setTab("members")
    }

    // ── A'zoni o'chirish ──
    const handleDelete = async (id: number) => {
        try {
            setDeletingId(id)
            const res = await api.post("/family/family/delete-member", { memberId: id })
            if (!res.data?.success) throw new Error(res.data?.message ?? "Xatolik")
            setMembers((prev) => prev.filter((m) => m.id !== id))
            toast.success("A'zo o'chirildi", {
                position: "top-center",
                style: { background: "#333", color: "#fff" },
            })
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? "Xatolik yuz berdi", { position: "top-center" })
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <>
            <div className="w-full space-y-4 p-4">

                {/* ── Header ── */}
                <div>
                    <h2 className="text-base font-semibold">Oila sozlamalari</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Oila a'zolarini boshqaring va yangi a'zo qo'shing
                    </p>
                </div>

                {/* ── Tab bar ── */}
                <div className="flex rounded-xl border bg-muted/40 p-1 gap-1">
                    {([
                        { id: "members", label: "Oila azolarim", icon: <Users className="h-3.5 w-3.5" /> },
                        { id: "add", label: "Azo qo'shish", icon: <UserPlus className="h-3.5 w-3.5" /> },
                    ] as const).map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200",
                                tab === t.id
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {t.icon}
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ══════════ TAB 1 — A'zolar ro'yxati ══════════ */}
                {tab === "members" && (
                    <div className="space-y-2">
                        {/* Loading */}
                        {loadingMembers ? (
                            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span className="text-sm">Yuklanmoqda...</span>
                            </div>
                        ) : membersError ? (
                            /* Error state */
                            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                                <p className="text-sm text-rose-500">{membersError}</p>
                                <button
                                    onClick={fetchMembers}
                                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                                >
                                    <RefreshCw className="h-3 w-3" /> Qayta urinish
                                </button>
                            </div>
                        ) : members.length === 0 ? (
                            /* Empty state */
                            <div className="flex flex-col items-center gap-3 py-14 text-muted-foreground">
                                <Users className="h-10 w-10 opacity-20" />
                                <p className="text-sm">Hali oila azolari qo'shilmagan</p>
                                <button
                                    onClick={() => setTab("add")}
                                    className="text-xs text-primary underline underline-offset-2"
                                >
                                    Birinchi azoni qo'shish
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="text-xs text-muted-foreground">
                                    Jami: {members.length} ta azo
                                </p>
                                <div className="rounded-xl border divide-y overflow-hidden">
                                    {members.map((m) => {
                                        const info = roleInfo(m.role)
                                        return (
                                            <div
                                                key={m.id}
                                                className="flex items-center justify-between px-3 py-3 bg-background hover:bg-muted/30 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-9 w-9 rounded-full flex items-center justify-center shrink-0 border",
                                                        BADGE_CLS[m.role]
                                                    )}>
                                                        {info.icon}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <span className={cn(
                                                            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full border",
                                                            BADGE_CLS[m.role]
                                                        )}>
                                                            {info.label}
                                                        </span>
                                                        <div className="flex items-center gap-1 text-sm text-muted-foreground font-mono">
                                                            <Phone className="h-3 w-3 shrink-0" />
                                                            {m.phone}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(m.id)}
                                                    disabled={deletingId === m.id}
                                                    className="p-2 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
                                                >
                                                    {deletingId === m.id
                                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                                        : <Trash2 className="h-4 w-4" />
                                                    }
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ══════════ TAB 2 — A'zo qo'shish ══════════ */}
                {tab === "add" && (
                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Telefon raqam</label>
                            <PhoneInput
                                value={phone}
                                onChange={(v) => { setPhone(v); setNotRegistered(false) }}
                            />
                            {notRegistered ? (
                                <div className="flex gap-2 items-start rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                                    <span className="text-amber-500 mt-0.5 shrink-0">⚠️</span>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-medium text-amber-700">
                                            Bu raqam botda ro'yxatdan o'tmagan
                                        </p>
                                        <p className="text-[11px] text-amber-600">
                                            A'zo avval Telegram botni ishga tushirishi kerak
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[11px] text-muted-foreground">
                                    Namuna: 998 90 123 45 67
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Oiladagi roli</label>
                            <div className="grid grid-cols-2 gap-2">
                                {ROLES.map((r) => {
                                    const isActive = role === r.value
                                    return (
                                        <button
                                            key={r.value}
                                            onClick={() => setRole(r.value)}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border",
                                                isActive
                                                    ? r.active
                                                    : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                                            )}
                                        >
                                            {r.icon}
                                            {r.label}
                                            {isActive && <CheckCircle2 className="h-3.5 w-3.5 ml-auto" />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <Button className="w-full" onClick={handleSend} disabled={sending}>
                            {sending
                                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Yuborilmoqda...</>
                                : <><UserPlus className="h-4 w-4 mr-2" />Tasdiqlash kodini yuborish</>
                            }
                        </Button>
                    </div>
                )}
            </div>

            {/* ── OTP Modal ── */}
            {otpOpen && (
                <OtpModal
                    phone={phone}
                    role={role}
                    onSuccess={handleVerifySuccess}
                    onClose={() => setOtpOpen(false)}
                />
            )}
        </>
    )
}
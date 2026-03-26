"use client"

import { useTelegram } from "@/hooks/use-telegram"
import { useEffect, useState } from "react"
import { Loader2, AlertCircle, Smartphone, Users, Crown, Baby, User } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { cn } from "@/lib/utils"
import api from "@/lib/api/api-config/api"
import FamilyData from "./family"

// ── Types ──
type FamilyRole = "OTA" | "ONA" | "FARZAND" | "BOSHQA"

type FamilyMemberInfo = {
    id: number
    role: FamilyRole
    isVerified: boolean
    joinedAt: string
    family: {
        id: number
        name: string
        owner: { firstName: string; username?: string }
    }
}

const ROLE_LABEL: Record<FamilyRole, string> = {
    OTA: "Ota", ONA: "Ona", FARZAND: "Farzand", BOSHQA: "Boshqa",
}

const ROLE_ICON: Record<FamilyRole, React.ReactNode> = {
    OTA: <Crown className="h-4 w-4" />,
    ONA: <Crown className="h-4 w-4" />,
    FARZAND: <Baby className="h-4 w-4" />,
    BOSHQA: <User className="h-4 w-4" />,
}

const ROLE_CLS: Record<FamilyRole, string> = {
    OTA: "bg-amber-50 text-amber-700 border-amber-200",
    ONA: "bg-rose-50  text-rose-700  border-rose-200",
    FARZAND: "bg-sky-50   text-sky-700   border-sky-200",
    BOSHQA: "bg-slate-50 text-slate-700 border-slate-200",
}

// ── Oila a'zosi header ──
function FamilyMemberHeader({ info }: { info: FamilyMemberInfo }) {
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between px-4 h-14 max-w-md mx-auto">
                {/* Oila nomi */}
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold leading-none">{info.family.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            {info.family.owner.firstName} oilasi
                        </p>
                    </div>
                </div>

                {/* Rol badge */}
                <span className={cn(
                    "inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border",
                    ROLE_CLS[info.role]
                )}>
                    {ROLE_ICON[info.role]}
                    {ROLE_LABEL[info.role]}
                </span>
            </div>
        </header>
    )
}

// ════════════════════════════════════════════════════════════════════════════
export default function TemplateLayout({ children }: { children: React.ReactNode }) {
    const { user, isReady, error } = useTelegram()

    const [meLoading, setMeLoading] = useState(true)
    const [familyMember, setFamilyMember] = useState<FamilyMemberInfo | null>(null)
    const [meError, setMeError] = useState<string | null>(null)

    // getUserInfo dan familyMember ma'lumotini olamiz
    useEffect(() => {
        if (!isReady || !user) return

        const fetchMe = async () => {
            try {
                const res = await api.post("/user/info")
                if (!res.data?.success) throw new Error(res.data?.message)
                setFamilyMember(res.data.familyMember ?? null)
            } catch (err: any) {
                setMeError(err?.response?.data?.message ?? err?.message ?? "Xatolik")
            } finally {
                setMeLoading(false)
            }
        }

        fetchMe()
    }, [isReady, user])

    // ── Loading ──
    if (!isReady || meLoading) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground text-lg">Yuklanmoqda...</p>
                </div>
            </main>
        )
    }

    // ── Xatolik ──
    if (error || meError) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle>Xatolik</AlertTitle>
                    <AlertDescription>{error ?? meError}</AlertDescription>
                </Alert>
                <div className="mt-6 flex flex-col items-center gap-3 text-center">
                    <Smartphone className="h-16 w-16 text-muted-foreground" />
                    <p className="text-muted-foreground max-w-xs">
                        Bu ilova faqat Telegram orqali ochilganda ishlaydi.
                        Iltimos, Telegram botdan Web App tugmasini bosing.
                    </p>
                </div>
            </main>
        )
    }

    // ── User topilmadi ──
    if (!user) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
                <Alert className="max-w-md">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle>Foydalanuvchi topilmadi</AlertTitle>
                    <AlertDescription>
                        Telegram foydalanuvchi ma'lumotlari yuklanmadi.
                    </AlertDescription>
                </Alert>
            </main>
        )
    }

    // ── Oila a'zosi layout ──
    if (familyMember) {
        return (
            <TooltipProvider>
                <FamilyMemberHeader info={familyMember} />
                <main className="max-w-md mx-auto px-4 py-6">
                    <FamilyData />
                </main>
            </TooltipProvider>
        )
    }

    // ── Oddiy (mustaqil) foydalanuvchi layout ──
    return (
        <TooltipProvider>
            <Header user={user} />
            {children}
            <Footer />
        </TooltipProvider>
    )
}
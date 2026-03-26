"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SettingsIcon, LogOutIcon, ChartArea } from "lucide-react"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { toSafeDate } from "@/utils/helpers"
import Image from "next/image"

type TelegramUser = {
    first_name?: string
    last_name?: string
    photo_url?: string
    username?: string
}

type AppHeaderProps = {
    user: TelegramUser
    dateText?: number // masalan: "5-fevral 2024, 14:30" 
    onSignOut?: () => void // xohlasangiz
}

const menuItems = [
    { icon: SettingsIcon, label: "Settings", href: "/settings" },
    { icon: ChartArea, label: "Chart", href: "/chart" },
    { icon: ChartArea, label: "Kategoriyalar", href: "/chart-category" },
] as const

export default function AppHeader({ user, dateText, onSignOut }: AppHeaderProps) {
    const pathname = usePathname()

    const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "User"
    const fallback =
        `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.trim() || "U"



    const nowTime = toSafeDate(dateText)

    const handleSignOut = () => {
        if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
            (window as any).Telegram.WebApp.close()
        }
    }


    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            <Card className="rounded-none border-0 border-b">
                <CardHeader className="py-0 bg-green-50 px-4">
                    <CardTitle className="text-center text-xl font-semibold text-foreground py-2">
                        <div className="flex justify-between items-center gap-3">
                            {/* Left: Logo */}
                            <div className="flex items-center">
                                <Image src={'/main-logo.png'} alt="logo" className="max-w-9" width={64} height={64} />
                            </div>

                            {/* Right: User block + dropdown */}
                            <div className="flex items-center gap-2">
                                <div className="text-right">
                                    <h2 className="text-sm text-foreground font-medium flex items-center gap-1 justify-end tracking-normal">
                                        {fullName}
                                    </h2>
                                    <h2 className="text-xs text-muted-foreground tracking-wide">
                                        {format(nowTime, "yyyy-MM-dd HH:mm:ss")}
                                    </h2>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="p-0 h-auto rounded-full"
                                            aria-label="User menu"
                                        >
                                            <Avatar className="h-10 w-10 ring-3 ring-primary/20">
                                                <AvatarImage
                                                    src={user.photo_url || "/placeholder.svg"}
                                                    alt={fullName}
                                                />
                                                <AvatarFallback className="text-base font-bold bg-primary text-primary-foreground">
                                                    {fallback}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel className="space-y-0.5">
                                            <div className="text-sm">{fullName}</div>
                                            {user.username ? (
                                                <div className="text-xs text-muted-foreground">@{user.username}</div>
                                            ) : null}
                                        </DropdownMenuLabel>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuGroup>
                                            {menuItems.map((item) => {
                                                const active = pathname === item.href
                                                const Icon = item.icon

                                                return (
                                                    <DropdownMenuItem key={item.href} asChild>
                                                        <Link
                                                            href={item.href}
                                                            className={`flex items-center gap-2 ${active ? "text-primary" : ""
                                                                }`}
                                                        >
                                                            <Icon className="h-4 w-4" />
                                                            <span className="text-popover-foreground">{item.label}</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                )
                                            })}
                                        </DropdownMenuGroup>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem
                                            onClick={handleSignOut}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <LogOutIcon className="h-4 w-4" />
                                            <span>Chiqish</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </CardTitle>
                </CardHeader>
            </Card>
        </header>
    )
}
"use client"

import { Button } from "@/components/ui/button"
import type { TelegramUser } from "@/hooks/use-telegram"
import { User, AtSign, Globe, Send } from "lucide-react"

interface TelegramUserCardProps {
  user: TelegramUser
}

export function TelegramUserCard({ user }: TelegramUserCardProps) {

  const getFullName = () => {
    return [user.first_name, user.last_name].filter(Boolean).join(" ")
  }

  return (
    <>
      {/* Ma'lumotlar */}
      <div className="space-y-3">
        {/* User ID */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">User ID</p>
            <p className="font-mono font-medium text-foreground">{user.id}</p>
          </div>
        </div>

        {/* Username */}
        {user.username && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <AtSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Username</p>
              <p className="font-medium text-foreground">@{user.username}</p>
            </div>
          </div>
        )}

        {/* Til */}
        {user.language_code && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Til</p>
              <p className="font-medium text-foreground uppercase">{user.language_code}</p>
            </div>
          </div>
        )}
      </div>

      {/* Telegram Button */}
      <Button
        variant="telegram"
        size="lg"
        className="w-full mt-4 rounded-lg font-semibold text-white"
        onClick={() => {
          alert(`Assalomu aleykum, ${getFullName()}! 👋`)
        }}
      >
        <Send className="h-5 w-5" />
        Salomlash
      </Button>
    </>
  )
}

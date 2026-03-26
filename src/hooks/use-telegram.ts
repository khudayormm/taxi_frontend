"use client"

import { useEffect, useState } from "react"

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

export interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    query_id?: string
    user?: TelegramUser
    auth_date: number
    hash: string
  }
  version: string
  platform: string
  colorScheme: "light" | "dark"
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
    secondary_bg_color?: string
  }
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  ready: () => void
  expand: () => void
  close: () => void
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
  }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initTelegram = () => {
      console.log("[v0] Telegram WebApp tekshirilmoqda...")
      console.log("[v0] window.Telegram:", window.Telegram)
      console.log("[v0] window.Telegram?.WebApp:", window.Telegram?.WebApp)

      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        const tgWebApp = window.Telegram.WebApp
        console.log("[v0] WebApp topildi:", tgWebApp)
        console.log("[v0] initData:", tgWebApp.initData)
        console.log("[v0] initDataUnsafe:", tgWebApp.initDataUnsafe)
        console.log("[v0] user:", tgWebApp.initDataUnsafe?.user)

        setWebApp(tgWebApp)

        if (tgWebApp.initDataUnsafe?.user) {
          setUser(tgWebApp.initDataUnsafe.user)
          console.log("[v0] User saqlandi:", tgWebApp.initDataUnsafe.user)
        } else {
          console.log("[v0] User topilmadi initDataUnsafe da")
        }

        tgWebApp.ready()
        tgWebApp.expand()
        setIsReady(true)
        console.log("[v0] WebApp ready va expanded")
      } else {
        console.log("[v0] Telegram WebApp mavjud emas")
        setError("Telegram WebApp mavjud emas. Iltimos, Telegram orqali oching.")
      }
    }

    // Script yuklangandan keyin init qilish
    const checkTelegram = setInterval(() => {
      if (window.Telegram?.WebApp) {
        clearInterval(checkTelegram)
        initTelegram()
      }
    }, 100)

    // 3 sekunddan keyin to'xtatish
    setTimeout(() => {
      clearInterval(checkTelegram)
      if (!window.Telegram?.WebApp) {
        setError("Telegram WebApp yuklanmadi. Iltimos, Telegram orqali oching.")
      }
    }, 3000)

    return () => clearInterval(checkTelegram)
  }, [])

  return { webApp, user, isReady, error }
}
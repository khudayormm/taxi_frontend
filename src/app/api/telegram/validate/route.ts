import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { initData } = await request.json()

    if (!initData) {
      return NextResponse.json(
        { valid: false, error: "initData topilmadi" },
        { status: 400 }
      )
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      return NextResponse.json(
        { valid: false, error: "Bot token sozlanmagan" },
        { status: 500 }
      )
    }

    // initData ni parse qilish
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get("hash")
    urlParams.delete("hash")

    // Ma'lumotlarni saralash
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n")

    // HMAC-SHA256 hisoblash
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest()

    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex")

    const isValid = calculatedHash === hash

    if (!isValid) {
      return NextResponse.json(
        { valid: false, error: "Ma'lumotlar tekshiruvdan o'tmadi" },
        { status: 401 }
      )
    }

    // User ma'lumotlarini olish
    const userDataString = urlParams.get("user")
    let user = null
    if (userDataString) {
      user = JSON.parse(userDataString)
    }

    return NextResponse.json({
      valid: true,
      user,
      auth_date: urlParams.get("auth_date"),
    })
  } catch (error) {
    console.error("Telegram validatsiya xatosi:", error)
    return NextResponse.json(
      { valid: false, error: "Server xatosi" },
      { status: 500 }
    )
  }
}

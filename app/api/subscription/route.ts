import { NextRequest, NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/jwt"

export async function GET(req: NextRequest) {

  const telegramId = req.headers.get("x-telegram-id")
  const platform = req.headers.get("x-platform")

  let email: string | null = null

  // ============================
  // TELEGRAM MODE
  // ============================

  if (telegramId && platform === "telegram") {

    try {

      const res = await fetch(
        `${process.env.GAS_AUTH_URL}?secret=${process.env.GAS_SECRET}&telegram_chat_id=${telegramId}&platform=telegram`,
        { cache: "no-store" }
      )

      const data = await res.json()

      return NextResponse.json(data)

    } catch {
      return NextResponse.json({
        active: false,
        blocked: true,
        status: null,
        expiry: null
      })
    }
  }

// ============================
// JWT MODE (WEB / ANDROID)
// ============================

const jwtUser = verifyAccessToken(req)

if (!jwtUser || typeof jwtUser !== "object") {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  )
}

if (!email || typeof email !== "string") {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  )
}

try {

  const res = await fetch(
    `${process.env.GAS_AUTH_URL}?secret=${process.env.GAS_SECRET}&email=${encodeURIComponent(email)}`,
    { cache: "no-store" }
  )

  const data = await res.json()

  return NextResponse.json(data)

} catch {
  return NextResponse.json({
    active: false,
    blocked: true,
    status: null,
    expiry: null
  })
}
}
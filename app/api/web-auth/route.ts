import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { verifyGoogleIdToken } from "@/lib/google"
import { createAccessToken } from "@/lib/jwt"

export async function POST(req: NextRequest) {

  const body = await req.json()

  const idToken = body.idToken
  const deviceId = body.deviceId
  const telegramChatId = body.telegram_chat_id || ""

  if (!idToken || !deviceId) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 })
  }

  const googleUser = await verifyGoogleIdToken(idToken)

  if (!googleUser?.email) {
    return NextResponse.json({ error: "invalid_google" }, { status: 401 })
  }

  const email = googleUser.email.toLowerCase()

  const refreshToken = crypto.randomBytes(64).toString("hex")

  const refreshHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex")

  const refreshExpires = new Date()
  refreshExpires.setDate(refreshExpires.getDate() + 30)

  const platform = telegramChatId ? "telegram" : "web"

  const gasRes = await fetch(process.env.GAS_AUTH_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
body: JSON.stringify({
  email,
  device_id: deviceId,
  platform,
  telegram_chat_id: telegramChatId,
  refresh_token_hash: refreshHash,
  refresh_expires: refreshExpires.toISOString()
})
  })

  const gasData = await gasRes.json()

  if (!gasRes.ok) {
    return NextResponse.json({ error: "gas_error" }, { status: 500 })
  }

  if (gasData.device_limit) {
    return NextResponse.json({
      device_limit: true,
      device_count: gasData.device_count,
      email
    }, { status: 403 })
  }

  const accessToken = createAccessToken({ email, deviceId })

  return NextResponse.json({
    accessToken,
    refreshToken,
    email
  })
}
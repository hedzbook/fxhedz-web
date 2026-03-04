import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createAccessToken } from "@/lib/jwt"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const refreshToken = body?.refreshToken
    const deviceId = body?.deviceId
    const emailRaw = body?.email
    const platformRaw = body?.platform

    // ================================
    // STRICT INPUT VALIDATION
    // ================================

    if (
      !refreshToken ||
      refreshToken === "undefined" ||
      typeof refreshToken !== "string" ||
      refreshToken.trim().length < 10 ||
      !deviceId ||
      typeof deviceId !== "string" ||
      !emailRaw ||
      typeof emailRaw !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid refresh request" },
        { status: 401 }
      )
    }

    const email = emailRaw.toLowerCase().trim()

    const platform =
      platformRaw === "telegram" ||
      platformRaw === "android" ||
      platformRaw === "web"
        ? platformRaw
        : "web"

    // ================================
    // HASH REFRESH TOKEN
    // ================================

    const refreshHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex")

    // ================================
    // CALL GAS VALIDATION
    // ================================

    const gasRes = await fetch(process.env.GAS_AUTH_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refresh_validate: true,
        email,
        device_id: deviceId,
        refresh_token_hash: refreshHash,
        platform
      })
    })

    if (!gasRes.ok) {
      return NextResponse.json(
        { error: "Auth service unavailable" },
        { status: 500 }
      )
    }

    const gasData = await gasRes.json()

    // ================================
    // DEVICE LIMIT ENFORCEMENT
    // ================================

    if (gasData?.device_limit) {
      return NextResponse.json(
        {
          device_limit: true,
          device_count: gasData.device_count
        },
        { status: 403 }
      )
    }

    // ================================
    // INVALID TOKEN
    // ================================

    if (!gasData?.valid) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      )
    }

    // ================================
    // ISSUE NEW ACCESS TOKEN
    // ================================

    const accessToken = createAccessToken({ email, deviceId })

    return NextResponse.json({ accessToken })

  } catch (err) {
    return NextResponse.json(
      { error: "Refresh failed" },
      { status: 401 }
    )
  }
}
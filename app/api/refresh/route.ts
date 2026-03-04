import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { createAccessToken } from "@/lib/jwt"

export async function POST(req: NextRequest) {
  try {
    const { refreshToken, deviceId, email, platform } = await req.json()

    if (!refreshToken || !deviceId || !email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const refreshHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex")

    const gasRes = await fetch(process.env.GAS_AUTH_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refresh_validate: true,
        email,
        device_id: deviceId,
        refresh_token_hash: refreshHash,
        platform: platform || "web"
      })
    })

    const gasData = await gasRes.json()

    if (gasData.device_limit) {
      return NextResponse.json(
        {
          device_limit: true,
          device_count: gasData.device_count
        },
        { status: 403 }
      )
    }

    if (gasData.device_limit) {
      return NextResponse.json(
        {
          device_limit: true,
          device_count: gasData.device_count
        },
        { status: 403 }
      )
    }

    if (!gasData.valid) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      )
    }

    const accessToken = createAccessToken({ email, deviceId })

    return NextResponse.json({ accessToken })

  } catch {
    return NextResponse.json({ error: "Refresh failed" }, { status: 401 })
  }
}
import { NextRequest, NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/jwt"

export async function POST(req: NextRequest) {
  try {
    // ===============================
    // VERIFY JWT
    // ===============================
    const jwtUser = verifyAccessToken(req)

    if (!jwtUser || typeof jwtUser !== "object") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const email = (jwtUser as any).email

    if (!email) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      )
    }

    // ===============================
    // READ BODY
    // ===============================
    const body = await req.json()
    const pushToken =
      body?.pushToken ||
      body?.push_token

    if (!pushToken || typeof pushToken !== "string") {
      return NextResponse.json(
        { error: "Missing push token" },
        { status: 400 }
      )
    }

    // ===============================
    // FORWARD TO GAS
    // ===============================
    const gasResponse = await fetch(process.env.GAS_AUTH_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        push_token: pushToken
      })
    })

    if (!gasResponse.ok) {
      const text = await gasResponse.text()
      console.error("GAS push save failed:", text)

      return NextResponse.json(
        { error: "GAS write failed" },
        { status: 500 }
      )
    }

    // Optional: read GAS response
    const gasData = await gasResponse.json().catch(() => null)

    return NextResponse.json({
      success: true,
      gas: gasData ?? null
    })

  } catch (error) {
    console.error("Register push error:", error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
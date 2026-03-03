import { NextRequest, NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/jwt"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

export async function POST(req: NextRequest) {

  let email: string | null = null

  // ============================
  // ANDROID (JWT)
  // ============================
  const jwtUser = verifyAccessToken(req)
  if (jwtUser && typeof jwtUser === "object") {
    email = (jwtUser as any).email
  }

  // ============================
  // WEB / TELEGRAM (SESSION)
  // ============================
  if (!email) {
    const session = await getServerSession(authOptions)
    email = session?.user?.email || null
  }

  if (!email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  // ============================
  // READ BODY (ATOMIC TOGGLE)
  // ============================
  const body = await req.json()
  const pair = body?.pair
  const action = body?.action

  if (
    !pair ||
    !["add", "remove"].includes(action)
  ) {
    return NextResponse.json(
      { error: "Invalid toggle request" },
      { status: 400 }
    )
  }

  const cleanPair = String(pair)
    .toUpperCase()
    .trim()

// ============================
// PLATFORM DETECTION
// ============================

// If request contains JWT from native app → android
const hasAuthHeader =
  req.headers.get("authorization")?.startsWith("Bearer ")

let platform = "web"

if (hasAuthHeader) {
  platform = "android"
} else {
  platform =
    req.cookies.get("fx_platform")?.value || "web"
}

  // ============================
  // BUILD GAS PAYLOAD
  // ============================
  const payload: any = {
    email,
    toggle_pair: cleanPair,
    toggle_action: action,
    toggle_platform: platform
  }

  // ============================
  // SEND TO GAS
  // ============================
  const res = await fetch(process.env.GAS_AUTH_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: "GAS update failed" },
      { status: 500 }
    )
  }

  const data = await res.json()

  return NextResponse.json({
    success: true,
    instruments: Array.isArray(data?.instruments)
      ? data.instruments
      : []
  })
}
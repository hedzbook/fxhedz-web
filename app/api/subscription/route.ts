import { NextRequest, NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/jwt"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET(req: NextRequest) {

  const jwtUser = verifyAccessToken(req)
  const session = await getServerSession(authOptions)

  let deviceId: string | undefined
  let email: string | undefined

  // ===============================
  // ANDROID (JWT)
  // ===============================
  if (jwtUser && typeof jwtUser === "object") {
    deviceId = (jwtUser as any).deviceId
    email = (jwtUser as any).email
  }

  // ===============================
  // WEB (NextAuth Session)
  // ===============================
  if (!email && session?.user?.email) {
    email = session.user.email
  }

  // ===============================
  // DEVICE COOKIE FALLBACK
  // ===============================
  if (!deviceId) {
    deviceId = req.cookies.get("fx_device")?.value
  }

  // ===============================
  // REQUIRE IDENTITY
  // ===============================
  if (!email || !deviceId) {
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

    if (!res.ok) {
      throw new Error("GAS request failed")
    }

    const data = await res.json()

    // ===============================
    // NORMALIZE PLAN
    // ===============================
    const rawPlan =
      (data?.plan || data?.status || "").toLowerCase()

    const expiryRaw =
      data?.expiry ? new Date(data.expiry) : null

    const now = new Date()

    // ===============================
    // ENFORCE EXPIRY
    // ===============================
    const isLivePlusActive =
      rawPlan === "live+" &&
      expiryRaw &&
      expiryRaw > now

    const finalPlan =
      isLivePlusActive ? "live+" : "live"

    return NextResponse.json({
      active: true,               // LIVE base is always active
      blocked: false,
      status: finalPlan,
      expiry: expiryRaw ?? null
    })

  } catch (err) {

    return NextResponse.json({
      active: false,
      blocked: true,
      status: null,
      expiry: null
    })

  }
}

import { NextRequest, NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/jwt"

export async function GET(req: NextRequest) {

  const jwtUser = verifyAccessToken(req)

  if (!jwtUser || typeof jwtUser !== "object") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const email = (jwtUser as any).email

  try {
    const res = await fetch(
      `${process.env.GAS_AUTH_URL}?secret=${process.env.GAS_SECRET}&email=${encodeURIComponent(email)}`,
      { cache: "no-store" }
    )

    if (!res.ok) {
      throw new Error("GAS request failed")
    }

    const data = await res.json()

    const rawPlan =
      (data?.plan || data?.status || "").toLowerCase()

    const expiryRaw =
      data?.expiry ? new Date(data.expiry) : null

    const now = new Date()

    const isLivePlusActive =
      rawPlan === "live+" &&
      expiryRaw &&
      expiryRaw > now

    const finalPlan =
      isLivePlusActive ? "live+" : "live"

    return NextResponse.json({
      active: true,
      blocked: false,
      status: finalPlan,
      expiry: expiryRaw ?? null
    })

  } catch {
    return NextResponse.json({
      active: false,
      blocked: true,
      status: null,
      expiry: null
    })
  }
}

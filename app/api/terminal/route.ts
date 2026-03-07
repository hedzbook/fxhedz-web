import { NextRequest, NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/jwt"

const GAS_TERMINAL_URL =
process.env.GAS_TERMINAL_URL!

export async function GET(req: NextRequest) {

  const jwtUser = verifyAccessToken(req)

  if (!jwtUser || typeof jwtUser !== "object") {
    return NextResponse.json({ error:"Unauthorized" },{ status:401 })
  }

  const email = (jwtUser as any).email

  try {

    const res = await fetch(
      `${GAS_TERMINAL_URL}?email=${encodeURIComponent(email)}`,
      { cache:"no-store" }
    )

    if(!res.ok){
      throw new Error("gas_failed")
    }

    const data = await res.json()

    return NextResponse.json(data)

  } catch {

    return NextResponse.json(
      { error:"terminal_fetch_failed" },
      { status:500 }
    )

  }

}
import { NextRequest, NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/jwt"

export async function POST(req: NextRequest) {

  const jwtUser = verifyAccessToken(req)

  if (!jwtUser || typeof jwtUser !== "object") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const email = (jwtUser as any).email

  await fetch(process.env.GAS_AUTH_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      logout_all_web: true,
      email
    })
  })

  return NextResponse.json({ success: true })
}
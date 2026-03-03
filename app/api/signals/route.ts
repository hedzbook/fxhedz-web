import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { verifyAccessToken } from "@/lib/jwt"

const GAS_BASE =
  "https://script.google.com/macros/s/AKfycby55ye_dTtWJ-QILNYJIaXWv74_n7n0muh3U--sBl7yowMlp1FzESOokWqeHI75U5_R/exec"

export async function GET(req: NextRequest) {

  const jwtUser = verifyAccessToken(req)

  let email: string | null = null

  if (jwtUser && typeof jwtUser === "object") {
    email = (jwtUser as any).email
  }

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

  try {
    const pair = req.nextUrl.searchParams.get("pair")

    const url = pair
      ? `${GAS_BASE}?secret=${process.env.GAS_SECRET}&email=${encodeURIComponent(email)}&pair=${pair}`
      : `${GAS_BASE}?secret=${process.env.GAS_SECRET}&email=${encodeURIComponent(email)}`

    const res = await fetch(url, { cache: "no-store" })
    const json = await res.json()

    if (pair && json?.signals?.[pair]) {
      return NextResponse.json({
        ...json.signals[pair],
        feed: json.feed || [],
        history: json.history || [],
        performance: json.performance || {},
        blocked: json.blocked,
        active: json.active,
        plan: json.plan,
        expiry: json.expiry,

        // 🔥 ADD THESE:
        appInstruments: json.appInstruments || [],
        webInstruments: json.webInstruments || [],
        telegramInstruments: json.telegramInstruments || []
      })
    }

    return NextResponse.json({
      ...json,
      appInstruments: json.appInstruments || [],
      webInstruments: json.webInstruments || [],
      telegramInstruments: json.telegramInstruments || []
    })

  } catch {
    return NextResponse.json(
      { error: "Signal fetch failed" },
      { status: 500 }
    )
  }
}
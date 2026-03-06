
import { NextRequest, NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/jwt"

const GAS_BASE =
  "https://script.google.com/macros/s/AKfycby55ye_dTtWJ-QILNYJIaXWv74_n7n0muh3U--sBl7yowMlp1FzESOokWqeHI75U5_R/exec"

export async function GET(req: NextRequest) {

  const fastMode =
  req.nextUrl.searchParams.get("fast") === "1"

  // ============================
  // REQUIRE JWT
  // ============================

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

    if (!res.ok) {
      throw new Error("GAS failed")
    }

    const json = await res.json()

    // ============================
    // SINGLE PAIR RESPONSE
    // ============================

if (pair && json?.signals?.[pair]) {

  // ============================
  // FAST MODE (3 second polling)
  // ============================

  if (fastMode) {
    return NextResponse.json({
      ...json.signals[pair]
    })
  }

  // ============================
  // FULL MODE (15 second refresh)
  // ============================

  return NextResponse.json({
    ...json.signals[pair],
    feed: json.feed || [],
    history: json.history || [],
    performance: json.performance || {},
    blocked: json.blocked,
    active: json.active,
    plan: json.plan,
    expiry: json.expiry,
    appInstruments: json.appInstruments || [],
    webInstruments: json.webInstruments || [],
    telegramInstruments: json.telegramInstruments || []
  })
}

    // ============================
    // FULL RESPONSE
    // ============================

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
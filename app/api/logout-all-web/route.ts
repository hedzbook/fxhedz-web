import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {

  const body = await req.json()
  const email = (body?.email || "").toLowerCase().trim()

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 })
  }

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
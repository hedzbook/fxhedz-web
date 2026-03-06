import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {

  const body = await req.json()
  const email = body.email

  const res = await fetch(process.env.GAS_AUTH_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      regenerate_hash: true,
      email
    })
  })

  const data = await res.json()

  return NextResponse.json(data)
}
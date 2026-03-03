import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {

  const body = await req.json()

  const res = await fetch(process.env.GAS_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      logout_device: true,
      email: body.email,
      device_id: body.device_id,
      platform: body.platform
    })
  })

  const data = await res.json()

  return NextResponse.json(data)
}

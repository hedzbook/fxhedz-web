import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: NextRequest) {

  const body = await req.text()
  const signature = req.headers.get("x-razorpay-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  // ðŸ” VERIFY WEBHOOK SIGNATURE
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex")

  if (expected !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const event = JSON.parse(body)

  // We only care about successful payments
  if (event.event !== "payment.captured") {
    return NextResponse.json({ ok: true })
  }

  const payment = event.payload.payment.entity

  const email = payment.email
  const notes = payment.notes || {}
  const months = Number(notes.months || 1)

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 })
  }

  // ðŸ” CALL GAS TO ACTIVATE
  const gasRes = await fetch(process.env.GAS_AUTH_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      activate_months: months
    })
  })

  if (!gasRes.ok) {
    console.error("GAS activation failed")
    return NextResponse.json(
      { error: "Activation failed" },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
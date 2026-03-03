
import jwt from "jsonwebtoken"

const ACCESS_EXPIRES_IN = "15m"

export function createAccessToken(payload: {
  email: string
  deviceId?: string
}) {
  if (!process.env.FXHEDZ_SECRET) {
    throw new Error("Missing FXHEDZ_SECRET")
  }

  return jwt.sign(
    payload,
    process.env.FXHEDZ_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  )
}

export function verifyAccessToken(req: Request) {
  const authHeader = req.headers.get("authorization")

  if (!authHeader?.startsWith("Bearer ")) return null

  const token = authHeader.replace("Bearer ", "")

  try {
    return jwt.verify(token, process.env.FXHEDZ_SECRET!)
  } catch {
    return null
  }
}
import jwt from "jsonwebtoken"

const SECRET = process.env.FXHEDZ_SECRET!

export function createAccessToken(payload: {
  email: string
  deviceId: string
}) {
  return jwt.sign(payload, SECRET, {
    expiresIn: "15m"
  })
}

export function verifyAccessToken(req: Request) {
  const authHeader = req.headers.get("authorization")

  if (!authHeader?.startsWith("Bearer ")) return null

  const token = authHeader.replace("Bearer ", "")

  try {
    return jwt.verify(token, SECRET)
  } catch {
    return null
  }
}
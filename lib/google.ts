import { OAuth2Client } from "google-auth-library"

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
)

export async function verifyGoogleIdToken(idToken: string) {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()

    if (!payload?.email || !payload.email_verified) {
      return null
    }

    return {
      email: payload.email.toLowerCase(),
      name: payload.name,
      picture: payload.picture,
    }

  } catch {
    return null
  }
}
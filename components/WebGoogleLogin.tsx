"use client"

import { useEffect } from "react"

export default function WebGoogleLogin() {

  const isTelegram =
    typeof window !== "undefined" &&
    (window as any)?.Telegram?.WebApp

  useEffect(() => {

    if (isTelegram) return

    // Normal Web (GIS popup)
    // @ts-ignore
    google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    })

    // @ts-ignore
    google.accounts.id.renderButton(
      document.getElementById("googleBtn"),
      { theme: "outline", size: "large" }
    )

  }, [])

  async function completeLogin(idToken: string) {

    let deviceId: string | null = null

    const tg = (window as any)?.Telegram?.WebApp

    if (tg?.initDataUnsafe?.user?.id) {
      deviceId = "tg_" + tg.initDataUnsafe.user.id
    } else {
      deviceId =
        localStorage.getItem("fxhedz_device_id") ||
        crypto.randomUUID()

      localStorage.setItem("fxhedz_device_id", deviceId)
    }

    const res = await fetch("/api/web-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, deviceId })
    })

    const data = await res.json()

    if (res.status === 403 && data.device_limit) {
      localStorage.setItem("email", data.email)
      localStorage.setItem("fxhedz_device_id", deviceId)

      window.dispatchEvent(
        new CustomEvent("fxhedz-device-limit", {
          detail: { count: data.device_count }
        })
      )

      return
    }

    localStorage.setItem("refreshToken", data.refreshToken)
    localStorage.setItem("email", data.email)
    localStorage.setItem("fxhedz_device_id", deviceId)

    window.location.reload()
  }

  async function handleCredentialResponse(response: any) {
    await completeLogin(response.credential)
  }

  function startTelegramGoogleFlow() {

    const redirectUri =
      window.location.origin + "/oauth-callback"

    const url =
      "https://accounts.google.com/o/oauth2/v2/auth?" +
      new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        redirect_uri: redirectUri,
        response_type: "id_token",
        scope: "openid email profile",
        nonce: crypto.randomUUID()
      }).toString()

    window.location.href = url
  }

  if (isTelegram) {
    return (
      <button
        onClick={startTelegramGoogleFlow}
        className="bg-white text-black px-4 py-2 rounded"
      >
        Sign in with Google
      </button>
    )
  }

  return <div id="googleBtn" />
}
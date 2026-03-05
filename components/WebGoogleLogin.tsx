
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

  // trigger verifying overlay immediately
  window.dispatchEvent(new Event("fxhedz-login-start"))

  let deviceId = localStorage.getItem("fxhedz_device_id")

    if (!deviceId) {
      deviceId = crypto.randomUUID()
      localStorage.setItem("fxhedz_device_id", deviceId)
    }

    const telegramChatId =
      localStorage.getItem("fx_tg_id") || ""

    const res = await fetch("/api/web-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken,
        deviceId,
        telegram_chat_id: telegramChatId
      })
    })

    const data = await res.json()

    // ===============================
    // DEVICE LIMIT
    // ===============================
if (res.status === 403 && data.device_limit) {

  localStorage.setItem("email", data.email)
  localStorage.setItem("fxhedz_device_id", deviceId)

  // persist device limit
  localStorage.setItem("fx_device_limit", "true")
  localStorage.setItem("fx_device_limit_count", String(data.device_count))

  window.dispatchEvent(
    new CustomEvent("fxhedz-device-limit", {
      detail: { count: data.device_count }
    })
  )

  return
}

    // ===============================
    // ANY OTHER ERROR
    // ===============================
    if (!res.ok) {
      return
    }

    // ===============================
    // SUCCESS LOGIN
    // ===============================

    // Clear any previous device-limit state
    localStorage.removeItem("fx_device_limit")
    localStorage.removeItem("fx_device_limit_count")

localStorage.setItem("refreshToken", data.refreshToken)
localStorage.setItem("email", data.email)

// trigger loading UI immediately
localStorage.setItem("fxhedz_loading", "true")

window.location.reload()
  }

  async function handleCredentialResponse(response: any) {
    await completeLogin(response.credential)
  }

  function startTelegramGoogleFlow() {

    try {
      const tg = (window as any)?.Telegram?.WebApp
      const tgUserId = tg?.initDataUnsafe?.user?.id

      if (tgUserId) {
        localStorage.setItem("fx_tg_id", String(tgUserId))
      }
    } catch { }

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

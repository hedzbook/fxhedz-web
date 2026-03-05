
"use client"

import { useEffect } from "react"

export default function WebGoogleLogin() {

const isTelegram =
  typeof window !== "undefined" &&
  Boolean((window as any)?.Telegram?.WebApp?.initDataUnsafe)

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
      className="
        flex items-center justify-center
        gap-[clamp(6px,1vw,10px)]

        w-[clamp(150px,70vw,260px)]

        py-[clamp(8px,1.6vh,12px)]
        px-[clamp(14px,3vw,22px)]

        text-[clamp(12px,1.4vw,16px)] font-medium

        bg-white hover:bg-neutral-50
        rounded-md border border-neutral-300
        shadow-sm transition-all duration-200
        active:scale-[0.98]
      "
    >
      <GoogleIcon />
      <span className="whitespace-nowrap">Sign in with Google</span>
    </button>
  )
}

  return <div id="googleBtn" />
}

function GoogleIcon() {
  return (
    <svg
      className="w-[clamp(16px,1.2vw,20px)] h-[clamp(16px,1.2vw,20px)] shrink-0"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.173.282-1.712V4.956H.957a8.996 8.996 0 000 8.088l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.956l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}
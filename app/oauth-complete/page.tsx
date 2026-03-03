
"use client"

import { useEffect } from "react"

export default function OAuthComplete() {

  useEffect(() => {

    const params = new URLSearchParams(window.location.search)
    const idToken = params.get("id_token")

    if (!idToken) return

    async function finish() {

      let deviceId = localStorage.getItem("fxhedz_device_id")

      if (!deviceId) {
        deviceId = crypto.randomUUID()
        localStorage.setItem("fxhedz_device_id", deviceId)
      }

      let telegramChatId = ""

      try {
        const tg = (window as any)?.Telegram?.WebApp
        if (tg?.initDataUnsafe?.user?.id) {
          telegramChatId = String(tg.initDataUnsafe.user.id)
        }
      } catch { }

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

      localStorage.setItem("refreshToken", data.refreshToken)
      localStorage.setItem("email", data.email)

      window.location.href = "/"
    }

    finish()

  }, [])

  return <div className="text-white">Signing you in...</div>
}

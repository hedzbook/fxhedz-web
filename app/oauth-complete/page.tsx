"use client"

import { useEffect } from "react"

export default function OAuthComplete() {

  useEffect(() => {

    const params = new URLSearchParams(window.location.search)
    const idToken = params.get("id_token")

    if (!idToken) return

    async function finish() {

      let deviceId = localStorage.getItem("deviceId")

      if (!deviceId) {
        deviceId = crypto.randomUUID()
        localStorage.setItem("deviceId", deviceId)
      }

      const res = await fetch("/api/web-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, deviceId })
      })

      const data = await res.json()

      localStorage.setItem("refreshToken", data.refreshToken)
      localStorage.setItem("email", data.email)
      localStorage.setItem("fxhedz_device_id", deviceId)

      window.location.href = "/"
    }

    finish()

  }, [])

  return <div className="text-white">Signing you in...</div>
}
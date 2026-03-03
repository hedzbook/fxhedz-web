"use client"

import { useEffect } from "react"

export default function WebGoogleLogin() {

    useEffect(() => {

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

    async function handleCredentialResponse(response: any) {

        const idToken = response.credential

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

        if (res.status === 403 && data.device_limit) {
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

    return <div id="googleBtn" />
}
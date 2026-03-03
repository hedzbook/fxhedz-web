
"use client"

import { useEffect } from "react"

export default function OAuthCallback() {

  useEffect(() => {

    const hash = window.location.hash
    if (!hash) return

    const params = new URLSearchParams(hash.substring(1))
    const idToken = params.get("id_token")

    if (!idToken) return

    window.location.href =
      "/oauth-complete?id_token=" + idToken

  }, [])

  return <div className="text-white">Completing login...</div>
}


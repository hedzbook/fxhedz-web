
export function ensureDeviceIdentity() {
  if (typeof window === "undefined") return null

  const isAndroid =
    typeof window !== "undefined" &&
    (window as any).ReactNativeWebView

  let deviceId: string | null = localStorage.getItem("fxhedz_device_id")
  let fingerprint: string | null = localStorage.getItem("fxhedz_fp")

  // ===============================
  // ANDROID: Use native device ID
  // ===============================
  if (isAndroid && (window as any).__NATIVE_DEVICE_ID__) {

    const nativeId = String((window as any).__NATIVE_DEVICE_ID__)

    deviceId = nativeId
    fingerprint = nativeId

    localStorage.setItem("fxhedz_device_id", nativeId)
    localStorage.setItem("fxhedz_fp", nativeId)

  } else {

    // ===============================
    // WEB: Generate if missing
    // ===============================

    if (!deviceId) {
      deviceId = crypto.randomUUID()
      localStorage.setItem("fxhedz_device_id", deviceId)
    }

    if (!fingerprint) {

      const raw =
        navigator.userAgent +
        screen.width +
        screen.height

      fingerprint =
        crypto.randomUUID() + "-" + btoa(raw).slice(0, 12)

      localStorage.setItem("fxhedz_fp", fingerprint)
    }
  }

  // At this point both MUST be strings
  const finalDeviceId = deviceId ?? ""
  const finalFingerprint = fingerprint ?? ""

  document.cookie = `fx_device=${finalDeviceId}; path=/; max-age=31536000`
  document.cookie = `fx_fp=${finalFingerprint}; path=/; max-age=31536000`

  return { deviceId: finalDeviceId, fingerprint: finalFingerprint }
}

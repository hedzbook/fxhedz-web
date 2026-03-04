"use client"

import { useMemo } from "react"

type Props = {
    accessMeta: {
        active?: boolean
        status?: string | null
        expiry?: string | null
    } | null
    deviceId?: string | null
    version: string
    onLogout: () => void
}

const PLAN = {
    label: "LIVE+ Monthly",
    price: "$9.99 / month",
    razorpayLink: "https://rzp.io/l/fxhedz_monthly", // replace with real link
    playSku: "fxhedz_liveplus"
}

export default function ControlPanel({
    accessMeta,
    deviceId,
    version,
    onLogout
}: Props) {

    const isAndroid =
        typeof window !== "undefined" &&
        !!(window as any).ReactNativeWebView

    const nativeEmail =
        typeof window !== "undefined"
            ? (window as any).__NATIVE_EMAIL__ || null
            : null

    const daysLeft = useMemo(() => {
        if (!accessMeta?.expiry) return null
        const now = new Date()
        const expiry = new Date(accessMeta.expiry)
        const diff = expiry.getTime() - now.getTime()
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }, [accessMeta])

    function handleUpgrade() {

        if (isAndroid) {
            (window as any).ReactNativeWebView.postMessage(
                JSON.stringify({
                    type: "PLAY_BILLING_REQUEST",
                    sku: PLAN.playSku
                })
            )
            return
        }

        window.open(PLAN.razorpayLink, "_blank")
    }

    const status = accessMeta?.status?.toLowerCase()
    const isAccountActive = Boolean(accessMeta?.active)
    const isLivePlus = status === "live+"
    const planName = (status || "none").toUpperCase()

    return (
        <div
            className="
    w-full
    flex
    flex-col
    flex-1
    overflow-y-auto
    bg-neutral-900
    pt-6
    pb-4
    px-4
    space-y-6
    text-[clamp(9px,5.5px+1.0937vw,19.5px)]
  "
        >

            {/* ================= ACCOUNT BLOCK ================= */}
            <Block title="Account">

                <Row
                    label="Email"
                    value={
                        isAndroid
                            ? nativeEmail || "—"
                            : localStorage.getItem("email") || "—"
                    }
                />

                <Row
                    label="Plan"
                    value={planName}
                    highlight={isLivePlus ? "green" : undefined}
                />

                <Row
                    label="Status"
                    value={isAccountActive ? "ACTIVE" : "EXPIRED"}
                    highlight={isAccountActive ? "green" : "red"}
                />

                {deviceId && (
                    <DeviceBlock deviceId={deviceId} />
                )}

            </Block>

            {/* ================= SUBSCRIPTION BLOCK ================= */}
            <Block title="Subscription">

                {!isLivePlus ? (

                    <button
                        onClick={handleUpgrade}
                        className="w-full py-3 bg-sky-600 hover:bg-sky-500 rounded-md font-semibold transition-colors"
                    >
                        Upgrade to LIVE+
                        <div className="text-xs text-sky-200 mt-1">
                            {PLAN.price}
                        </div>
                    </button>

                ) : (

                    <div className="w-full py-3 bg-emerald-600 rounded-md font-semibold text-center">
                        LIVE+ ACTIVE
                    </div>

                )}

                <div className="text-neutral-400 text-xs leading-relaxed">
                    LIVE+ provides full institutional access with real-time signals across all instruments.
                </div>

            </Block>

            {/* ================= SYSTEM BLOCK ================= */}
            <Block title="System">

                <Row label="Version" value={version} mono />
                <Row label="Platform" value={isAndroid ? "ANDROID" : "WEB"} />
                <Row label="Latency" value="~120ms" />
                <Row label="Last Sync" value="Live" />

            </Block>

            {/* ================= LOGOUT ================= */}
            <div className="mt-auto pt-4 border-t border-neutral-800">
                <button
                    onClick={onLogout}
                    className="w-full text-red-500 font-semibold hover:text-red-400 transition-colors"
                >
                    Sign Out
                </button>
            </div>

            {/* ================= SUPPORT BLOCK ================= */}
            <Block title="Support">

                <LinkBtn label="Help" href="https://t.me/fxhedzbot" />
                <LinkBtn label="Telegram" href="https://t.me/fxhedzbot" />
                <LinkBtn label="Risk Disclosure" href="/risk" />
                <LinkBtn label="Terms" href="/terms" />

            </Block>

            {/* ================= LOGOUT ================= */}
            <div className="mt-auto pt-4 border-t border-neutral-800">
                <button
                    onClick={onLogout}
                    className="w-full text-red-500 font-semibold hover:text-red-400 transition-colors"
                >
                    Sign Out
                </button>
            </div>
        </div>
    )
}

/* ================= COMPONENT HELPERS ================= */

function Block({ title, children }: any) {
    return (
        <div className="space-y-3">
            <div className="text-neutral-400 uppercase text-xs tracking-wider">
                {title}
            </div>
            {children}
        </div>
    )
}

function Row({
    label,
    value,
    highlight,
    mono
}: any) {
    return (
        <div className="flex justify-between">
            <span className="text-neutral-500">{label}</span>
            <span
                className={`
          ${mono ? "font-mono text-xs" : ""}
          ${highlight === "green" ? "text-green-400" : ""}
          ${highlight === "red" ? "text-red-400" : ""}
        `}
            >
                {value}
            </span>
        </div>
    )
}

function DeviceBlock({ deviceId }: { deviceId: string }) {
    return (
        <div className="pt-3 border-t border-neutral-800 space-y-2">

            <div className="text-neutral-500 text-xs tracking-wide">
                Device
            </div>

            <div
                className="
          font-mono text-[clamp(9px,5.5px+1.0937vw,19.5px)]
          text-neutral-400
          leading-snug
          break-all
          bg-neutral-800/40
          border border-neutral-800
          rounded-md
          px-3 py-2
          text-center
        "
            >
                {deviceId}
            </div>

        </div>
    )
}

function LinkBtn({ label, href }: any) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sky-400 hover:text-sky-300 transition-colors"
        >
            {label}
        </a>
    )
}

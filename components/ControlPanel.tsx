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
    razorpayLink: "https://rzp.io/l/fxhedz_monthly",
    playSku: "fxhedz_liveplus"
}

const PLAYSTORE_URL =
    "https://play.google.com/store/apps/details?id=com.fxhedz.live"

export default function ControlPanel({
    accessMeta,
    deviceId,
    version,
    onLogout
}: Props) {

    const isAndroid =
        typeof window !== "undefined" &&
        !!(window as any).ReactNativeWebView

    const isTelegram =
        typeof window !== "undefined" &&
        (window as any)?.Telegram?.WebApp

    const showAndroidDownload = !isAndroid || isTelegram

    const nativeEmail =
        typeof window !== "undefined"
            ? (window as any).__NATIVE_EMAIL__ || null
            : null

    const webEmail =
        typeof window !== "undefined"
            ? localStorage.getItem("email")
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
            ; (window as any).ReactNativeWebView.postMessage(
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
bg-neutral-900
pt-6
pb-4
px-5
text-sm
overflow-y-auto
controlpanel-scroll
max-h-screen
"
        >

            <Section>

                <Title>Account</Title>

                <Row label="Email" value={isAndroid ? nativeEmail || "—" : webEmail || "—"} />

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
                    <Row label="Device" value={deviceId} mono />
                )}

            </Section>

            <Section>

                <Title>Subscription</Title>

                {!isLivePlus ? (

                    <button
                        onClick={handleUpgrade}
                        className="
            w-full
            py-3
            bg-sky-600
            hover:bg-sky-500
            rounded-md
            font-semibold
            transition-colors
          "
                    >
                        Upgrade to LIVE+
                        <div className="text-xs text-sky-200 mt-1">
                            {PLAN.price}
                        </div>
                    </button>

                ) : (

                    <>
                        <div className="bg-emerald-600/20 border border-emerald-600 rounded-md py-3 text-center font-semibold text-emerald-400">
                            LIVE+ ACTIVE
                        </div>

                        {accessMeta?.expiry && (
                            <>
                                <Row
                                    label="Expiry"
                                    value={new Date(accessMeta.expiry).toLocaleDateString()}
                                />

                                <Row
                                    label="Days Left"
                                    value={daysLeft?.toString() ?? "0"}
                                    highlight={daysLeft && daysLeft <= 3 ? "red" : "green"}
                                />
                            </>
                        )}
                    </>
                )}

                <p className="text-neutral-400 text-xs leading-relaxed">
                    LIVE+ provides real-time signals across all instruments.
                </p>

            </Section>

            {showAndroidDownload && (

                <Section>

                    <Title>Mobile App</Title>

                    <a
                        href={PLAYSTORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex justify-center"
                    >
                        <img
                            src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                            alt="Get it on Google Play"
                            className="h-14"
                        />
                    </a>

                    <p className="text-neutral-400 text-xs text-center">
                        Install the FXHEDZ app for push alerts.
                    </p>

                </Section>

            )}

            <Section>

                <Title>System</Title>

                <Row label="Version" value={version} mono />
                <Row label="Platform" value={isAndroid ? "ANDROID" : "WEB"} />
                <Row label="Latency" value="~120ms" />
                <Row label="Last Sync" value="Live" />

            </Section>

            <Section>

                <Title>Support</Title>

                <LinkBtn label="Help" href="https://t.me/fxhedzbot" />
                <LinkBtn label="Telegram" href="https://t.me/fxhedzbot" />
                <LinkBtn label="Risk Disclosure" href="/risk" />
                <LinkBtn label="Terms" href="/terms" />

            </Section>

            <div className="pt-4">
                <button
                    onClick={onLogout}
                    className="
  w-full
  py-2
  text-red-500
  font-semibold
  hover:text-red-400
  transition-colors
"
                >
                    Sign Out
                </button>
            </div>

        </div>
    )
}

function Section({ children }: any) {
    return (
        <div className="space-y-3 pt-5 pb-5 border-b border-neutral-800 first:pt-0 last:border-none">
            {children}
        </div>
    )
}

function Title({ children }: any) {
    return (
        <div className="text-neutral-400 uppercase text-xs tracking-wider">
            {children}
        </div>
    )
}

function Row({ label, value, highlight, mono }: any) {
    return (
        <div className="flex justify-between items-center">
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

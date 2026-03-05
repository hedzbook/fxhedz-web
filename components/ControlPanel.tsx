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

const PLANS = [
    {
        label: "1 Month",
        price: "$9.99",
        months: 1,
        razorpay: "https://rzp.io/rzp/ssReKHK",
        sku: "fxhedz_monthly"
    },
    {
        label: "3 Months",
        price: "$26.99",
        months: 3,
        razorpay: "https://rzp.io/rzp/Npm6HPL",
        sku: "fxhedz_quarterly",
        highlight: true
    },
    {
        label: "6 Months",
        price: "$47.99",
        months: 6,
        razorpay: "https://rzp.io/rzp/YWH4Fyxx",
        sku: "fxhedz_semiannual"
    }
]

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
  Boolean((window as any)?.Telegram?.WebApp?.initData)

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

    function handleUpgrade(plan: any) {

        if (isAndroid) {

            ; (window as any).ReactNativeWebView.postMessage(
                JSON.stringify({
                    type: "PLAY_BILLING_REQUEST",
                    sku: plan.sku
                })
            )

            return
        }

        window.open(plan.razorpay, "_blank")
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

                <div className="text-emerald-400 uppercase text-xs tracking-wider">
                    <Title>{isLivePlus ? "LIVE+ STATUS" : "GO LIVE+"}</Title>
                </div>

                {!isLivePlus ? (

                    <div className="flex gap-2">

                        {PLANS.map((plan) => (

                            <button
                                key={plan.months}
                                onClick={() => handleUpgrade(plan)}
                                className={`
        flex-1
        py-3
        rounded-md
        text-center
        transition-colors
        font-semibold
${plan.highlight
                                        ? "bg-emerald-600 hover:bg-emerald-500 animate-pulse"
                                        : "bg-sky-600 hover:bg-sky-500"}
      `}
                            >

                                <div>{plan.label}</div>

                                <div className="text-xs opacity-80">
                                    {plan.price}
                                </div>

                            </button>

                        ))}

                    </div>

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

            {!isAndroid && (

                <Section>

                    <Title>Mobile App</Title>

                    <a
                        href={PLAYSTORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex justify-center"
                    >
                        <img
                            src="/playstore.png"
                            alt="Get it on Google Play"
                            className="h-12"
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
                <Row
                    label="Platform"
                    value={
                        isAndroid
                            ? "ANDROID"
                            : isTelegram
                                ? "TELEGRAM"
                                : "WEB"
                    }
                />
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
        <div className="space-y-3 pt-6 pb-5 border-b border-neutral-800 first:pt-0 last:border-none">
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
  ${mono ? "font-mono text-xs text-neutral-400" : ""}
  ${!mono ? "text-neutral-200" : ""}
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

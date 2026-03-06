"use client"

import { useMemo, useState, useEffect } from "react"

/**
 * FXHEDZ Professional Control Panel
 * Production Ready
 */

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

const PLAYSTORE_URL = "https://play.google.com/store/apps/details?id=com.fxhedz.live"
const MT5_EA_URL = "/api/ea-download"

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

    const nativeEmail = useMemo(() => {
        if (typeof window === "undefined") return null
        return (window as any).__NATIVE_EMAIL__ || null
    }, [])

    const webEmail = useMemo(() => {
        if (typeof window === "undefined") return null
        return localStorage.getItem("email")
    }, [])

    const [showEASetup, setShowEASetup] = useState(false)

    const daysLeft = useMemo(() => {
        if (!accessMeta?.expiry) return null
        const now = new Date()
        const expiry = new Date(accessMeta.expiry)
        const diff = expiry.getTime() - now.getTime()
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }, [accessMeta])

    const status = accessMeta?.status?.toLowerCase()
    const isAccountActive = Boolean(accessMeta?.active)
    const isLivePlus = status === "live+"
    const planName = (status || "none").toUpperCase()

    function handleUpgrade(plan: any) {

        if (isAndroid) {
            ;(window as any).ReactNativeWebView.postMessage(
                JSON.stringify({
                    type: "PLAY_BILLING_REQUEST",
                    sku: plan.sku
                })
            )
            return
        }

        window.open(plan.razorpay, "_blank")
    }

    // lock background scroll when EA modal open
    useEffect(() => {

        if (showEASetup) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }

        return () => {
            document.body.style.overflow = ""
        }

    }, [showEASetup])

    return (
        <div className="relative w-full h-full flex flex-col bg-black text-neutral-200 overflow-hidden">

            {/* MAIN SCROLL AREA */}
            <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28 space-y-6">

                {/* ACCOUNT */}
                <Section title="User Identification">
                    <Row
                        label="Account ID"
                        value={isAndroid ? nativeEmail || "Guest" : webEmail || "Guest"}
                    />

                    <Row
                        label="Subscription"
                        value={planName}
                        color={isLivePlus ? "text-emerald-400" : "text-neutral-400"}
                    />

                    <Row
                        label="System Status"
                        value={isAccountActive ? "AUTHORIZED" : "UNAUTHORIZED"}
                        color={isAccountActive ? "text-emerald-400" : "text-red-500"}
                    />

                    {deviceId && (
                        <Row label="Hardware ID" value={deviceId} mono />
                    )}
                </Section>

                {/* LIVE+ */}
                <Section title={isLivePlus ? "Subscription Analytics" : "Upgrade to LIVE+"}>

                    {!isLivePlus ? (

                        <div className="space-y-4">

                            <div className="grid grid-cols-3 gap-2">

                                {PLANS.map(plan => (

                                    <button
                                        key={plan.months}
                                        onClick={() => handleUpgrade(plan)}
                                        className={`flex flex-col items-center py-3 rounded-lg border transition-all ${
                                            plan.highlight
                                                ? "bg-emerald-600/10 border-emerald-500 text-emerald-400"
                                                : "bg-neutral-900 border-neutral-800 hover:border-neutral-600"
                                        }`}
                                    >
                                        <span className="text-xs font-bold">
                                            {plan.label}
                                        </span>

                                        <span className="text-[10px] opacity-60">
                                            {plan.price}
                                        </span>

                                    </button>

                                ))}

                            </div>

                            <p className="text-[11px] text-neutral-500">
                                LIVE+ unlocks all instruments and real-time signal automation.
                            </p>

                        </div>

                    ) : (

                        <div className="space-y-3">

                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 flex justify-between">

                                <span className="text-xs text-emerald-400 font-semibold">
                                    PREMIUM ACTIVE
                                </span>

                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />

                            </div>

                            {accessMeta?.expiry && (

                                <>
                                    <Row
                                        label="Renewal Date"
                                        value={new Date(accessMeta.expiry).toLocaleDateString()}
                                    />

                                    <Row
                                        label="Time Remaining"
                                        value={`${daysLeft ?? 0} Days`}
                                        color={daysLeft && daysLeft <= 3 ? "text-red-400" : "text-emerald-400"}
                                    />
                                </>

                            )}

                        </div>

                    )}

                </Section>

                {/* EA CARD */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">

                    <div className="flex justify-between items-start mb-3">

                        <div>
                            <h3 className="text-sm font-bold text-white">
                                iHEDZ Expert Advisor
                            </h3>

                            <p className="text-[11px] text-neutral-500">
                                Connect FXHEDZ signals to MetaTrader 5
                            </p>
                        </div>

                        <img
                            src="/mt5ea.png"
                            alt="EA"
                            className="h-8 opacity-80"
                        />

                    </div>

                    <button
                        onClick={() => setShowEASetup(true)}
                        className="w-full bg-white text-black text-xs font-bold py-2.5 rounded-lg"
                    >
                        {isLivePlus ? "INSTALLATION GUIDE" : "VIEW PREREQUISITES"}
                    </button>

                </div>

                {/* PLAY STORE */}
                {!isAndroid && (

                    <Section title="Mobile Application">

                        <div className="flex justify-center">

                            <a
                                href={PLAYSTORE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <img
                                    src="/playstore.png"
                                    alt="Get it on Google Play"
                                    className="h-12"
                                />
                            </a>

                        </div>

                        <p className="text-[11px] text-neutral-500 text-center">
                            Install the FXHEDZ mobile app for instant signal alerts.
                        </p>

                    </Section>

                )}

                {/* SYSTEM */}
                <Section title="Engine Status">

                    <Row label="Version" value={version} mono />

                    <Row
                        label="Environment"
                        value={
                            isAndroid
                                ? "Android App"
                                : isTelegram
                                    ? "Telegram Mini App"
                                    : "Web Platform"
                        }
                    />

                    <Row label="Latency" value="~120ms" color="text-emerald-400" />

                    <Row label="Data Stream" value="Synchronized" />

                </Section>

                {/* SUPPORT */}
                <Section title="Resource Center">

                    <ExternalLink label="Technical Support" href="https://t.me/fxhedzbot" />

                    <ExternalLink label="Risk Disclosure" href="/risk" />

                    <ExternalLink label="Terms of Service" href="/terms" />

                    <ExternalLink label="Community Hub" href="https://t.me/fxhedz" />

                </Section>

                {/* LOGOUT */}
                <button
                    onClick={onLogout}
                    className="w-full py-4 text-xs font-bold text-neutral-600 hover:text-red-500"
                >
                    TERMINATE SESSION
                </button>

            </div>

            {/* EA MODAL */}
            {showEASetup && (

                <div className="absolute inset-0 z-50 bg-black flex flex-col">

                    <div className="flex justify-between items-center px-6 py-5 border-b border-neutral-900">

                        <span className="text-xs font-bold text-white uppercase">
                            MT5 Deployment Guide
                        </span>

                        <button
                            onClick={() => setShowEASetup(false)}
                            className="text-neutral-500 hover:text-white text-lg"
                        >
                            ✕
                        </button>

                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">

                        <Step
                            num="01"
                            title="Download Expert Advisor"
                            desc="Download the FXHEDZ EA file."
                            img="/ea/step1.png"
                            items={[
                                "Ensure extension is .ex5",
                                "Do not rename file",
                                "Save to desktop"
                            ]}
                        />

                        <Step
                            num="02"
                            title="Install in MT5"
                            desc="Move file into Experts folder."
                            img="/ea/step1.png"
                            items={[
                                "Open MT5 Data Folder",
                                "Navigate to MQL5 → Experts",
                                "Restart MetaTrader"
                            ]}
                        />

                    </div>

                    <div className="p-6 bg-neutral-950 border-t border-neutral-900">

                        {isLivePlus ? (

                            <a
                                href={MT5_EA_URL}
                                download
                                className="block w-full text-center bg-emerald-600 py-3 rounded-lg font-bold text-sm"
                            >
                                DOWNLOAD EA
                            </a>

                        ) : (

                            <button
                                onClick={() => setShowEASetup(false)}
                                className="w-full bg-sky-600 py-3 rounded-lg font-bold text-sm"
                            >
                                UPGRADE TO ACCESS EA
                            </button>

                        )}

                    </div>

                </div>

            )}

        </div>
    )
}

function Section({ title, children }: any) {
    return (
        <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">
                {title}
            </h4>
            <div className="space-y-2.5">{children}</div>
        </div>
    )
}

function Row({ label, value, color = "text-neutral-200", mono = false }: any) {
    return (
        <div className="flex justify-between items-center border-b border-neutral-900/50 pb-1.5">
            <span className="text-[11px] text-neutral-500">
                {label}
            </span>

            <span className={`text-[11px] font-semibold ${color} ${mono ? "font-mono bg-neutral-900 px-1 rounded" : ""}`}>
                {value}
            </span>
        </div>
    )
}

function ExternalLink({ label, href }: any) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-sky-500 hover:text-sky-400"
        >
            {label} ↗
        </a>
    )
}

function Step({ num, title, desc, img, items }: any) {
    return (
        <div className="space-y-4">

            <div className="flex gap-4">

                <span className="text-2xl font-black text-neutral-800">
                    {num}
                </span>

                <div>
                    <h5 className="text-sm font-bold text-white">
                        {title}
                    </h5>

                    <p className="text-xs text-neutral-500">
                        {desc}
                    </p>
                </div>

            </div>

            <img
                src={img}
                className="w-full rounded-lg border border-neutral-800"
            />

            <ul className="space-y-2">

                {items.map((item: string, i: number) => (

                    <li key={i} className="text-[11px] text-neutral-400 flex items-center gap-2">

                        <div className="h-1 w-1 rounded-full bg-sky-500" />

                        {item}

                    </li>

                ))}

            </ul>

        </div>
    )
}
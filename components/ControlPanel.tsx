"use client"

import { useMemo, useState } from "react"

type Props = {
    accessMeta: {
        active?: boolean
        status?: string | null
        expiry?: string | null
    } | null
    deviceId?: string | null
    version: string
    onLogout: () => void
    setView: (view: "signals" | "hedz") => void
    closeMenu: () => void
}
const PLANS = [
    { label: "1 Month", price: "$9.99", months: 1, razorpay: "https://rzp.io/rzp/ssReKHK", sku: "fxhedz_monthly" },
    { label: "3 Months", price: "$26.99", months: 3, razorpay: "https://rzp.io/rzp/Npm6HPL", sku: "fxhedz_quarterly", highlight: true },
    { label: "6 Months", price: "$47.99", months: 6, razorpay: "https://rzp.io/rzp/YWH4Fyxx", sku: "fxhedz_semiannual" }
]

const PLAYSTORE_URL = "https://play.google.com/store/apps/details?id=com.fxhedz.live"
const MT5_EA_URL = "/api/ea-download"

export default function ControlPanel({ accessMeta, deviceId, version, onLogout, setView, closeMenu }: Props) {

    const [showEASetup, setShowEASetup] = useState(false)

    const env = useMemo(() => {
        if (typeof window === "undefined")
            return { isAndroid: false, isTelegram: false, email: null }

        return {
            isAndroid: !!(window as any).ReactNativeWebView,
            isTelegram: Boolean((window as any)?.Telegram?.WebApp?.initData),
            email: (window as any).__NATIVE_EMAIL__ || localStorage.getItem("email") || "—",
            hash: (window as any).__USER_HASH__ || localStorage.getItem("hash") || null
        }
    }, [])

    const daysLeft = useMemo(() => {
        if (!accessMeta?.expiry) return null
        const diff = new Date(accessMeta.expiry).getTime() - Date.now()
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }, [accessMeta])

    const activeMonths = useMemo(() => {
        if (!daysLeft) return 0
        if (daysLeft < 14) return 0
        if (daysLeft <= 31) return 1
        if (daysLeft <= 93) return 3
        return 6
    }, [daysLeft])

    const handleUpgrade = (plan: typeof PLANS[0]) => {
        if (env.isAndroid) {
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

    return (
        <>
            <div className="relative w-full h-full flex flex-col bg-[#0f0f0f] text-neutral-200 text-sm overflow-y-auto controlpanel-scroll pb-0">

                {/* ACCOUNT */}
                <Section title="Account Profile">
                    <Row label="User" value={env.email} />

                    {env.hash && (
                        <div className="flex justify-between items-center text-[12px] py-1">
                            <span className="text-neutral-500">License Hash</span>

                            <div className="flex items-center gap-2">
                                <span
                                    className="font-mono text-[11px] text-neutral-300 cursor-pointer"
                                    onClick={() => navigator.clipboard.writeText(env.hash)}
                                >
                                    {env.hash}
                                </span>

                                <button
                                    onClick={async () => {

                                        if (!confirm("Regenerate License Hash? This will disable all running Expert Advisors.")) {
                                            return
                                        }

                                        const res = await fetch("/api/regenerate-hash", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ email: env.email })
                                        })

                                        const data = await res.json()

                                        if (data.hash) {

                                            localStorage.setItem("hash", data.hash)

                                            location.reload()
                                        }

                                    }}
                                    className="text-[9px] px-2 py-1 rounded bg-neutral-800 border border-neutral-700 hover:bg-neutral-700"
                                >
                                    REGEN
                                </button>
                            </div>
                        </div>
                    )}

                    <Row label="Current Plan" value={(status || "Live").toUpperCase()} highlight={isLivePlus ? "green" : "blue"} />
                    <Row label="Status" value={isAccountActive ? "● ACTIVE" : "○ EXPIRED"} highlight={isAccountActive ? "green" : "red"} />

                    {deviceId && <Row label="Hardware ID" value={deviceId} mono truncate />}
                </Section>

                {/* RESTORED: LIVE+ ACCESS STATUS CARD */}
                {isLivePlus && (
                    <div className="px-6 pt-2">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-emerald-400 font-bold tracking-widest text-[10px]">
                                    LIVE+ ACCESS GRANTED
                                </span>
                                <span className="px-2 py-0.5 bg-emerald-500 text-black text-[9px] font-black rounded-full">
                                    PRO
                                </span>
                            </div>

                            {accessMeta?.expiry && (
                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-emerald-500/10">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-neutral-500 uppercase">Renews on</span>
                                        <span className="font-mono text-xs">
                                            {new Date(accessMeta.expiry).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-neutral-500 uppercase">Time Remaining</span>
                                        <span className={`font-mono text-xs ${daysLeft && daysLeft <= 3 ? "text-red-400" : "text-emerald-400"
                                            }`}>
                                            {daysLeft} Days
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* SUBSCRIPTION - ACTIVE BOX AT BOTTOM */}
                <Section title={isLivePlus ? "Extend Subscription" : "Premium Upgrade"}>
                    <div className="flex gap-2">
                        {PLANS.map(plan => {
                            const isCurrentPlan = isLivePlus && activeMonths === plan.months
                            return (
                                <button
                                    key={plan.months}
                                    onClick={() => handleUpgrade(plan)}
                                    className={`relative flex-1 pt-2 pb-4 rounded-lg border text-center transition-all active:scale-95 ${plan.highlight
                                        ? "bg-sky-600 border-sky-400 shadow-lg shadow-sky-900/20"
                                        : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
                                        }`}
                                >
                                    <div className="text-[10px] font-bold opacity-80">{plan.label}</div>
                                    <div className="text-xs font-black">{plan.price}</div>

                                    {isCurrentPlan && (
                                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[7px] px-1.5 py-[1px] bg-emerald-500 text-black rounded font-black tracking-tighter shadow-md">
                                            ACTIVE
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </Section>

                {/* EXPERT ADVISOR - CENTERED CONTENT */}
                <Section title="Expert Advisor (Coming Soon...)">
                    <div className="flex gap-2 items-stretch h-[48px]">
                        {/* Left Button: Download EA */}
                        <button
                            onClick={() => setShowEASetup(true)}
                            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 flex flex-col items-center justify-center active:scale-95 transition-transform"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 mb-0.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="3" y2="15" />
                            </svg>
                            <div className="text-[8px] leading-none font-bold text-neutral-400 tracking-tighter">
                                iHEDZ MT5 EA
                            </div>
                        </button>

                        {/* Middle Box: Banner Image */}
                        <div className="flex-1 rounded-lg border border-sky-500/30 bg-sky-950/20 relative overflow-hidden">
                            <img
                                src="/mt5ea.png"
                                className="absolute inset-0 w-full h-full object-cover"
                                alt="iHEDZ MT5 EA"
                            />
                        </div>

                        {/* Right Button: My EA */}
                        <button
                            onClick={() => {
                                setView("hedz")
                                closeMenu()
                            }}
                            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 flex flex-col items-center justify-center active:scale-95 transition-transform"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400 mb-0.5">
                                <rect width="20" height="14" x="2" y="3" rx="2" /><line x1="12" x2="12" y1="17" y2="21" /><line x1="8" x2="16" y1="21" y2="21" />
                            </svg>
                            <div className="text-[8px] leading-none font-bold text-neutral-400 uppercase tracking-tighter">
                                MY HEDZ
                            </div>
                        </button>
                    </div>
                </Section>

                {/* APP DOWNLOAD - FULL COLOR & NO HIGHLIGHTING */}
                {!env.isAndroid && (
                    <Section title="Download App (Coming Soon...)">
                        <div className="flex gap-2 items-stretch h-[48px]">
                            {/* Apple Store Button */}
                            <button
                                onClick={() => window.open("YOUR_APPLE_STORE_URL")}
                                className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 relative overflow-hidden active:scale-95 transition-transform"
                            >
                                <img src="/apple.png" className="absolute inset-0 w-full h-full object-cover" alt="iOS" />
                            </button>

                            {/* Google Play Store Button */}
                            <button
                                onClick={() => window.open(PLAYSTORE_URL)}
                                className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 relative overflow-hidden active:scale-95 transition-transform"
                            >
                                <img src="/playstore.png" className="absolute inset-0 w-full h-full object-cover" alt="Android" />
                            </button>

                            {/* Web/Cloud Button */}
                            <button
                                onClick={() => window.open("YOUR_WEB_URL")}
                                className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 relative overflow-hidden active:scale-95 transition-transform"
                            >
                                <img src="/web.png" className="absolute inset-0 w-full h-full object-cover" alt="Web" />
                            </button>
                        </div>
                    </Section>
                )}

                {/* SYSTEM */}
                <Section title="System Status">
                    <Row label="Version" value={version} mono />
                    <Row label="Platform" value={env.isAndroid ? "Native App" : env.isTelegram ? "Telegram" : "Cloud Web"} />
                    <Row label="Latency" value="~124ms" highlight="green" />
                    <Row label="Data Sync" value="Live" highlight="green" />
                </Section>

                <div className="px-6 py-0 mt-4">
                    <button onClick={onLogout} className="w-full py-3 rounded-lg border border-red-900/30 text-red-500 text-xs font-bold active:scale-95 transition-transform">
                        TERMINATE SESSION
                    </button>
                    <div className="mt-4 pb-4 text-center text-[8px] text-neutral-700 font-bold tracking-[0.3em] uppercase">
                        FXHEDZ © 2026
                    </div>
                </div>
            </div>

            {/* EA OVERLAY */}
            {showEASetup && (
                <div className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col">
                    <div className="flex justify-between items-center px-4 py-4 border-b border-neutral-800">
                        <div className="text-[11px] font-bold text-neutral-400 tracking-wide">MT5 INTEGRATION GUIDE</div>
                        <button onClick={() => setShowEASetup(false)} className="h-8 w-8 flex items-center justify-center rounded-full bg-neutral-800">✕</button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 text-[13px]">
                        <Step number={1} title="Download Resources" img="/ea/step1.png">
                            <li>Download iHEDZ_Connector.ex5</li>
                            <li>Do not rename the file</li>
                        </Step>
                        <Step number={2} title="Open Data Folder" img="/ea/step2.png">
                            <li>MT5 → File → Open Data Folder</li>
                            <li>MQL5 / Experts</li>
                        </Step>
                        <Step number={3} title="Install EA" img="/ea/step3.png">
                            <li>Copy file into Experts and restart</li>
                        </Step>
                        <Step number={3} title="Allow Webrequest" img="/ea/step3.png">
                            <li>Tools → Options → Expert Advisors</li>
                            <li>Allow WebRequest for listed URL</li>
                            <li>Add:</li>
                            <li>https://script.google.com</li>
                        </Step>
                        <Step number={3} title="Input License Hash" img="/ea/step3.png">
                            <li>Please enter your License Hash in EA properties Window</li>
                        </Step>
                    </div>
                    <div className="border-t border-neutral-800 p-4 grid grid-cols-2 gap-3">
                        <button onClick={() => setView("hedz")} className="py-3 bg-neutral-800 rounded-lg text-sm font-bold">MY EA</button>
                        <a href={MT5_EA_URL} download className="py-3 text-center bg-emerald-600 rounded-lg text-sm font-bold">DOWNLOAD EA</a>
                    </div>
                </div>
            )}
        </>
    )
}

function Section({ title, children }: any) {
    return (
        <div className="px-6 py-5 border-b border-neutral-800">
            <div className="text-[10px] text-neutral-500 font-bold tracking-widest mb-3 uppercase">
                {title}
            </div>
            {children}
        </div>
    )
}

function Row({ label, value, highlight, mono }: any) {
    const color = highlight === "green" ? "text-emerald-400" : highlight === "red" ? "text-red-400" : highlight === "blue" ? "text-sky-400" : "text-neutral-300"
    return (
        <div className="flex justify-between text-[12px] py-1">
            <span className="text-neutral-500">{label}</span>
            <span
                className={`${mono ? "font-mono text-[11px]" : "font-semibold"} ${color} cursor-pointer`}
                onClick={() => {
                    if (value && value !== "—") {
                        navigator.clipboard.writeText(value)
                    }
                }}
            >
                {value}
            </span>
        </div>
    )
}

function Step({ number, title, img, children }: any) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="h-6 w-6 flex items-center justify-center rounded-full bg-sky-600 text-black text-xs font-black">{number}</span>
                {title}
            </div>
            <img src={img} className="rounded-lg border border-neutral-800" />
            <ul className="text-neutral-400 text-[12px] pl-5 list-disc">{children}</ul>
        </div>
    )
}
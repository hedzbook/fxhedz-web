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
}

const PLANS = [
    { label: "1 Month", price: "$9.99", months: 1, razorpay: "https://rzp.io/rzp/ssReKHK", sku: "fxhedz_monthly" },
    { label: "3 Months", price: "$26.99", months: 3, razorpay: "https://rzp.io/rzp/Npm6HPL", sku: "fxhedz_quarterly", highlight: true },
    { label: "6 Months", price: "$47.99", months: 6, razorpay: "https://rzp.io/rzp/YWH4Fyxx", sku: "fxhedz_semiannual" }
]

const PLAYSTORE_URL = "https://play.google.com/store/apps/details?id=com.fxhedz.live"
const MT5_EA_URL = "/api/ea-download"

export default function ControlPanel({ accessMeta, deviceId, version, onLogout }: Props) {
    const [showEASetup, setShowEASetup] = useState(false)
    const [showMyEA, setShowMyEA] = useState(false)

    const env = useMemo(() => {
        if (typeof window === "undefined")
            return { isAndroid: false, isTelegram: false, email: null }

        return {
            isAndroid: !!(window as any).ReactNativeWebView,
            isTelegram: Boolean((window as any)?.Telegram?.WebApp?.initData),
            email: (window as any).__NATIVE_EMAIL__ || localStorage.getItem("email") || "—"
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
        if (daysLeft >= 14 && daysLeft <= 31) return 1
        if (daysLeft <= 93) return 3
        return 6
    }, [daysLeft])

    const handleUpgrade = (plan: typeof PLANS[0]) => {
        if (env.isAndroid) {
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

    const status = accessMeta?.status?.toLowerCase()
    const isAccountActive = Boolean(accessMeta?.active)
    const isLivePlus = status === "live+"

    // Redirect to "My EA" Dashboard view
    if (showMyEA) {
        return <MyEADashboard onBack={() => setShowMyEA(false)} />
    }

    return (
        <>
            <div className="relative w-full h-full flex flex-col bg-[#0f0f0f] text-neutral-200 text-sm overflow-y-auto controlpanel-scroll pb-24">
                
                <Section title="Account Profile">
                    <Row label="User" value={env.email} />
                    <Row label="Current Plan" value={(status || "Live").toUpperCase()} highlight={isLivePlus ? "green" : "blue"} />
                    <Row label="Status" value={isAccountActive ? "● ACTIVE" : "○ EXPIRED"} highlight={isAccountActive ? "green" : "red"} />
                    {deviceId && <Row label="Hardware ID" value={deviceId} mono truncate />}
                </Section>

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
                                        <span className={`font-mono text-xs ${
                                            daysLeft && daysLeft <= 3 ? "text-red-400" : "text-emerald-400"
                                        }`}>
                                            {daysLeft} Days
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <Section title={isLivePlus ? "Extend Subscription" : "Premium Upgrade"}>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            {PLANS.map(plan => {
                                const isCurrentPlan = isLivePlus && activeMonths === plan.months
                                return (
                                    <button
                                        key={plan.months}
                                        onClick={() => handleUpgrade(plan)}
                                        className={`relative flex-1 p-3 rounded-lg flex flex-col items-center justify-center transition-all active:scale-95 border ${
                                            plan.highlight
                                                ? "bg-sky-600 border-sky-400 shadow-lg shadow-sky-900/20"
                                                : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
                                        }`}
                                    >
                                        {isCurrentPlan && (
                                            <span className="absolute -top-2 bg-emerald-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded">
                                                ACTIVE
                                            </span>
                                        )}
                                        <span className="font-bold text-xs">{plan.label}</span>
                                        <span className="text-lg font-black tracking-tight">{plan.price}</span>
                                    </button>
                                )
                            })}
                        </div>
                        <p className="text-[11px] text-neutral-500 text-center leading-tight">
                            {isLivePlus
                                ? "Select a plan above to extend your subscription."
                                : "Unlock real-time institutional signals and automated MT5 execution."}
                        </p>
                    </div>
                </Section>

                {/* THIN FLOATING ECOSYSTEM SECTION */}
                <Section title="Ecosystem Tools">
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-3">
                        <div className="flex items-center gap-3 mb-3 px-1">
                            <img src="/mt5ea.png" className="h-8 w-8 object-contain" />
                            <div className="flex-1">
                                <div className="text-xs font-bold text-neutral-200">iHEDZ Connector</div>
                                <div className="text-[10px] text-neutral-500">v1.0.4 • MetaTrader 5 Bridge</div>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setShowMyEA(true)}
                                className="flex-1 py-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-[11px] font-bold hover:bg-neutral-700 transition-colors"
                            >
                                MY EA
                            </button>
                            <button 
                                onClick={() => setShowEASetup(true)}
                                className="flex-1 py-2.5 rounded-lg bg-sky-600 text-white text-[11px] font-bold hover:bg-sky-500 transition-colors shadow-lg shadow-sky-900/20"
                            >
                                DOWNLOAD EA
                            </button>
                        </div>
                    </div>
                </Section>

                {!env.isAndroid && (
                    <Section title="Mobile Alerts">
                        <a
                            href={PLAYSTORE_URL}
                            target="_blank"
                            className="flex justify-center p-2 bg-black border border-neutral-800 rounded-xl"
                        >
                            <img src="/playstore.png" className="h-10" />
                        </a>
                    </Section>
                )}

                <Section title="System Status">
                    <Row label="Version" value={version} mono />
                    <Row label="Platform" value={env.isAndroid ? "Native App" : env.isTelegram ? "Telegram" : "Cloud Web"} />
                    <Row label="Latency" value="~124ms" highlight="green" />
                    <Row label="Data Sync" value="Live" highlight="green" />
                </Section>

                <div className="p-6 mt-auto">
                    <button
                        onClick={onLogout}
                        className="w-full py-3 rounded-lg border border-red-900/30 text-red-500 text-xs font-bold"
                    >
                        TERMINATE SESSION
                    </button>
                    <div className="mt-4 text-center text-[10px] text-neutral-600 uppercase tracking-widest">
                        © {new Date().getFullYear()} FXHEDZ
                    </div>
                </div>
            </div>

            {/* DOWNLOAD MODAL */}
            {showEASetup && (
                <div className="fixed inset-0 z-[110] bg-[#0a0a0a] flex flex-col">
                    <div className="flex justify-between items-center px-6 py-5 border-b border-neutral-800">
                        <h2 className="text-xs font-black uppercase tracking-tighter text-neutral-400">
                            MT5 Integration Guide
                        </h2>
                        <button
                            onClick={() => setShowEASetup(false)}
                            className="h-8 w-8 flex items-center justify-center rounded-full bg-neutral-800"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-10">
                        <Step number={1} title="Download Resources" img="/ea/step1.png">
                            <li>Download iHEDZ_Connector.ex5</li>
                            <li>Do not rename the file</li>
                        </Step>
                        <Step number={2} title="Open MT5 Data Folder" img="/ea/step2.png">
                            <li>Open MT5 → File → Open Data Folder</li>
                            <li>Navigate to MQL5 / Experts</li>
                        </Step>
                        <Step number={3} title="Install EA" img="/ea/step3.png">
                            <li>Copy file into Experts folder</li>
                            <li>Restart MetaTrader 5</li>
                        </Step>
                    </div>

                    <div className="p-6 border-t border-neutral-800">
                        {isLivePlus ? (
                            <a
                                href={MT5_EA_URL}
                                download
                                className="block w-full text-center bg-emerald-600 p-4 rounded-xl font-bold"
                            >
                                DOWNLOAD EXPERT ADVISOR
                            </a>
                        ) : (
                            <button
                                onClick={() => setShowEASetup(false)}
                                className="w-full bg-sky-600 p-4 rounded-xl font-bold"
                            >
                                UPGRADE TO LIVE+ TO DOWNLOAD
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

// Components
function Section({ title, children }: any) {
    return (
        <div className="px-6 py-6 border-b border-neutral-800/50">
            <h3 className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-4">
                {title}
            </h3>
            {children}
        </div>
    )
}

function Row({ label, value, highlight, mono, truncate }: any) {
    const color =
        highlight === "green"
            ? "text-emerald-400"
            : highlight === "red"
            ? "text-red-400"
            : highlight === "blue"
            ? "text-sky-400"
            : "text-neutral-300"

    return (
        <div className="flex justify-between py-1.5 gap-4">
            <span className="text-neutral-500">{label}</span>
            <span className={`${mono ? "font-mono text-[10px]" : "font-semibold"} ${color} ${
                truncate ? "truncate max-w-[180px]" : ""
            }`}>
                {value}
            </span>
        </div>
    )
}

function Step({ number, title, img, children }: any) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-sky-600 text-black text-[10px] font-black">{number}</span>
                <h4 className="font-bold text-neutral-100">{title}</h4>
            </div>
            <div className="aspect-video bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden flex items-center justify-center">
                 <img src={img} className="object-cover w-full h-full opacity-50" alt={title} />
            </div>
            <ul className="list-disc pl-6 text-neutral-400 text-sm space-y-1">
                {children}
            </ul>
        </div>
    )
}

// Stats/Analytics Page Placeholder
function MyEADashboard({ onBack }: { onBack: () => void }) {
    return (
        <div className="fixed inset-0 z-[120] bg-[#0f0f0f] flex flex-col">
            <div className="flex items-center gap-4 px-6 py-5 border-b border-neutral-800">
                <button onClick={onBack} className="text-xl">←</button>
                <h2 className="text-sm font-bold uppercase tracking-tight">EA Statistics & Performance</h2>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl opacity-20">📊</span>
                </div>
                <h3 className="font-bold text-neutral-300">No Terminal Linked</h3>
                <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                    Link your MetaTrader 5 terminal using the iHEDZ Connector to view real-time equity curves, drawdown, and win rates.
                </p>
            </div>
        </div>
    )
}
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

    // Environment Detection
    const env = useMemo(() => {
        if (typeof window === "undefined") return { isAndroid: false, isTelegram: false, email: null }
        return {
            isAndroid: !!(window as any).ReactNativeWebView,
            isTelegram: Boolean((window as any)?.Telegram?.WebApp?.initData),
            email: (window as any).__NATIVE_EMAIL__ || localStorage.getItem("email") || "—"
        }
    }, [])

    const daysLeft = useMemo(() => {
        if (!accessMeta?.expiry) return null
        const diff = new Date(accessMeta.expiry).getTime() - new Date().getTime()
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }, [accessMeta])

    const handleUpgrade = (plan: typeof PLANS[0]) => {
        if (env.isAndroid) {
            (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: "PLAY_BILLING_REQUEST", sku: plan.sku }))
            return
        }
        window.open(plan.razorpay, "_blank")
    }

    const status = accessMeta?.status?.toLowerCase()
    const isAccountActive = Boolean(accessMeta?.active)
    const isLivePlus = status === "live+"

    return (
        <div className="relative w-full flex flex-col bg-[#0f0f0f] text-neutral-200 text-sm overflow-y-auto max-h-screen controlpanel-scroll selection:bg-sky-500/30">
            
            {/* Header & Account */}
            <Section title="Account Profile">
                <Row label="User" value={env.email} />
                <Row label="Current Plan" value={(status || "Basic").toUpperCase()} highlight={isLivePlus ? "green" : "blue"} />
                <Row label="Status" value={isAccountActive ? "● ACTIVE" : "○ EXPIRED"} highlight={isAccountActive ? "green" : "red"} />
                {deviceId && <Row label="Hardware ID" value={deviceId} mono />}
            </Section>

            {/* Subscription Section */}
            <Section title={isLivePlus ? "Subscription Details" : "Premium Upgrade"}>
                {!isLivePlus ? (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            {PLANS.map((plan) => (
                                <button
                                    key={plan.months}
                                    onClick={() => handleUpgrade(plan)}
                                    className={`flex-1 p-3 rounded-lg flex flex-col items-center justify-center transition-all active:scale-95 border ${
                                        plan.highlight 
                                            ? "bg-sky-600 border-sky-400 shadow-lg shadow-sky-900/20" 
                                            : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
                                    }`}
                                >
                                    <span className="font-bold text-xs">{plan.label}</span>
                                    <span className="text-lg font-black tracking-tight">{plan.price}</span>
                                </button>
                            ))}
                        </div>
                        <p className="text-[11px] text-neutral-500 text-center leading-tight">
                            Unlock real-time institutional signals and automated MT5 execution.
                        </p>
                    </div>
                ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-emerald-400 font-bold tracking-widest text-[10px]">LIVE+ ACCESS GRANTED</span>
                            <span className="px-2 py-0.5 bg-emerald-500 text-black text-[9px] font-black rounded-full">PRO</span>
                        </div>
                        {accessMeta?.expiry && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-neutral-500 uppercase">Renews on</span>
                                    <span className="font-mono text-xs">{new Date(accessMeta.expiry).toLocaleDateString()}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-neutral-500 uppercase">Time Remaining</span>
                                    <span className={`font-mono text-xs ${daysLeft && daysLeft <= 3 ? "text-red-400" : "text-emerald-400"}`}>
                                        {daysLeft} Days
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Section>

            {/* MT5 Integration */}
            <Section title="Ecosystem Tools">
                <button
                    onClick={() => setShowEASetup(true)}
                    className="group relative flex items-center gap-4 w-full p-4 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 rounded-xl transition-all overflow-hidden"
                >
                    <div className="h-12 w-12 bg-neutral-900 rounded-lg flex items-center justify-center border border-neutral-700">
                         <img src="/mt5ea.png" alt="EA" className="h-8 w-8 object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex-1 text-left">
                        <div className="font-bold text-neutral-100">iHEDZ Expert Advisor</div>
                        <div className="text-[11px] text-neutral-500">Bridge signals to MetaTrader 5</div>
                    </div>
                    <div className="text-neutral-600 group-hover:text-sky-400 transition-colors">→</div>
                </button>
            </Section>

            {/* Mobile App Section */}
            {!env.isAndroid && (
                <Section title="Mobile Alerts">
                    <a href={PLAYSTORE_URL} target="_blank" rel="noopener noreferrer" 
                       className="flex items-center justify-center p-2 bg-black border border-neutral-800 rounded-xl hover:border-neutral-600 transition-colors">
                        <img src="/playstore.png" alt="Google Play" className="h-10" />
                    </a>
                </Section>
            )}

            {/* Network & Meta */}
            <Section title="System Status">
                <div className="grid grid-cols-2 gap-y-2">
                    <Row label="Version" value={version} mono />
                    <Row label="Platform" value={env.isAndroid ? "Native App" : env.isTelegram ? "Telegram" : "Cloud Web"} />
                    <Row label="Latency" value="~124ms" highlight="green" />
                    <Row label="Data Sync" value="Live" highlight="green" />
                </div>
            </Section>

            {/* Support Links */}
            <Section title="Resources">
                <div className="grid grid-cols-2 gap-2">
                    <LinkBtn label="Technical Support" href="https://t.me/fxhedzbot" />
                    <LinkBtn label="Trading Community" href="https://t.me/fxhedzbot" />
                    <LinkBtn label="Risk Disclosure" href="/risk" />
                    <LinkBtn label="Terms of Service" href="/terms" />
                </div>
            </Section>

            <div className="p-6 mt-auto">
                <button onClick={onLogout} className="w-full py-3 rounded-lg border border-red-900/30 text-red-500 text-xs font-bold hover:bg-red-500/10 transition-colors">
                    TERMINATE SESSION
                </button>
                <div className="mt-4 text-center text-[10px] text-neutral-600 uppercase tracking-widest">
                    © {new Date().getFullYear()} FXHEDZ INFRASTRUCTURE
                </div>
            </div>

            {/* EA Setup Modal */}
            {showEASetup && (
                <div className="absolute inset-0 z-50 bg-[#0a0a0a] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex justify-between items-center px-6 py-5 border-b border-neutral-800">
                        <h2 className="text-xs font-black uppercase tracking-tighter text-neutral-400">MT5 Integration Guide</h2>
                        <button onClick={() => setShowEASetup(false)} className="h-8 w-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-24">
                        <Step number={1} title="Download Resources" img="/ea/step1.png">
                            <li>Obtain the <code className="text-sky-400">iHEDZ_Connector.ex5</code> file.</li>
                            <li>Ensure your file extension remains unaltered.</li>
                        </Step>
                        
                        <Step number={2} title="MetaTrader Directory" img="/ea/step1.png">
                            <li>Open MT5 &gt; File &gt; Open Data Folder.</li>
                            <li>Navigate to <code className="text-sky-400">MQL5 / Experts</code>.</li>
                        </Step>

                        <Step number={3} title="Configuration" img="/ea/step1.png">
                            <li>Drag the file into the Experts folder.</li>
                            <li>Enable "Allow WebRequest" in MT5 Options.</li>
                        </Step>
                    </div>

                    <div className="p-6 border-t border-neutral-800 bg-[#0a0a0a]/80 backdrop-blur-md sticky bottom-0">
                        {isLivePlus ? (
                            <a href={MT5_EA_URL} download className="block w-full text-center bg-emerald-600 hover:bg-emerald-500 p-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20">
                                DOWNLOAD EXPERT ADVISOR
                            </a>
                        ) : (
                            <button onClick={() => setShowEASetup(false)} className="w-full bg-sky-600 p-4 rounded-xl font-bold">
                                UPGRADE TO LIVE+ TO DOWNLOAD
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

/* Sub-Components */

function Section({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="px-6 py-6 border-b border-neutral-800/50 last:border-none">
            <h3 className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-4">{title}</h3>
            {children}
        </div>
    )
}

function Row({ label, value, highlight, mono }: any) {
    const colorClass = highlight === "green" ? "text-emerald-400" : highlight === "red" ? "text-red-400" : highlight === "blue" ? "text-sky-400" : "text-neutral-300";
    return (
        <div className="flex justify-between items-center py-1">
            <span className="text-neutral-500 font-medium">{label}</span>
            <span className={`${mono ? "font-mono text-[11px]" : "font-semibold"} ${colorClass}`}>
                {value}
            </span>
        </div>
    )
}

function LinkBtn({ label, href }: { label: string, href: string }) {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" 
           className="text-[11px] font-bold text-sky-500/80 hover:text-sky-400 py-2 px-3 bg-sky-500/5 rounded-md border border-sky-500/10 transition-colors text-center">
            {label}
        </a>
    )
}

function Step({ number, title, img, children }: any) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-sky-600 text-black text-[10px] font-black">{number}</span>
                <h4 className="font-bold text-neutral-100">{title}</h4>
            </div>
            <img src={img} className="w-full rounded-xl border border-neutral-800 shadow-2xl" alt={`Step ${number}`} />
            <ul className="list-none space-y-2 text-[12px] text-neutral-400 pl-2 border-l border-neutral-800 ml-3">
                {children}
            </ul>
        </div>
    )
}
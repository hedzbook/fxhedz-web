"use client"

import { useMemo, useState } from "react"
import { Monitor, Download, Bot } from "lucide-react"

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
        if (daysLeft <= 31) return 1
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

    return (
        <>
        {/* pb-0 used to remove bottom cushion entirely */}
        <div className="relative w-full h-full flex flex-col bg-[#0f0f0f] text-neutral-200 text-sm overflow-y-auto controlpanel-scroll pb-0">

            {/* ACCOUNT */}
            <Section title="Account Profile">
                <Row label="User" value={env.email} />
                <Row label="Current Plan" value={(status || "Live").toUpperCase()} highlight={isLivePlus ? "green" : "blue"} />
                <Row label="Status" value={isAccountActive ? "● ACTIVE" : "○ EXPIRED"} highlight={isAccountActive ? "green" : "red"} />
                {deviceId && <Row label="Hardware ID" value={deviceId} mono truncate />}
            </Section>

            {/* SUBSCRIPTION */}
            <Section title={isLivePlus ? "Extend Subscription" : "Premium Upgrade"}>

                <div className="flex gap-2">

                    {PLANS.map(plan => {

                        const isCurrentPlan =
                            isLivePlus && activeMonths === plan.months

                        return (
                            <button
                                key={plan.months}
                                onClick={() => handleUpgrade(plan)}
                                className={`relative flex-1 py-3 rounded-lg border text-center ${
                                    plan.highlight
                                        ? "bg-sky-600 border-sky-400"
                                        : "bg-neutral-800 border-neutral-700"
                                }`}
                            >

                                {isCurrentPlan && (
                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] px-1.5 py-[1px] bg-emerald-500 text-black rounded">
                                        ACTIVE
                                    </span>
                                )}

                                <div className="text-xs font-bold">{plan.label}</div>
                                <div className="text-sm font-black">{plan.price}</div>

                            </button>
                        )
                    })}

                </div>

            </Section>


            {/* EXPERT ADVISOR */}
            <Section title="Expert Advisor">

                <SciFiEA>
                    <button
                        onClick={() => window.location.href="/ea"}
                        className="w-[100px] h-[100px] rounded-lg border-2 border-dashed border-sky-400/20 flex flex-col items-center justify-center p-2 text-center text-[10px] font-semibold text-sky-400 group relative overflow-hidden active:scale-95 transition-transform"
                    >
                        <div className="absolute inset-0 bg-sky-950/20 group-hover:bg-sky-950/30 transition-colors" />
                        <Monitor size={24} className="mb-1.5 z-10" strokeWidth={1.5}/>
                        <div className="z-10 mt-1">MY EA</div>
                    </button>

                    <img
                        src="/mt5ea.png"
                        className="w-24 h-24 object-contain shadow-2xl z-10"
                    />

                    <a
                        href={MT5_EA_URL}
                        download
                        className="w-[100px] h-[100px] rounded-lg border-2 border-dashed border-emerald-400/20 flex flex-col items-center justify-center p-2 text-center text-[10px] font-semibold text-emerald-400 group relative overflow-hidden active:scale-95 transition-transform"
                    >
                        <div className="absolute inset-0 bg-emerald-950/20 group-hover:bg-emerald-950/30 transition-colors" />
                        <Download size={24} className="mb-1.5 z-10" strokeWidth={1.5}/>
                        <div className="z-10 mt-1">Download<br/>EA</div>
                    </a>
                </SciFiEA>

            </Section>


            {/* ANDROID APP */}
            {!env.isAndroid && (

            <Section title="Android App">

                <ToolCard
                    img="/playstore.png"
                    text="Download Android App"
                    onClick={() => window.open(PLAYSTORE_URL)}
                />

            </Section>

            )}


            {/* SYSTEM */}
            <Section title="System Status">

                <Row label="Version" value={version} mono />
                <Row label="Platform" value={env.isAndroid ? "Android" : env.isTelegram ? "Telegram" : "Web"} />
                <Row label="Latency" value="~124ms" highlight="green" />
                <Row label="Sync" value="Live" highlight="green" />

            </Section>

            {/* Gap reduced to zero between button and bottom bar */}
            <div className="px-6 py-0 mt-4">

                <button
                    onClick={onLogout}
                    className="w-full py-3 rounded-lg border border-red-900/30 text-red-500 text-xs font-bold active:scale-95 transition-transform"
                >
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

                <div className="text-[11px] font-bold text-neutral-400 tracking-wide">
                    MT5 INTEGRATION GUIDE
                </div>

                <button
                    onClick={() => setShowEASetup(false)}
                    className="h-8 w-8 flex items-center justify-center rounded-full bg-neutral-800"
                >
                    ✕
                </button>

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
                  <li>Copy file into Experts</li>
                  <li>Restart MetaTrader</li>
                </Step>

            </div>


            <div className="border-t border-neutral-800 p-4 grid grid-cols-2 gap-3">

                <button
                    onClick={() => window.location.href="/ea"}
                    className="py-3 bg-neutral-800 rounded-lg text-sm font-bold"
                >
                    MY EA
                </button>

                <a
                    href={MT5_EA_URL}
                    download
                    className="py-3 text-center bg-emerald-600 rounded-lg text-sm font-bold"
                >
                    DOWNLOAD EA
                </a>

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


function ToolCard({ img, text, onClick }: any) {

    return (
        <button
            onClick={onClick}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden"
        >

            <img
                src={img}
                className="w-full object-contain"
            />

            <div className="text-[11px] text-neutral-400 text-center py-2">
                {text}
            </div>

        </button>
    )
}

function Row({ label, value, highlight, mono }: any) {

    const color =
        highlight === "green"
            ? "text-emerald-400"
            : highlight === "red"
            ? "text-red-400"
            : highlight === "blue"
            ? "text-sky-400"
            : "text-neutral-300"

    return (
        <div className="flex justify-between text-[12px] py-1">

            <span className="text-neutral-500">{label}</span>

            <span className={`${mono ? "font-mono text-[11px]" : "font-semibold"} ${color}`}>
                {value}
            </span>

        </div>
    )
}


function Step({ number, title, img, children }: any) {

    return (
        <div className="space-y-2">

            <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="h-6 w-6 flex items-center justify-center rounded-full bg-sky-600 text-black text-xs font-black">
                    {number}
                </span>
                {title}
            </div>

            <img src={img} className="rounded-lg border border-neutral-800"/>

            <ul className="text-neutral-400 text-[12px] pl-5 list-disc">
                {children}
            </ul>

        </div>
    )
}

function SciFiEA({children}: any) {
    return (
        <div className="relative p-2.5 rounded-xl border-2 border-dashed border-sky-400/30 overflow-hidden flex flex-wrap justify-center items-center gap-3 backdrop-blur-sm shadow-inner group-scope">
            <div className="absolute inset-0 bg-sky-950/20" />
            <div className="absolute inset-0 bg-neutral-950 rounded-lg blur-xl opacity-80" />
            <div className="absolute -inset-2.5 bg-sky-900/10 blur opacity-40 group-scope-hover:opacity-60 group-scope-hover:scale-105 transition-all duration-500" />
            <Bot size={110} className="absolute -bottom-6 -right-6 text-sky-800/10 rotate-12 z-0 opacity-40 group-scope-hover:opacity-60 transition-opacity" strokeWidth={1}/>
            {children}
        </div>
    )
}
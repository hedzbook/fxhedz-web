"use client"

import GlobalLightChart from "./GlobalLightChart"
import { useState, useEffect, useMemo } from "react"
import {
    ResponsiveContainer,
    LineChart,
    Line,
    Tooltip
} from "recharts"

type Props = {
    pair: string
    signal: any
    data: any
    onClose: () => void
    isGuest?: boolean
    email?: string
    appInstruments: string[]
    setAppInstruments: React.Dispatch<React.SetStateAction<string[]>>
}

const SYMBOL_DIGITS: Record<string, number> = {
    ETHUSD: 2,
    USDCHF: 5,
    USDJPY: 3,
    XAUUSD: 3,
    EURUSD: 5,
    GBPUSD: 5,
    AUDUSD: 5,
    USOIL: 3,
    BTCUSD: 2
}

function fmtPrice(pair: string, v: any) {
    if (v === null || v === undefined || v === "--") return "--"
    return Number(v).toFixed(SYMBOL_DIGITS[pair] ?? 2)
}

function fmtLots(v: any) {
    if (v === null || v === undefined) return "--"
    return Number(v).toFixed(2)
}

function fmtPnl(v: any) {
    if (v === null || v === undefined) return "--"
    return Number(v).toFixed(2)
}

export default function PairDetail({
    pair,
    signal,
    data,
    onClose,
    isGuest = false,
    email,
    appInstruments,
    setAppInstruments
}: Props) {

    const [tab, setTab] = useState<"market" | "updates" | "history" | "performance">("market")
    const [preview, setPreview] = useState<any>(null)
    const [saving, setSaving] = useState(false)
    const showConfidence = true
    const showReasonBlocks = true
    const showDecisionBlocks = true

    useEffect(() => {
        if (preview) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "auto"
        }
    }, [preview])
    useEffect(() => {
        if (!preview) return

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setPreview(null)
            }
        }

        window.addEventListener("keydown", handleEsc)

        return () => {
            window.removeEventListener("keydown", handleEsc)
        }
    }, [preview])
    const toggleNotification = async () => {

        if (!pair || saving) return

        setSaving(true)

        try {

            const res = await fetch("/api/toggle-notification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pair,
                    action: appInstruments.includes(pair) ? "remove" : "add"
                })
            })

            const json = await res.json()

            if (json?.instruments) {
                setAppInstruments(json.instruments)
            }

        } finally {
            setSaving(false)
        }
    }
    function computeConfidence(signal: any) {
        if (!signal) return 0

        // Placeholder institutional weighting
        // You can replace these later with MT5-derived values

        const technical = signal?.technicalScore ?? 0.4   // 0 - 1
        const macro = signal?.macroScore ?? 0.2
        const sentiment = signal?.sentimentScore ?? 0.3
        const volatility = signal?.volatilityScore ?? 0.1

        const weighted =
            technical * 0.4 +
            macro * 0.2 +
            sentiment * 0.2 +
            volatility * 0.2

        // Convert 0 - 1 scale to -100 - +100
        const normalized = (weighted - 0.5) * 200

        return Math.max(-100, Math.min(100, normalized))
    }
    const direction = signal?.direction

    const atValue =
        direction === "EXIT"
            ? signal?.price ?? "--"
            : signal?.entry ?? "--"

    const tpValue =
        direction === "HEDGED" || direction === "EXIT"
            ? "--"
            : signal?.tp ?? "--"

    const slValue =
        direction === "HEDGED" || direction === "EXIT"
            ? "--"
            : signal?.sl ?? "--"

    const curveData = useMemo(() => {

        if (!data?.history) return []

        const trades = [...data.history].reverse()

        let equity = 0
        let peak = 0

        return trades.map((t: any, i: number) => {

            equity = Number((equity + Number(t.pnl || 0)).toFixed(4))

            if (equity > peak) peak = equity

            const drawdown = equity - peak

            return {
                index: i,
                equity,
                drawdown
            }

        })

    }, [data?.history])

    const buyCount =
        data?.orders?.filter((o: any) => o.direction === "BUY").length ?? 0

    const sellCount =
        data?.orders?.filter((o: any) => o.direction === "SELL").length ?? 0

    const totalLots =
        data?.orders?.reduce((s: any, o: any) => s + Number(o.lots || 0), 0) ?? 0

    const totalPnl =
        data?.orders?.reduce((s: any, o: any) => s + Number(o.profit || 0), 0) ?? 0

    return (
        <div className="flex flex-col h-full bg-black min-h-0">

            {/* HEADER */}
            <div className="shrink-0 flex items-center justify-between px-3 py-[clamp(6px,1vh,10px)] border-b border-neutral-800">

                <div className="flex items-center gap-3">

                    <div className="font-semibold text-[clamp(11px,6.66px+1.354vw,24px)] leading-none">
                        {pair}
                    </div>

                    {!isGuest && (
                        <button
                            onClick={toggleNotification}
                            disabled={saving}
                            className={`
      w-[1.1em]
      h-[1.1em]
      flex items-center justify-center
      rounded-[2px]
      border
      transition-colors duration-150
      ${appInstruments.includes(pair)
                                    ? "border-sky-500/40 text-sky-400"
                                    : "border-neutral-700 text-neutral-600"
                                }
    `}
                        >
                            <svg
                                className="w-[70%] h-[70%]"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                                <path d="M13.73 21a2 2 0 01-3.46 0" />
                            </svg>
                        </button>
                    )}

                </div>

                <button
                    onClick={onClose}
                    className="text-[clamp(9px,5.5px+1.0937vw,19.5px)] text-neutral-400 hover:text-white leading-none"
                >
                    CLOSE
                </button>
            </div>

            {/* CHART (FIXED HEIGHT) */}
            <div className="shrink-0 h-[clamp(180px,35vh,380px)]">
                <div
                    id={`chart_mount_${pair}`}
                    className="w-full h-full"
                />
                <GlobalLightChart
                    mountId={`chart_mount_${pair}`}
                    signal={isGuest ? data : signal}
                    disableOverlays={isGuest}
                />
            </div>

            {/* TABS (FIXED) */}
            <div className="shrink-0 flex border-b border-neutral-800 text-[clamp(9px,5.5px+1.0937vw,19.5px)]">
                <Tab label="Market" active={tab === "market"} onClick={() => setTab("market")} />
                <Tab label="Updates" active={tab === "updates"} onClick={() => setTab("updates")} />
                <Tab label="History" active={tab === "history"} onClick={() => setTab("history")} />
                <Tab label="Statistics" active={tab === "performance"} onClick={() => setTab("performance")} />
            </div>

            {/* CONTENT AREA â€” ONLY THIS SCROLLS */}
            <div className="flex-1 flex flex-col min-h-0">

                {tab === "market" && (
                    <div className="flex flex-col flex-1 min-h-0 gap-[clamp(8px,1vh,16px)] p-[clamp(8px,1.2vw,16px)]">

                        {showConfidence && (
                            <ConfidenceBar value={computeConfidence(signal)} />
                        )}
                        {/* ===========================
    SIGNAL + REASON PANEL
=========================== */}
                        <div className="space-y-[clamp(8px,1vh,16px)]">

                            {/* REASON ROW (4 Blocks) */}
                            {showReasonBlocks && (
                                <div className="grid grid-cols-4 gap-[clamp(6px,1vw,12px)]">

                                    <MiniBlock
                                        label="Technical"
                                        value="Bullish"
                                        highlight="text-green-400"
                                    />

                                    <MiniBlock
                                        label="Macro"
                                        value="Neutral"
                                        highlight="text-neutral-400"
                                    />

                                    <MiniBlock
                                        label="Sentiment"
                                        value="Bearish"
                                        highlight="text-red-400"
                                    />

                                    <MiniBlock
                                        label="Volatility"
                                        value="Expanding"
                                        highlight="text-yellow-400"
                                    />

                                </div>
                            )}

                            {/* SIGNAL ROW (4 Blocks) */}
                            {showDecisionBlocks && (
                                <div className="grid grid-cols-4 gap-[clamp(6px,1vw,12px)]">

                                    <MiniBlock
                                        label="Decision"
                                        value={direction || "--"}
                                        highlight={
                                            direction === "BUY"
                                                ? "text-green-400"
                                                : direction === "SELL"
                                                    ? "text-red-400"
                                                    : direction === "HEDGED"
                                                        ? "text-sky-400"
                                                        : ""
                                        }
                                    />

                                    <MiniBlock
                                        label="At"
                                        value={fmtPrice(pair, atValue)}
                                    />

                                    <MiniBlock
                                        label="Take Profit"
                                        value={fmtPrice(pair, tpValue)}
                                    />

                                    <MiniBlock
                                        label="Hedz Stop"
                                        value={fmtPrice(pair, slValue)}
                                    />

                                </div>
                            )}

                        </div>

                        <div className="flex flex-col flex-1 min-h-0 bg-neutral-900 border border-neutral-800 p-[clamp(8px,1vw,14px)] text-[clamp(9px,5.5px+1.0937vw,19.5px)]">

                            {/* HEADER */}
                            <div className="grid grid-cols-4 text-neutral-400 mb-2 font-mono tabular-nums">

                                <div className="px-2">
                                    <span className="text-green-400">{buyCount}B</span>
                                    <span className="text-neutral-500"> / </span>
                                    <span className="text-red-400">{sellCount}S</span>
                                </div>

                                <div className="px-2">
                                    Open
                                </div>

                                <div className="px-2 text-right">
                                    Lots {fmtLots(totalLots)}
                                </div>

                                <div
                                    className={`px-2 text-right ${totalPnl > 0
                                            ? "text-green-400"
                                            : totalPnl < 0
                                                ? "text-red-400"
                                                : "text-neutral-400"
                                        }`}
                                >
                                    $ {fmtPnl(totalPnl)}
                                </div>

                            </div>

                            {/* ROWS */}
                            <div className="flex-1 overflow-y-auto">

                                {data?.orders?.length ? data.orders.map((o: any, i: number) => (

                                    <div
                                        key={i}
                                        className="grid grid-cols-4 border-t border-neutral-800 py-1 font-mono tabular-nums"
                                    >

                                        <div className={`px-2 ${o.direction === "BUY" ? "text-green-400" : "text-red-400"}`}>
                                            {o.direction}
                                        </div>

                                        <div className="px-2 text-neutral-300">
                                            {fmtPrice(pair, o.entry)}
                                        </div>

                                        <div className="px-2 text-right tracking-tight">
                                            {fmtLots(o.lots)}
                                        </div>

                                        <div className={`px-2 text-right tracking-tight ${Number(o.profit) >= 0 ? "text-green-400" : "text-red-400"}`}>
                                            {fmtPnl(o.profit)}
                                        </div>

                                    </div>

                                )) : (

                                    <div className="text-neutral-500 px-2">
                                        No open orders
                                    </div>

                                )}

                            </div>

                        </div>

                    </div>
                )}

                {tab === "updates" && (
                    <div className="flex flex-col flex-1 min-h-0">

                        <div className="flex-1 overflow-y-auto space-y-2 p-[clamp(8px,1.2vw,16px)]">

                            {data?.feed?.length ? data.feed.map((post: any, i: number) => (

                                <div
                                    key={i}
                                    onClick={() => setPreview(post)}
                                    className="bg-neutral-900 border border-neutral-800 overflow-hidden cursor-pointer"
                                >
                                    <div className="flex">

                                        {post.image && (
                                            <div className="w-[clamp(100px,28vw,240px)] shrink-0 overflow-hidden">
                                                <img
                                                    src={`https://drive.google.com/thumbnail?id=${post.image}&sz=w800`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}

                                        <div className="flex-1 px-2 py-2 space-y-2">

                                            <div className="flex items-center justify-between">
                                                <div className="text-[clamp(8px,4.66px+1.0416vw,18px)] text-neutral-400">
                                                    {new Date(post.time).toLocaleString()}
                                                </div>

                                                {post.text.includes("BUY") && (
                                                    <span className="text-green-400 text-[clamp(9px,5.5px+1.0937vw,19.5px)] font-semibold">BULLISH</span>
                                                )}
                                                {post.text.includes("SELL") && (
                                                    <span className="text-red-400 text-[clamp(9px,5.5px+1.0937vw,19.5px)] font-semibold">BEARISH</span>
                                                )}
                                                {post.text.includes("HEDGED") && (
                                                    <span className="text-green-400 text-[clamp(9px,5.5px+1.0937vw,19.5px)] font-semibold">HEDGED</span>
                                                )}
                                                {post.text.includes("EXIT") && (
                                                    <span className="text-red-400 text-[clamp(9px,5.5px+1.0937vw,19.5px)] font-semibold">EXITED</span>
                                                )}
                                            </div>

                                            <div
                                                className="
                        text-[clamp(9px,5.5px+1.0937vw,19.5px)]
                        leading-relaxed
                        text-neutral-200
                        whitespace-pre-line
                    "
                                                dangerouslySetInnerHTML={{ __html: post.text }}
                                            />

                                        </div>
                                    </div>
                                </div>

                            )) : (
                                <div className="text-[clamp(9px,5.5px+1.0937vw,19.5px)] text-neutral-500 text-center">
                                    No updates yet
                                </div>
                            )}

                        </div>
                    </div>
                )}

{tab === "history" && (
<div className="flex flex-col flex-1 min-h-0 p-[clamp(8px,1.2vw,16px)]">

<div className="flex flex-col flex-1 min-h-0 bg-neutral-900 border border-neutral-800 p-[clamp(8px,1vw,14px)] text-[clamp(9px,5.5px+1.0937vw,19.5px)]">

{/* HEADER */}

<div className="grid grid-cols-[11ch_5ch_11ch_11ch_7ch_10ch] text-neutral-400 mb-2 font-mono tabular-nums">

<div className="px-2">
Time
</div>

<div className="px-2">
Dir
</div>

<div className="px-2 text-right">
Entry
</div>

<div className="px-2 text-right">
Exit
</div>

<div className="px-2 text-right">
Lots
</div>

<div className="px-2 text-right">
PnL
</div>

</div>

{/* ROWS */}

<div className="flex-1 overflow-y-auto">

{data?.history?.length ? data.history.map((h:any,i:number)=>(

<div
key={i}
className="grid grid-cols-[11ch_5ch_11ch_11ch_7ch_10ch] border-t border-neutral-800 py-1 font-mono tabular-nums"
>

<div className="px-2 text-neutral-400">
{String(h.time).substring(0,10)}
</div>

<div className={`px-2 ${h.direction==="BUY"?"text-green-400":"text-red-400"}`}>
{h.direction}
</div>

<div className="px-2 text-right text-neutral-300 tracking-tight">
{fmtPrice(pair,h.entry)}
</div>

<div className="px-2 text-right text-neutral-300 tracking-tight">
{fmtPrice(pair,h.exit)}
</div>

<div className="px-2 text-right tracking-tight">
{fmtLots(h.lots)}
</div>

<div className={`px-2 text-right font-semibold tracking-tight ${
Number(h.pnl)>=0 ? "text-green-400":"text-red-400"
}`}>
{fmtPnl(h.pnl)}
</div>

</div>

)):(

<div className="text-neutral-500 px-2">
No history yet
</div>

)}

</div>

</div>

</div>
)}

                {tab === "performance" && (
                    <div className="flex flex-col flex-1 min-h-0 p-[clamp(8px,1.2vw,16px)]">
                        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto gap-[clamp(8px,1vh,16px)]">

                            <div className="grid grid-cols-2 gap-[clamp(6px,1vw,14px)] text-[clamp(9px,5.5px+1.0937vw,19.5px)]">
                                <Metric
                                    label="Win Rate"
                                    value={
                                        data?.performance?.winRate !== undefined
                                            ? data.performance.winRate + "%"
                                            : "--"
                                    }
                                />
                                <Metric
                                    label="Profit Factor"
                                    value={data?.performance?.profitFactor ?? "--"}
                                />
                            </div>

                            <div className="flex flex-col flex-1 gap-[clamp(8px,1vh,16px)] text-[clamp(9px,5.5px+1.0937vw,19.5px)]">
                                <Stat label="Total Trades" value={data?.performance?.trades} />
                                <Stat label="Wins" value={data?.performance?.wins} />
                                <Stat label="Losses" value={data?.performance?.losses} />
                                <Stat label="Total PnL" value={data?.performance?.pnlTotal} />

                                <div className="bg-neutral-800 border border-neutral-700 p-[clamp(10px,1vw,16px)] flex flex-col flex-1 min-h-[125px] overflow-hidden">

                                    <div className="text-neutral-400 text-[clamp(9px,5.5px+1.0937vw,19.5px)] mb-2">
                                        Equity / Drawdown
                                    </div>

                                    <div className="flex-1 min-h-0 pt-1">

                                        {curveData.length > 0 && (

                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={curveData}>

                                                    <Line
                                                        type="monotone"
                                                        dataKey="equity"
                                                        stroke="#3b82f6"
                                                        strokeWidth={2}
                                                        dot={false}
                                                        activeDot={{ r: 4 }}
                                                    />

                                                    <Line
                                                        type="monotone"
                                                        dataKey="drawdown"
                                                        stroke="#ef4444"
                                                        strokeWidth={1.5}
                                                        dot={false}
                                                        activeDot={{ r: 4 }}
                                                    />

                                                    <Tooltip
                                                        formatter={(value, name) => {
                                                            const v = Number(value ?? 0).toFixed(2)
                                                            const label = name === "equity" ? "Equity" : "Drawdown"
                                                            return [v, label]
                                                        }}
                                                        contentStyle={{
                                                            background: "#0a0a0a",
                                                            border: "1px solid #222"
                                                        }}
                                                        wrapperStyle={{
                                                            fontSize: "clamp(9px,5.5px+1.0937vw,19.5px)",
                                                            fontVariantNumeric: "tabular-nums"
                                                        }}
                                                    />

                                                </LineChart>
                                            </ResponsiveContainer>

                                        )}

                                    </div>

                                </div>
                            </div>

                        </div>

                    </div>
                )}
            </div>

            {/* MODAL PREVIEW */}
            {preview && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                    onClick={() => setPreview(null)}
                >
                    <div className="flex min-h-full items-center justify-center p-[clamp(12px,2vw,32px)]">

                        {/* MODAL */}
                        <div
                            className="
          w-full
          max-w-[clamp(480px,75vw,960px)]
          max-h-[90vh]
          bg-neutral-900
          border border-neutral-800
          rounded-xl
          shadow-2xl
          flex flex-col
          overflow-hidden
        "
                            onClick={(e) => e.stopPropagation()}
                        >

                            {/* HEADER */}
                            <div className="flex items-center justify-between px-[clamp(16px,2vw,28px)] py-[clamp(12px,1.6vw,20px)] border-b border-neutral-800 shrink-0">

                                <div className="text-[clamp(9px,5.5px+1.0937vw,19.5px)] text-neutral-400 leading-none">
                                    {new Date(preview.time).toLocaleString()}
                                </div>

                                <button
                                    onClick={() => setPreview(null)}
                                    className="
              text-[clamp(9px,5.5px+1.0937vw,19.5px)]
              text-neutral-500
              hover:text-white
              transition-colors
              leading-none
            "
                                >
                                    CLOSE
                                </button>
                            </div>

                            {/* CONTENT SCROLL AREA */}
                            <div className="flex-1 overflow-y-auto px-[clamp(16px,2vw,28px)] py-[clamp(16px,2vw,28px)] space-y-[clamp(16px,2vw,28px)]">

                                {preview.image && (
                                    <div className="w-full overflow-hidden rounded-lg border border-neutral-800">
                                        <img
                                            src={`https://drive.google.com/thumbnail?id=${preview.image}&sz=w2000`}
                                            className="w-full max-h-[75vh] object-contain select-none"
                                            draggable={false}
                                        />
                                    </div>
                                )}

                                <div
                                    className="
              text-[clamp(9px,5.5px+1.0937vw,19.5px)]
              leading-relaxed
              text-neutral-200
              whitespace-pre-line
            "
                                    dangerouslySetInnerHTML={{ __html: preview.text }}
                                />

                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

function Tab({ label, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`
        flex-1
        py-[clamp(6px,1vh,12px)]
        text-[clamp(9px,5.5px+1.0937vw,19.5px)]
        leading-none
        transition-all
        ${active
                    ? "text-white border-b-2 border-white bg-neutral-900"
                    : "text-neutral-500 hover:text-neutral-300"}
      `}
        >
            {label.toUpperCase()}
        </button>
    )
}

function Stat({ label, value }: any) {
    return (
        <div className="flex justify-between bg-neutral-800 border border-neutral-700 p-[clamp(8px,1vw,14px)]">
            <span className="text-neutral-400">{label}</span>
            <span className="font-semibold">{value ?? "--"}</span>
        </div>
    )
}

function Metric({ label, value }: any) {
    return (
        <div className="bg-neutral-800 border border-neutral-700 p-[clamp(10px,1.4vw,18px)] text-center">
            <div className="text-neutral-400 text-[clamp(9px,5.5px+1.0937vw,19.5px)]">{label}</div>
            <div className="text-[clamp(9px,5.5px+1.0937vw,19.5px)] font-semibold">{value ?? "--"}</div>
        </div>
    )
}

function MiniBlock({ label, value, highlight = "" }: any) {
    return (
        <div
            className="
                bg-neutral-900
                px-[clamp(8px,1vw,14px)]
                py-[clamp(8px,1vh,12px)]
                flex flex-col
                justify-center
                gap-[clamp(1px,0.2vh,4px)]
            "
        >
            <div
                className="
                    text-neutral-500
                    text-[clamp(8px,4.8px+1vw,16px)]
                    leading-none
                "
            >
                {label}
            </div>

            <div
                className={`
                    font-semibold
                    text-[clamp(9px,5.5px+1.0937vw,19.5px)]
                    leading-tight
                    ${highlight}
                `}
            >
                {value}
            </div>
        </div>
    )
}

function ConfidenceBar({ value }: { value: number }) {

    const percentage = Math.abs(value)
    const isBullish = value > 0
    const isBearish = value < 0

    const barColor =
        isBullish
            ? "bg-green-500"
            : isBearish
                ? "bg-red-500"
                : "bg-neutral-600"

    const label =
        value === 0
            ? "Neutral"
            : `${percentage.toFixed(0)}% ${isBullish ? "Bullish" : "Bearish"}`

    return (
        <div className="flex items-center gap-3">

            {/* LABEL */}
            <div className="whitespace-nowrap text-[clamp(8px,4.8px+1vw,16px)] text-neutral-400">
                {label}
            </div>

            {/* BAR */}
            <div className="relative flex-1 h-[6px] bg-neutral-800 rounded overflow-hidden">

                {/* Center Line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-neutral-600" />

                {/* Fill */}
                <div
                    className={`absolute top-0 bottom-0 ${barColor}`}
                    style={{
                        width: `${percentage}%`,
                        left: isBullish ? "50%" : undefined,
                        right: isBearish ? "50%" : undefined
                    }}
                />
            </div>

        </div>
    )
}
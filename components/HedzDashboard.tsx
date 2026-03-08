"use client"

import { useEffect, useState, useMemo } from "react"
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid
} from "recharts"

type TerminalRow = {
    time: string
    balance: number
    equity: number
    margin: number
    free_margin: number
    drawdown: number
    open_positions: number
}

type OrderRow = {
    time: string
    ticket: string
    symbol: string
    type: string
    lots: number
    entry: number
    sl: number
    tp: number
    profit: number
}

type HistoryRow = {
    time: string
    ticket: string
    symbol: string
    direction: string
    entry: number
    exit: number
    lots: number
    pnl: number
}

export default function HedzDashboard({ setView }: { setView: (view: "signals" | "hedz") => void }) {

    const [terminal, setTerminal] = useState<TerminalRow[]>([])
    const [orders, setOrders] = useState<OrderRow[]>([])
    const [history, setHistory] = useState<HistoryRow[]>([])
    const [loading, setLoading] = useState(true)

    const [tab, setTab] = useState<"terminal" | "orders" | "history" | "stats">("terminal")

    async function fetchData() {

        try {

            const hash = localStorage.getItem("hash")
            if (!hash) { setLoading(false); return }

            const res = await fetch(`/api/hedz?hash=${hash}`)
            if (!res.ok) { setLoading(false); return }

            const json = await res.json()

            const terminalRows = (json.terminal || []).slice(1).map((r: any) => ({
                time: r[0],
                balance: Number(r[1]),
                equity: Number(r[2]),
                margin: Number(r[3]),
                free_margin: Number(r[4]),
                drawdown: Number(r[5]),
                open_positions: Number(r[6])
            }))

            const orderRows = (json.orders || []).slice(1).map((r: any) => {

                const raw = String(r[3] || "").toUpperCase()

                let side = ""

                if (raw.includes("BUY")) side = "BUY"
                else if (raw.includes("SELL")) side = "SELL"
                else side = raw

                return {
                    time: r[0],
                    ticket: r[1],
                    symbol: r[2],
                    type: side,
                    lots: Number(r[4]),
                    entry: Number(r[5]),
                    sl: Number(r[6]),
                    tp: Number(r[7]),
                    profit: Number(r[8])
                }

            })

            const historyRows = (json.history || []).slice(1).map((r: any) => ({
                time: r[0],
                ticket: r[1],
                symbol: r[2],
                direction: r[3],
                entry: Number(r[4]),
                exit: Number(r[5]),
                lots: Number(r[6]),
                pnl: Number(r[7])
            }))

            setTerminal(terminalRows.slice(-300))
            setOrders(orderRows)
            setHistory(historyRows)

        } catch (e) {
            console.error(e)
        }

        setLoading(false)

    }

    useEffect(() => {
        fetchData()
        const timer = setInterval(fetchData, 15000)
        return () => clearInterval(timer)
    }, [])

    const latest = terminal.length ? terminal[terminal.length - 1] : null

    const pnl = latest ? latest.equity - latest.balance : 0

    const curveData = terminal.map((t, i) => ({
        index: i,
        time: t.time,
        equity: t.equity,
        balance: t.balance
    }))

    const tradeStats = useMemo(() => {

        const trades = history.length

        const wins = history.filter(t => t.pnl > 0)
        const losses = history.filter(t => t.pnl < 0)

        const winRate = trades ? (wins.length / trades) * 100 : 0

        const profit = wins.reduce((s, t) => s + t.pnl, 0)
        const loss = losses.reduce((s, t) => s + t.pnl, 0)

        const profitFactor = loss !== 0 ? profit / Math.abs(loss) : 0

        const totalPnl = history.reduce((s, t) => s + t.pnl, 0)

        return {
            trades,
            wins: wins.length,
            hedges: losses.length,
            winRate,
            profitFactor,
            totalPnl
        }

    }, [history])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen text-neutral-400">
                Loading dashboard...
            </div>
        )
    }

    return (

        <div className="flex flex-col h-full bg-black min-h-0">

            {/* HEADER */}

            <div className="shrink-0 flex items-center justify-between px-3 py-[clamp(6px,1vh,10px)] border-b border-neutral-800">

                <div className="font-semibold text-[clamp(11px,6.66px+1.354vw,24px)]">
                    MY HEDZ
                </div>

                <button
                    onClick={() => setView("signals")}
                    className="text-[clamp(9px,5.5px+1.0937vw,19.5px)] text-neutral-400 hover:text-white"
                >
                    CLOSE
                </button>

            </div>

            {/* TABS */}

            <div className="shrink-0 flex border-b border-neutral-800 text-[clamp(9px,5.5px+1.0937vw,19.5px)]">

                <Tab label="Terminal" active={tab === "terminal"} onClick={() => setTab("terminal")} />
                <Tab label="Orders" active={tab === "orders"} onClick={() => setTab("orders")} />
                <Tab label="History" active={tab === "history"} onClick={() => setTab("history")} />
                <Tab label="Statistics" active={tab === "stats"} onClick={() => setTab("stats")} />

            </div>

            <div className="flex-1 flex flex-col min-h-0">

                {/* TERMINAL */}

                {tab === "terminal" && (

                    <div className="flex flex-col flex-1 min-h-0 gap-[clamp(8px,1vh,16px)] p-[clamp(8px,1.2vw,16px)]">

                        <div className="grid grid-cols-3 gap-[clamp(6px,1vw,12px)]">

                            <MiniBlock label="Balance" value={latest?.balance?.toFixed(2)} />
                            <MiniBlock label="Equity" value={latest?.equity?.toFixed(2)} />
                            <MiniBlock label="PnL" value={pnl.toFixed(2)} highlight={pnl >= 0 ? "text-green-400" : "text-red-400"} />

                            <MiniBlock label="Drawdown" value={latest?.drawdown?.toFixed(2)} />
                            <MiniBlock label="Free Margin" value={latest?.free_margin?.toFixed(2)} />
                            <MiniBlock label="Positions" value={latest?.open_positions} />

                        </div>

                        <div className="flex flex-col flex-1 min-h-0 bg-neutral-900 border border-neutral-800 p-[clamp(8px,1vw,14px)]">

                            <div className="text-neutral-400 mb-2 text-[clamp(9px,5.5px+1.0937vw,19.5px)]">
                                Equity Curve
                            </div>

                            <div className="flex-1">

                                <ResponsiveContainer width="100%" height="100%">

                                    <LineChart data={curveData}>

                                        <CartesianGrid stroke="#222" />

                                        <XAxis dataKey="time" stroke="#666" />

                                        <YAxis orientation="right" stroke="#666" />

                                        <Line type="monotone" dataKey="equity" stroke="#3b82f6" dot={false} />
                                        <Line type="monotone" dataKey="balance" stroke="#22c55e" dot={false} />

                                        <Tooltip />

                                    </LineChart>

                                </ResponsiveContainer>

                            </div>

                        </div>

                    </div>

                )}

                {/* ORDERS TAB */}

                {tab === "orders" && (

                    <div className="flex flex-col flex-1 min-h-0 p-[clamp(8px,1.2vw,16px)]">

                        <div className="flex flex-col flex-1 min-h-0 bg-neutral-900 border border-neutral-800 p-[clamp(8px,1vw,14px)] text-[clamp(9px,5.5px+1.0937vw,19.5px)]">

                            <div className="grid grid-cols-6 text-neutral-400 mb-2 font-mono tabular-nums">

                                <div>Symbol</div>
                                <div>Side</div>
                                <div className="text-right">Lots</div>
                                <div className="text-right">Entry</div>
                                <div className="text-right">SL</div>
                                <div className="text-right">PnL</div>

                            </div>

                            <div className="flex-1 overflow-y-auto">

                                {orders.map((o, i) => (

                                    <div key={i} className="grid grid-cols-6 border-t border-neutral-800 py-1 font-mono tabular-nums">

                                        <div className="text-neutral-300">{o.symbol}</div>

                                        <div className={o.type === "BUY" ? "text-green-400" : "text-red-400"}>
                                            {o.type}
                                        </div>

                                        <div className="text-right">{o.lots.toFixed(2)}</div>
                                        <div className="text-right">{o.entry}</div>
                                        <div className="text-right">{o.sl}</div>

                                        <div className={`text-right ${o.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                                            {o.profit.toFixed(2)}
                                        </div>

                                    </div>

                                ))}

                            </div>

                        </div>

                    </div>

                )}

                {/* HISTORY TAB */}

                {tab === "history" && (

                    <div className="flex flex-col flex-1 min-h-0 p-[clamp(8px,1.2vw,16px)]">

                        <div className="flex flex-col flex-1 min-h-0 bg-neutral-900 border border-neutral-800 p-[clamp(8px,1vw,14px)] text-[clamp(9px,5.5px+1.0937vw,19.5px)]">

                            <div className="grid grid-cols-6 text-neutral-400 mb-2 font-mono tabular-nums">

                                <div>Time</div>
                                <div>Symbol</div>
                                <div>Side</div>
                                <div className="text-right">Entry</div>
                                <div className="text-right">Exit</div>
                                <div className="text-right">PnL</div>

                            </div>

                            <div className="flex-1 overflow-y-auto">

                                {history.slice(-200).reverse().map((t, i) => (

                                    <div key={i} className="grid grid-cols-6 border-t border-neutral-800 py-1 font-mono tabular-nums">

                                        <div className="text-neutral-400">
                                            {String(t.time).substring(0, 10)}
                                        </div>

                                        <div>{t.symbol}</div>

                                        <div className={t.direction === "BUY" ? "text-green-400" : "text-red-400"}>
                                            {t.direction}
                                        </div>

                                        <div className="text-right">{t.entry}</div>
                                        <div className="text-right">{t.exit}</div>

                                        <div className={`text-right ${t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                                            {t.pnl.toFixed(2)}
                                        </div>

                                    </div>

                                ))}

                            </div>

                        </div>

                    </div>

                )}

                {/* STATISTICS */}

                {tab === "stats" && (

                    <div className="flex flex-col flex-1 min-h-0 gap-[clamp(8px,1vh,16px)] p-[clamp(8px,1.2vw,16px)]">

                        <div className="grid grid-cols-2 gap-[clamp(6px,1vw,12px)]">

                            <Stat label="Win Rate" value={tradeStats.winRate.toFixed(1) + "%"} />
                            <Stat label="Profit Factor" value={tradeStats.profitFactor.toFixed(2)} />
                            <Stat label="Wins" value={tradeStats.wins} />
                            <Stat label="Hedges" value={tradeStats.hedges} />
                            <Stat label="Total Trades" value={tradeStats.trades} />
                            <Stat label="Total PnL" value={tradeStats.totalPnl.toFixed(2)} />

                        </div>

                        <div className="flex flex-col flex-1 min-h-0 bg-neutral-900 border border-neutral-800 p-[clamp(8px,1vw,14px)]">

                            <div className="text-neutral-400 mb-2 text-[clamp(9px,5.5px+1.0937vw,19.5px)]">
                                Equity / Drawdown
                            </div>

                            <div className="flex-1">

                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={curveData}>
                                        <CartesianGrid stroke="#222" />
                                        <XAxis dataKey="time" stroke="#666" />
                                        <YAxis orientation="right" stroke="#666" />
                                        <Line type="monotone" dataKey="equity" stroke="#3b82f6" dot={false} />
                                        <Tooltip />
                                    </LineChart>
                                </ResponsiveContainer>

                            </div>

                        </div>

                    </div>

                )}

            </div>

        </div>
    )
}

function Tab({ label, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-[clamp(6px,1vh,12px)] text-[clamp(9px,5.5px+1.0937vw,19.5px)]
${active ? "text-white border-b-2 border-white bg-neutral-900" : "text-neutral-500 hover:text-neutral-300"}`}
        >
            {label.toUpperCase()}
        </button>
    )
}

function MiniBlock({ label, value, highlight = "" }: any) {
    return (
        <div className="bg-neutral-900 px-[clamp(8px,1vw,14px)] py-[clamp(8px,1vh,12px)]">
            <div className="text-neutral-500 text-[clamp(8px,4.8px+1vw,16px)]">{label}</div>
            <div className={`font-semibold text-[clamp(9px,5.5px+1.0937vw,19.5px)] ${highlight}`}>
                {value ?? "--"}
            </div>
        </div>
    )
}

function Stat({ label, value }: any) {
    return (
        <div className="flex justify-between bg-neutral-800 border border-neutral-700 p-[clamp(8px,1vw,14px)]">
            <span className="text-neutral-400">{label}</span>
            <span className="font-semibold">{value}</span>
        </div>
    )
}
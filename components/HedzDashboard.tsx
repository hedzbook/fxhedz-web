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

export default function HedzDashboard({
    setView
}: {
    setView: (view: "signals" | "hedz") => void
}) {

    const [terminal, setTerminal] = useState<TerminalRow[]>([])
    const [orders, setOrders] = useState<OrderRow[]>([])
    const [history, setHistory] = useState<HistoryRow[]>([])
    const [loading, setLoading] = useState(true)

    const [tab, setTab] = useState<"terminal" | "orders" | "history" | "stats">("terminal")

    async function fetchData() {

        try {

            const hash = localStorage.getItem("hash")

            if (!hash) {
                setLoading(false)
                return
            }

            const res = await fetch(`/api/hedz?hash=${hash}`)

            if (!res.ok) {
                setLoading(false)
                return
            }

            const json = await res.json()

            const terminalRows =
                (json.terminal || [])
                    .slice(1)
                    .map((r: any) => ({

                        time: r[0],
                        balance: Number(r[1]),
                        equity: Number(r[2]),
                        margin: Number(r[3]),
                        free_margin: Number(r[4]),
                        drawdown: Number(r[5]),
                        open_positions: Number(r[6])

                    }))

            const orderRows =
                (json.orders || [])
                    .slice(1)
                    .map((r: any) => ({

                        time: r[0],
                        ticket: r[1],
                        symbol: r[2],
                        type: r[3],
                        lots: Number(r[4]),
                        entry: Number(r[5]),
                        sl: Number(r[6]),
                        tp: Number(r[7]),
                        profit: Number(r[8])

                    }))

            const historyRows =
                (json.history || [])
                    .slice(1)
                    .map((r: any) => ({

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

            console.error("HEDZ DASHBOARD ERROR", e)

        }

        setLoading(false)

    }

    useEffect(() => {

        fetchData()
        const timer = setInterval(fetchData, 15000)
        return () => clearInterval(timer)

    }, [])

    const latest =
        terminal.length
            ? terminal[terminal.length - 1]
            : null

    const pnl =
        latest
            ? latest.equity - latest.balance
            : 0

    const buyLots = useMemo(() => {

        return orders
            .filter(o => o.type === "BUY")
            .reduce((s, o) => s + o.lots, 0)

    }, [orders])

    const sellLots = useMemo(() => {

        return orders
            .filter(o => o.type === "SELL")
            .reduce((s, o) => s + o.lots, 0)

    }, [orders])

    const totalLots = buyLots + sellLots

    const tradeStats = useMemo(() => {

        const trades = history.length

        const wins = history.filter(t => t.pnl > 0)
        const losses = history.filter(t => t.pnl < 0)

        const winRate =
            trades
                ? (wins.length / trades) * 100
                : 0

        const profit =
            wins.reduce((s, t) => s + t.pnl, 0)

        const loss =
            losses.reduce((s, t) => s + t.pnl, 0)

        const profitFactor =
            loss !== 0
                ? profit / Math.abs(loss)
                : 0

        return {
            trades,
            winRate,
            profitFactor,
            profit
        }

    }, [history])

    if (loading) {

        return (

            <div className="flex items-center justify-center h-screen text-gray-400">
                Loading dashboard...
            </div>

        )

    }

    return (

        <div className="w-full h-screen overflow-y-auto bg-black text-white">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-32 relative">

                <button
                    onClick={() => setView("signals")}
                    className="
fixed
top-4
right-4
z-50
text-sm
px-3
py-1
rounded
bg-slate-800
text-gray-300
hover:text-white
"
                >
                    Close
                </button>

                {/* HEADER */}

                <div className="flex items-center justify-between mb-6">

                    <div className="text-xl font-semibold tracking-wide">
                        MY HEDZ
                    </div>

                    <div className="flex gap-2 text-sm">

                        <Tab label="Terminal" active={tab === "terminal"} onClick={() => setTab("terminal")} />
                        <Tab label="Orders" active={tab === "orders"} onClick={() => setTab("orders")} />
                        <Tab label="History" active={tab === "history"} onClick={() => setTab("history")} />
                        <Tab label="Stats" active={tab === "stats"} onClick={() => setTab("stats")} />

                    </div>

                </div>

                {/* TERMINAL TAB */}

                {tab === "terminal" && (

                    <div className="space-y-6">

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">

                            <Card title="Balance" value={latest?.balance} />
                            <Card title="Equity" value={latest?.equity} />
                            <Card title="PnL" value={pnl} />
                            <Card title="Drawdown" value={latest?.drawdown} />
                            <Card title="Free Margin" value={latest?.free_margin} />
                            <Card title="Positions" value={latest?.open_positions} />

                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 p-4">

                            <div className="text-gray-400 mb-2">
                                Equity Curve
                            </div>

                            <div className="w-full h-[320px]">

                                <ResponsiveContainer width="100%" height="100%">

                                    <LineChart data={terminal}>

                                        <CartesianGrid stroke="#222" />

                                        <XAxis dataKey="time" hide />

                                        <YAxis />

                                        <Tooltip />

                                        <Line type="monotone" dataKey="equity" stroke="#22c55e" dot={false} />
                                        <Line type="monotone" dataKey="balance" stroke="#3b82f6" dot={false} />

                                    </LineChart>

                                </ResponsiveContainer>

                            </div>

                        </div>

                        <div className="grid grid-cols-3 gap-4">

                            <Stat label="Buy Lots" value={buyLots} />
                            <Stat label="Sell Lots" value={sellLots} />
                            <Stat label="Total Lots" value={totalLots} />

                        </div>

                    </div>

                )}

                {/* ORDERS TAB */}

                {tab === "orders" && (

                    <div className="bg-neutral-900 border border-neutral-800 p-4">

                        <div className="text-gray-400 mb-3">
                            Open Positions
                        </div>

                        <div className="overflow-x-auto">

                            <table className="min-w-full text-sm">

                                <thead className="text-gray-400">

                                    <tr>

                                        <th className="px-2 py-2">Symbol</th>
                                        <th>Side</th>
                                        <th>Lots</th>
                                        <th>Entry</th>
                                        <th>SL</th>
                                        <th>TP</th>
                                        <th>PnL</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {orders.map((o, i) => (

                                        <tr key={i} className="border-t border-neutral-800">

                                            <td className="px-2 py-2">{o.symbol}</td>
                                            <td>{o.type}</td>
                                            <td>{o.lots}</td>
                                            <td>{o.entry}</td>
                                            <td>{o.sl}</td>
                                            <td>{o.tp}</td>

                                            <td className={o.profit >= 0 ? "text-green-400" : "text-red-400"}>
                                                {o.profit}
                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    </div>

                )}

                {/* HISTORY TAB */}

                {tab === "history" && (

                    <div className="bg-neutral-900 border border-neutral-800 p-4">

                        <div className="text-gray-400 mb-3">
                            Trade History
                        </div>

                        <div className="overflow-x-auto">

                            <table className="min-w-full text-sm">

                                <thead className="text-gray-400">

                                    <tr>

                                        <th className="px-2 py-2">Time</th>
                                        <th>Symbol</th>
                                        <th>Side</th>
                                        <th>Entry</th>
                                        <th>Exit</th>
                                        <th>Lots</th>
                                        <th>PnL</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {history.slice(-200).reverse().map((t, i) => (

                                        <tr key={i} className="border-t border-neutral-800">

                                            <td className="px-2 py-2">{t.time}</td>
                                            <td>{t.symbol}</td>
                                            <td>{t.direction}</td>
                                            <td>{t.entry}</td>
                                            <td>{t.exit}</td>
                                            <td>{t.lots}</td>

                                            <td className={t.pnl >= 0 ? "text-green-400" : "text-red-400"}>
                                                {t.pnl}
                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    </div>

                )}

                {/* STATS TAB */}

                {tab === "stats" && (

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

                        <Stat label="Trades" value={tradeStats.trades} />
                        <Stat label="Win Rate" value={tradeStats.winRate.toFixed(1) + "%"} />
                        <Stat label="Profit Factor" value={tradeStats.profitFactor.toFixed(2)} />
                        <Stat label="Total PnL" value={tradeStats.profit} />

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
            className={`
px-3
py-1
rounded
transition
${active
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-500 hover:text-white"
                }
`}
        >
            {label}
        </button>

    )

}

function Card({ title, value }: { title: string, value: any }) {

    return (

        <div className="bg-neutral-900 border border-neutral-800 p-3">

            <div className="text-gray-400 text-xs">
                {title}
            </div>

            <div className="text-lg font-semibold">
                {value ?? "-"}
            </div>

        </div>

    )

}

function Stat({ label, value }: { label: string, value: any }) {

    return (

        <div className="bg-neutral-900 border border-neutral-800 p-3">

            <div className="text-gray-400 text-xs">
                {label}
            </div>

            <div className="text-lg font-semibold">
                {value}
            </div>

        </div>

    )

}
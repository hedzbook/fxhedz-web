"use client"

import { useEffect, useState, useMemo } from "react"
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ReferenceLine
} from "recharts"

// --- Types ---
type TerminalRow = { time: string; balance: number; equity: number; margin: number; free_margin: number; drawdown: number; open_positions: number }
type OrderRow = { time: string; ticket: string; symbol: string; type: string; lots: number; entry: number; sl: number; tp: number; profit: number }
type HistoryRow = { time: string; ticket: string; symbol: string; direction: string; entry: number; exit: number; lots: number; pnl: number }

export default function HedzDashboard({ setView }: { setView: (view: "signals" | "hedz") => void }) {
    const [terminal, setTerminal] = useState<TerminalRow[]>([])
    const [orders, setOrders] = useState<OrderRow[]>([])
    const [history, setHistory] = useState<HistoryRow[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<"terminal" | "orders" | "history" | "stats">("terminal")

    async function fetchData() {
        try {
            const hash = localStorage.getItem("hash")
            if (!hash) { setLoading(false); return; }
            const res = await fetch(`/api/hedz?hash=${hash}`)
            if (!res.ok) { setLoading(false); return; }
            const json = await res.json()

            const terminalRows = (json.terminal || []).slice(1).map((r: any) => ({
                time: r[0], balance: Number(r[1]), equity: Number(r[2]),
                margin: Number(r[3]), free_margin: Number(r[4]),
                drawdown: Number(r[5]), open_positions: Number(r[6])
            }))

            setTerminal(terminalRows.slice(-300))
            setOrders((json.orders || []).slice(1).map((r: any) => ({
                time: r[0], ticket: r[1], symbol: r[2], type: r[3],
                lots: Number(r[4]), entry: Number(r[5]), sl: Number(r[6]),
                tp: Number(r[7]), profit: Number(r[8])
            })))
            setHistory((json.history || []).slice(1).map((r: any) => ({
                time: r[0], ticket: r[1], symbol: r[2], direction: r[3],
                entry: Number(r[4]), exit: Number(r[5]), lots: Number(r[6]), pnl: Number(r[7])
            })))
        } catch (e) { console.error(e) }
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
        const timer = setInterval(fetchData, 15000)
        return () => clearInterval(timer)
    }, [])

    // --- Derived Stats ---
    const latest = terminal.length ? terminal[terminal.length - 1] : null
    const pnl = latest ? latest.equity - latest.balance : 0
    const buyLots = useMemo(() => orders.filter(o => o.type === "BUY").reduce((s, o) => s + o.lots, 0), [orders])
    const sellLots = useMemo(() => orders.filter(o => o.type === "SELL").reduce((s, o) => s + o.lots, 0), [orders])

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#050505] text-neutral-500">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <span className="text-xs font-bold tracking-widest uppercase">Initializing Terminal</span>
        </div>
    )

    return (
        <div className="fixed inset-0 bg-[#0a0a0a] text-neutral-200 flex flex-col overflow-hidden font-sans">
            
            {/* TOP BAR */}
            <header className="h-14 border-b border-neutral-800 bg-[#0f0f0f] flex items-center justify-between px-4 sm:px-6 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-6 bg-emerald-500 rounded-full animate-pulse" />
                    <h1 className="text-sm font-black tracking-[0.2em] uppercase text-white">My Hedz Terminal</h1>
                </div>
                <button 
                    onClick={() => setView("signals")}
                    className="h-8 px-4 rounded-md bg-neutral-800 border border-neutral-700 text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-700 transition-colors"
                >
                    Exit
                </button>
            </header>

            {/* NAVIGATION TABS */}
            <nav className="flex bg-[#0f0f0f] border-b border-neutral-800 overflow-x-auto no-scrollbar shrink-0">
                {["terminal", "orders", "history", "stats"].map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t as any)}
                        className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${
                            tab === t ? "text-emerald-400" : "text-neutral-500 hover:text-neutral-300"
                        }`}
                    >
                        {t}
                        {tab === t && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500" />}
                    </button>
                ))}
            </nav>

            {/* MAIN VIEWPORT */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
                
                {tab === "terminal" && (
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* STATS GRID */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            <StatCard title="Balance" value={latest?.balance} prefix="$" />
                            <StatCard title="Equity" value={latest?.equity} prefix="$" highlight />
                            <StatCard title="Floating PnL" value={pnl} prefix="$" color={pnl >= 0 ? "text-emerald-400" : "text-red-400"} />
                            <StatCard title="Drawdown" value={latest?.drawdown} suffix="%" color="text-orange-400" />
                            <StatCard title="Free Margin" value={latest?.free_margin} prefix="$" />
                            <StatCard title="Positions" value={latest?.open_positions} />
                        </div>

                        {/* CHART AREA */}
                        <div className="bg-[#0f0f0f] border border-neutral-800 rounded-xl p-4 sm:p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Live Equity Curve</h2>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2 text-[9px] font-bold uppercase"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Equity</div>
                                    <div className="flex items-center gap-2 text-[9px] font-bold uppercase"><span className="w-2 h-2 rounded-full bg-sky-500" /> Balance</div>
                                </div>
                            </div>
                            <div className="h-[300px] sm:h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={terminal}>
                                        <defs>
                                            <linearGradient id="colorEq" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                                        <XAxis dataKey="time" hide />
                                        <YAxis domain={['auto', 'auto']} tick={{fontSize: 10, fill: '#666'}} axisLine={false} tickLine={false} orientation="right" />
                                        <Tooltip 
                                            contentStyle={{backgroundColor: '#0f0f0f', border: '1px solid #262626', fontSize: '12px'}}
                                            itemStyle={{padding: '2px 0'}}
                                        />
                                        <Area type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEq)" dot={false} />
                                        <Area type="monotone" dataKey="balance" stroke="#0ea5e9" strokeWidth={2} fill="transparent" dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* LOT EXPOSURE */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <ExposureCard label="Buy Exposure" value={buyLots} color="bg-emerald-500" />
                            <ExposureCard label="Sell Exposure" value={sellLots} color="bg-red-500" />
                            <ExposureCard label="Net Lots" value={buyLots + sellLots} color="bg-neutral-600" />
                        </div>
                    </div>
                )}

                {(tab === "orders" || tab === "history") && (
                    <div className="max-w-7xl mx-auto overflow-hidden bg-[#0f0f0f] border border-neutral-800 rounded-xl">
                         <div className="overflow-x-auto">
                            <table className="w-full text-left text-[11px]">
                                <thead className="bg-[#161616] text-neutral-500 uppercase tracking-tighter border-b border-neutral-800">
                                    <tr>
                                        <th className="px-4 py-3 font-black">Pair</th>
                                        <th className="px-4 py-3 font-black text-center">Type</th>
                                        <th className="px-4 py-3 font-black text-right">Lots</th>
                                        <th className="px-4 py-3 font-black text-right">Price</th>
                                        <th className="px-4 py-3 font-black text-right">PnL</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800">
                                    {(tab === "orders" ? orders : history).map((row: any, i) => (
                                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-4 font-bold text-white uppercase">{row.symbol}</td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`px-2 py-0.5 rounded-sm font-black text-[9px] ${
                                                    (row.type || row.direction) === "BUY" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                                }`}>
                                                    {row.type || row.direction}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right font-mono">{row.lots.toFixed(2)}</td>
                                            <td className="px-4 py-4 text-right font-mono">{row.entry.toFixed(5)}</td>
                                            <td className={`px-4 py-4 text-right font-black ${(row.profit ?? row.pnl) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                                ${(row.profit ?? row.pnl).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

// --- Helper Components ---

function StatCard({ title, value, prefix = "", suffix = "", color = "text-white", highlight = false }: any) {
    return (
        <div className={`p-4 rounded-xl border transition-all ${highlight ? "bg-emerald-500/5 border-emerald-500/20" : "bg-[#0f0f0f] border-neutral-800"}`}>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-neutral-500 mb-1">{title}</p>
            <p className={`text-lg font-black tracking-tight ${color}`}>
                {prefix}{typeof value === "number" ? value.toLocaleString(undefined, { minimumFractionDigits: 2 }) : (value ?? "-")}{suffix}
            </p>
        </div>
    )
}

function ExposureCard({ label, value, color }: any) {
    return (
        <div className="bg-[#0f0f0f] border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-neutral-500">{label}</span>
            <div className="flex items-center gap-3">
                <span className="text-sm font-black text-white">{value.toFixed(2)} <span className="text-[9px] text-neutral-600 ml-1">LOTS</span></span>
                <div className={`w-1 h-4 rounded-full ${color}`} />
            </div>
        </div>
    )
}
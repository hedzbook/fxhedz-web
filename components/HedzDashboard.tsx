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
account_login: string
server: string
terminal_build: string
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

export default function HedzDashboard() {

const [terminal,setTerminal] = useState<TerminalRow[]>([])
const [orders,setOrders] = useState<OrderRow[]>([])
const [history,setHistory] = useState<HistoryRow[]>([])
const [loading,setLoading] = useState(true)

async function fetchData(){

try{

const res = await fetch("/api/hedz")

const json = await res.json()

setTerminal(json.terminal || [])
setOrders(json.orders || [])
setHistory(json.history || [])

}catch(e){
console.error(e)
}

setLoading(false)
}

useEffect(()=>{

fetchData()

const timer = setInterval(fetchData,15000)

return ()=>clearInterval(timer)

},[])

const latest = terminal.length
? terminal[terminal.length-1]
: null

const pnl = latest
? latest.equity - latest.balance
: 0

const buyLots = useMemo(()=>{

return orders
.filter(o=>o.type === "BUY")
.reduce((sum,o)=>sum + Number(o.lots),0)

},[orders])

const sellLots = useMemo(()=>{

return orders
.filter(o=>o.type === "SELL")
.reduce((sum,o)=>sum + Number(o.lots),0)

},[orders])

const totalLots = buyLots + sellLots

const tradeStats = useMemo(()=>{

const trades = history.length

const wins = history.filter(t=>t.pnl > 0)

const losses = history.filter(t=>t.pnl < 0)

const winRate = trades
? (wins.length / trades) * 100
: 0

const profit = wins.reduce((s,t)=>s+t.pnl,0)

const loss = losses.reduce((s,t)=>s+t.pnl,0)

const profitFactor = loss !== 0
? profit / Math.abs(loss)
: 0

return {
trades,
winRate,
profitFactor,
profit
}

},[history])

if(loading){

return (
<div className="p-10 text-center text-gray-400">
Loading dashboard...
</div>
)

}

return (

<div className="p-6 space-y-8">

{/* ACCOUNT CARDS */}

<div className="grid grid-cols-2 md:grid-cols-6 gap-4">

<Card title="Balance" value={latest?.balance}/>
<Card title="Equity" value={latest?.equity}/>
<Card title="PnL" value={pnl}/>
<Card title="Drawdown" value={latest?.drawdown}/>
<Card title="Free Margin" value={latest?.free_margin}/>
<Card title="Positions" value={latest?.open_positions}/>

</div>

{/* EQUITY CURVE */}

<div className="bg-slate-900 rounded-xl p-4 border border-slate-800">

<h2 className="text-lg mb-4">Equity Curve</h2>

<ResponsiveContainer width="100%" height={300}>

<LineChart data={terminal}>

<CartesianGrid stroke="#1f2937"/>

<XAxis dataKey="time" hide/>

<YAxis/>

<Tooltip/>

<Line
type="monotone"
dataKey="equity"
stroke="#22c55e"
dot={false}
/>

<Line
type="monotone"
dataKey="balance"
stroke="#3b82f6"
dot={false}
/>

</LineChart>

</ResponsiveContainer>

</div>

{/* EXPOSURE */}

<div className="bg-slate-900 rounded-xl p-4 border border-slate-800">

<h2 className="text-lg mb-4">Exposure</h2>

<div className="grid grid-cols-3 gap-4">

<Stat label="Buy Lots" value={buyLots}/>

<Stat label="Sell Lots" value={sellLots}/>

<Stat label="Total Lots" value={totalLots}/>

</div>

</div>

{/* LIVE POSITIONS */}

<div className="bg-slate-900 rounded-xl p-4 border border-slate-800">

<h2 className="text-lg mb-4">Open Positions</h2>

<table className="w-full text-sm">

<thead className="text-gray-400">

<tr>
<th>Symbol</th>
<th>Side</th>
<th>Lots</th>
<th>Entry</th>
<th>SL</th>
<th>TP</th>
<th>PnL</th>
</tr>

</thead>

<tbody>

{orders.map((o,i)=>(
<tr key={i} className="border-t border-slate-800">

<td>{o.symbol}</td>
<td>{o.type}</td>
<td>{o.lots}</td>
<td>{o.entry}</td>
<td>{o.sl}</td>
<td>{o.tp}</td>

<td className={
o.profit >= 0
? "text-green-400"
: "text-red-400"
}>
{o.profit}
</td>

</tr>
))}

</tbody>

</table>

</div>

{/* TRADE STATS */}

<div className="bg-slate-900 rounded-xl p-4 border border-slate-800">

<h2 className="text-lg mb-4">Trade Statistics</h2>

<div className="grid grid-cols-4 gap-4">

<Stat label="Trades" value={tradeStats.trades}/>

<Stat label="Win Rate" value={tradeStats.winRate.toFixed(1)+"%"}/>

<Stat label="Profit Factor" value={tradeStats.profitFactor.toFixed(2)}/>

<Stat label="Total PnL" value={tradeStats.profit}/>

</div>

</div>

{/* HISTORY */}

<div className="bg-slate-900 rounded-xl p-4 border border-slate-800">

<h2 className="text-lg mb-4">Trade History</h2>

<table className="w-full text-sm">

<thead className="text-gray-400">

<tr>

<th>Time</th>
<th>Symbol</th>
<th>Side</th>
<th>Entry</th>
<th>Exit</th>
<th>Lots</th>
<th>PnL</th>

</tr>

</thead>

<tbody>

{history.slice().reverse().map((t,i)=>(

<tr key={i} className="border-t border-slate-800">

<td>{t.time}</td>
<td>{t.symbol}</td>
<td>{t.direction}</td>
<td>{t.entry}</td>
<td>{t.exit}</td>
<td>{t.lots}</td>

<td className={
t.pnl >= 0
? "text-green-400"
: "text-red-400"
}>
{t.pnl}
</td>

</tr>

))}

</tbody>

</table>

</div>

</div>

)

}

function Card({title,value}:{title:string,value:any}){

return(

<div className="bg-slate-900 rounded-xl p-4 border border-slate-800">

<div className="text-gray-400 text-xs">
{title}
</div>

<div className="text-lg font-semibold">
{value}
</div>

</div>

)

}

function Stat({label,value}:{label:string,value:any}){

return(

<div className="bg-slate-800 rounded-lg p-3">

<div className="text-xs text-gray-400">
{label}
</div>

<div className="text-lg">
{value}
</div>

</div>

)

}
"use client"

import { useEffect } from "react"

export default function AccountStrip({
    pairs,
    onStateChange
}: {
    pairs: any[]
    onStateChange?: (state: string, intensity: number, pulse: number) => void
}) {

    let totalFloating = 0
    let totalLots = 0
    let buyVol = 0
    let sellVol = 0

    pairs.forEach(p => {

        const orders = p.signal?.orders || []

        orders.forEach((pos: any) => {
            const lot = Number(pos.lots || 0)
            const pnl = Number(pos.profit || 0)

            totalLots += lot
            totalFloating += pnl

            if (pos.direction === "BUY") buyVol += lot
            if (pos.direction === "SELL") sellVol += lot
        })

    })

    const netState =
        buyVol === 0 && sellVol === 0
            ? "FLAT"
            : buyVol === sellVol
                ? "HEDGED"
                : buyVol > sellVol
                    ? "NET BUY"
                    : "NET SELL"

    const imbalance = Math.abs(buyVol - sellVol)
    const totalVol = buyVol + sellVol || 1
    const intensity = Math.min(1, imbalance / totalVol)
    const pulse = Math.min(1, Math.abs(totalFloating) / (totalLots || 1))

    useEffect(() => {
        if (typeof onStateChange === "function") {
            onStateChange(netState, intensity, pulse)
        }
    }, [netState, intensity, pulse])

return (
  <div className="h-full bg-neutral-900 flex px-3">

    <div className="flex-1 h-full flex items-center text-left text-[clamp(9px,5.5px+1.0937vw,19.5px)] leading-none">
<div className="flex items-center gap-[clamp(4px,0.6vw,8px)]">
  <span className="text-neutral-400">LOTS</span>
  <span className="font-semibold">{totalLots.toFixed(2)}</span>
</div>
    </div>

    <div className="flex-1 h-full flex items-center justify-center text-[clamp(9px,5.5px+1.0937vw,19.5px)] leading-none">
<div className="flex items-center gap-[clamp(4px,0.6vw,8px)]">
  <span className="text-neutral-400">~PnL</span>
  <span className={totalFloating >= 0 ? "text-green-400" : "text-red-400"}>
    {totalFloating.toFixed(2)}
  </span>
</div>
    </div>

    <div className="flex-1 h-full flex items-center justify-end text-[clamp(9px,5.5px+1.0937vw,19.5px)] font-semibold text-sky-400 leading-none">
      {netState}
    </div>

  </div>
)

}

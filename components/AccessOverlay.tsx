
"use client"

import WebGoogleLogin from "./WebGoogleLogin"

type Props = {
  sessionExists: boolean
}

export default function AccessOverlay({ sessionExists }: Props) {

  // If logged in â†’ no overlay at all
  if (sessionExists) return null

  // If NOT logged in â†’ show login panel
  return (
    <OverlayContainer>
      <Panel>
        <Header />
        <Title>Institutional Sign-in</Title>
        <Description>
          Sign in to access FXHEDZ LIVE Terminal
        </Description>
        <div className="w-full flex justify-center">
          <WebGoogleLogin />
        </div>
      </Panel>
    </OverlayContainer>
  )
}

/* --- Styled Sub-Components --- */

function OverlayContainer({ children }: any) {
  return (
    <div
      className="
        fixed inset-x-0
        bottom-[clamp(28px,3.5vh,50px)]
        z-[999]
        flex justify-center
        px-4
      "
    >
      {children}
    </div>
  )
}

function Panel({ children }: any) {
  return (
    <div
      className="
        w-full max-w-[clamp(220px,80vw,370px)]
        px-[clamp(12px,3vw,22px)]
        py-[clamp(12px,3vh,24px)]
        bg-[#0d0d0d]
        border border-neutral-800
        rounded-xl
        shadow-[0_10px_40px_rgba(0,0,0,0.7)]
        flex flex-col items-center text-center
      "
    >
      {children}
    </div>
  )
}

function Header() {
  return (
    <div className="text-[clamp(9px,5.5px+1.0937vw,19.5px)] tracking-[0.3em] text-blue-500 font-black mb-4 uppercase">
      FXHEDZ <span className="text-white">LIVE</span>
    </div>
  )
}

function Title({ children }: any) {
  return (
    <h2 className="text-[clamp(11px,6.66px+1.354vw,24px)] font-bold text-white tracking-tight mb-2">
      {children}
    </h2>
  )
}

function Description({ children }: any) {
  return (
    <p className="text-[clamp(9px,5.5px+1.0937vw,19.5px)] leading-[1.3] text-neutral-400 mb-4">
      {children}
    </p>
  )
}



// components\AccountStrip.tsx
// --------------------------------------------------

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


"use client"

import WebGoogleLogin from "./WebGoogleLogin"

type Props = {
  sessionExists: boolean
  authLoading?: boolean
  deviceLimited?: boolean
}

export default function AccessOverlay({
  sessionExists,
  authLoading,
  deviceLimited
}: Props) {

  if (authLoading) {
    return (
      <OverlayContainer>
        <Panel>
          <div className="flex flex-col items-center gap-3">
            <div className="w-5 h-5 border-2 border-neutral-700 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-[10px] font-bold text-neutral-500 tracking-[0.2em]">
              VERIFYING
            </p>
          </div>
        </Panel>
      </OverlayContainer>
    )
  }

  if (deviceLimited) return null
  if (sessionExists) return null

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
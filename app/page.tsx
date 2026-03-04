
"use client"

import React, { useEffect, useState, useMemo, useRef } from "react"
import PairCard from "@/components/PairCard"
import AccountStrip from "@/components/AccountStrip"
import VerticalSymbolButton from "@/components/VerticalSymbolButton"
import PairDetail from "@/components/PairDetail"
import AccessOverlay from "@/components/AccessOverlay"
import { generateDummySignals } from "@/lib/dummySignals"
import { generateDummyDetail } from "@/lib/dummyDetail"
import ControlPanel from "@/components/ControlPanel"
import pkg from "../package.json"

import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core"

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from "@dnd-kit/sortable"

import { CSS } from "@dnd-kit/utilities"

const DEFAULT_ORDER = [
  "ETHUSD",
  "USDCHF",
  "USDJPY",
  "XAUUSD",
  "EURUSD",
  "GBPUSD",
  "AUDUSD",
  "USOIL",
  "BTCUSD"
]
type PairKey =
  | "ETHUSD"
  | "USDCHF"
  | "USDJPY"
  | "XAUUSD"
  | "EURUSD"
  | "GBPUSD"
  | "AUDUSD"
  | "USOIL"
  | "BTCUSD"
const SIGNAL_API = "/api/signals"

type ViewMode = "MIN" | "MAX"

type SubscriptionMeta = {
  active?: boolean
  status?: string | null
  expiry?: string | null
  blocked?: boolean
}

export default function Page() {

  const dummySignals = useMemo(() => generateDummySignals(), [])
  const [signals, setSignals] = useState<any>(dummySignals)
  const [pairData, setPairData] = useState<any>({})
  const [openPair, setOpenPair] = useState<string | null>(null)
  const [uiSignals, setUiSignals] = useState<any>({})
  const [netState, setNetState] = useState("FLAT")
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [appInstruments, setAppInstruments] = useState<string[]>([])

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 768)
    }

    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const [subActive, setSubActive] = useState<boolean | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [deviceLimit, setDeviceLimit] = useState<{
    active: boolean
    count?: number
  }>({ active: false })

  useEffect(() => {

    function handler(e: any) {

      const storedEmail = localStorage.getItem("email")

      if (storedEmail) {
        setEmail(storedEmail)
      }

      setDeviceLimit({
        active: true,
        count: e.detail?.count
      })
    }

    window.addEventListener("fxhedz-device-limit", handler)

    return () =>
      window.removeEventListener("fxhedz-device-limit", handler)

  }, [])

  const isAndroid =
    typeof window !== "undefined" &&
    !!(window as any).ReactNativeWebView

  const hasNativeToken =
    isAndroid &&
    typeof window !== "undefined" &&
    (window as any).__HAS_NATIVE_TOKEN__ === true

  useEffect(() => {

    // ===============================
    // 🔥 TELEGRAM SESSION RESTORE
    // ===============================
const tgUserId =
  typeof window !== "undefined" &&
  (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.id

if (tgUserId) {

  async function bootstrapTelegram() {

    try {

      // 1️⃣ register / confirm user
      await fetch("/api/native-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_chat_id: String(tgUserId),
          platform: "telegram"
        })
      })

      // 2️⃣ mark session as active
      setAccessToken("telegram")
      setRefreshToken("telegram")
      
    } catch (e) {
      console.log("Telegram bootstrap failed", e)
    }

    setAuthLoading(false)
  }

  bootstrapTelegram()
  return
}

    // ===============================
    // ANDROID
    // ===============================
    if (isAndroid) {
      setAuthLoading(false)
      return
    }

    // ===============================
    // NORMAL WEB FLOW
    // ===============================

    const storedRefresh = localStorage.getItem("refreshToken")
    const storedEmail = localStorage.getItem("email")
    const storedDeviceId = localStorage.getItem("fxhedz_device_id")

    if (!storedRefresh || !storedEmail || !storedDeviceId) {
      setEmail(storedEmail || null)
      setAuthLoading(false)
      return
    }

    async function validate() {

      try {

        const res = await fetch("/api/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            refreshToken: storedRefresh,
            email: storedEmail,
            deviceId: storedDeviceId,
            platform: "web"
          })
        })

        if (res.status === 403) {

          const data = await res.json()

          setEmail(storedEmail)
          setRefreshToken(storedRefresh)

          setDeviceLimit({
            active: true,
            count: data.device_count
          })

          setAuthLoading(false)
          return
        }

        if (!res.ok) {
          localStorage.clear()
          setAuthLoading(false)
          return
        }

        const data = await res.json()

        setAccessToken(data.accessToken)
        setRefreshToken(storedRefresh)
        setEmail(storedEmail)

      } catch {
        localStorage.clear()
      }

      setAuthLoading(false)
    }

    validate()

  }, [])

  // =======================================
  // REFRESH TOKEN POLLING (REVOCATION CONTROL)
  // =======================================
  useEffect(() => {

    if (isAndroid) return
    if (!refreshToken || !email) return

    const interval = setInterval(async () => {

      try {

        const res = await fetch("/api/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            refreshToken,
            email,
            deviceId: localStorage.getItem("fxhedz_device_id"),
            platform: "web"
          })
        })

        if (!res.ok) {
          // ðŸ”¥ Token invalid â†’ force logout
          localStorage.clear()
          window.location.reload()
          return
        }

        const data = await res.json()

        if (data?.accessToken) {
          setAccessToken(data.accessToken)
        }

      } catch {
        // Optional silent fail
      }

    }, 15000) // every 15 seconds

    return () => clearInterval(interval)

  }, [refreshToken, email])

  const isTelegram =
    typeof window !== "undefined" &&
    !!(window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.id

const isAuthenticated =
  isTelegram
    ? true
    : isAndroid
      ? hasNativeToken
      : !!accessToken

const sessionExists =
  isTelegram
    ? subActive === true
    : isAndroid
      ? hasNativeToken
      : !!refreshToken

  const [accessMeta, setAccessMeta] =
    useState<SubscriptionMeta | null>(null)
  async function loadPreview(pair: string) {
    try {
      const res = await fetch(`/api/public-preview?pair=${pair}`)
      const json = await res.json()

      setPairData((prev: any) => ({
        ...prev,
        [pair]: json
      }))
    } catch (e) {
      console.error("Preview load failed", e)
    }
  }
  const [instrumentOrder, setInstrumentOrder] =
    useState<PairKey[]>(DEFAULT_ORDER as PairKey[])

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 8
      }
    })
  )
  useEffect(() => {

    if (!email || !accessMeta) return

    async function loadInstruments() {

      try {

        const res = await fetch("/api/signals", {
          cache: "no-store"
        })

        const data = await res.json()

        const platform =
          document.cookie
            .split("; ")
            .find(r => r.startsWith("fx_platform="))
            ?.split("=")[1] || "web"

        if (platform === "telegram") {
          setAppInstruments(data.telegramInstruments || [])
        } else if (platform === "android") {
          setAppInstruments(data.appInstruments || [])
        } else {
          setAppInstruments(data.webInstruments || [])
        }

      } catch (err) {
        console.error("Instrument load failed", err)
      }
    }

    loadInstruments()

  }, [email, accessMeta])
  useEffect(() => {
    const saved = localStorage.getItem("fxhedz_order")
    if (saved) {
      setInstrumentOrder(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("fxhedz_order", JSON.stringify(instrumentOrder))
  }, [instrumentOrder])
  const menuRef = useRef<HTMLDivElement | null>(null)
  const hamburgerRef = useRef<HTMLButtonElement | null>(null)
  const daysLeft = useMemo(() => {

    if (!accessMeta?.expiry) return null

    const now = new Date()
    const expiry = new Date(accessMeta.expiry)

    const diff = expiry.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

    return days > 0 ? days : 0
  }, [accessMeta])

  useEffect(() => {

    function handleClickOutside(event: MouseEvent) {

      if (!menuOpen) return

      const target = event.target as Node

      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(target)
      ) {
        setMenuOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }

  }, [menuOpen])

  useEffect(() => {

    if (authLoading) return

    if (!isAuthenticated) {
      setSignals(generateDummySignals())
      return
    }

    if (subActive === false) {
      setSignals(generateDummySignals())
      return
    }

    if (subActive === null) return

    async function loadSignals() {
      try {

        const headers: Record<string, string> = {}

        const tgId =
          (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.id

        if (tgId) {
          headers["x-telegram-id"] = String(tgId)
          headers["x-platform"] = "telegram"
        } else if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`
        }

        const res = await fetch(SIGNAL_API, { headers })

        if (!res.ok) return

        const json = await res.json()
        const incoming = json?.signals ?? {}

        setSignals(incoming)

      } catch { }
    }

    loadSignals()
    const interval = setInterval(loadSignals, 2500)
    return () => clearInterval(interval)

  }, [subActive, authLoading, accessToken])

  // =============================
  // CHECK SUBSCRIPTION STATUS
  // =============================
  useEffect(() => {

    if (authLoading) return

    // Only block unauthenticated for WEB
    if (!isAndroid && !isTelegram && !isAuthenticated) {
      setSubActive(false)
      return
    }

    // If Android and no native token â†’ block
    if (isAndroid && !hasNativeToken) {
      setSubActive(false)
      return
    }

    async function init() {

      // ===============================
      // PLATFORM + DEVICE COOKIES
      // ===============================

      const params = new URLSearchParams(window.location.search)
      const urlPlatform = params.get("platform")
      const urlDeviceId = params.get("device_id")

      let platform = "web"

      if (urlPlatform === "android") {
        platform = "android"
      }

      try {
        const tg = (window as any)?.Telegram?.WebApp
        if (tg?.initDataUnsafe?.user?.id) {
          platform = "telegram"
          const tgUser = tg.initDataUnsafe.user
          document.cookie = `fx_tg_id=${tgUser.id}; path=/; max-age=31536000`
          tg.ready()
        }
      } catch { }

      let id: string | null = null

      // ===============================
      // TELEGRAM DEVICE ID OVERRIDE
      // ===============================
      if (platform === "telegram") {
        try {
          const tg = (window as any)?.Telegram?.WebApp
          const tgUserId = tg?.initDataUnsafe?.user?.id

          if (tgUserId) {
            id = String(tgUserId)
            localStorage.setItem("fxhedz_device_id", id)
          }
        } catch { }
      }

      // ===============================
      // FALLBACK (WEB / ANDROID URL)
      // ===============================
      if (!id) {
        id = urlDeviceId || localStorage.getItem("fxhedz_device_id")

        if (!id) {
          id = window.crypto.randomUUID()
          localStorage.setItem("fxhedz_device_id", id)
        }
      }

      document.cookie = `fx_device=${id}; path=/; max-age=31536000`
      document.cookie = `fx_platform=${platform}; path=/; max-age=31536000`

      // ===============================
      // SUBSCRIPTION CHECK
      // ===============================

      try {
        const headers: Record<string, string> = {}

        const tgId =
          (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.id

        if (tgId) {
          headers["x-telegram-id"] = String(tgId)
          headers["x-platform"] = "telegram"
        } else if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`
        }

        const res = await fetch(
          `/api/subscription`,
          {
            cache: "no-store",
            headers
          }
        )

        const data = await res.json()
        // alert("SUB DATA: " + JSON.stringify(data))
        console.log("SUB DATA:", data)

        setAccessMeta(data)
        if (data?.active !== undefined) {
          setSubActive(Boolean(data.active))
        }

      } catch {
        setSubActive(false)
      }
    }

    init()

  }, [authLoading])

  // =============================
  // SUBSCRIPTION POLLING (LIVE SYNC)
  // =============================
  useEffect(() => {

    if (!isAndroid && !isAuthenticated) return

    async function checkSubscription() {
      try {
        const headers: Record<string, string> = {}

        const tgId =
          (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.id

        if (tgId) {
          headers["x-telegram-id"] = String(tgId)
          headers["x-platform"] = "telegram"
        } else if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`
        }

        const res = await fetch("/api/subscription", {
          cache: "no-store",
          headers
        })

        const data = await res.json()

        setAccessMeta(prev => {
          if (JSON.stringify(prev) === JSON.stringify(data)) return prev
          return data
        })

        setSubActive(Boolean(data?.active))

      } catch { }
    }

    // poll every 10 seconds
    const interval = setInterval(checkSubscription, 10000)

    return () => clearInterval(interval)

  }, [isAuthenticated])

  useEffect(() => {
    setUiSignals(signals)
  }, [signals])

  useEffect(() => {

    if (!openPair) return

    if (isGuest) {
      loadPreview(openPair)
      return
    }


    const pairKey = openPair
    let cancelled = false

    async function refreshOpenPair() {
      try {

        const res = await fetch(`/api/signals?pair=${pairKey}`, {
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {}
        })
        const json = await res.json()
        if (cancelled) return

        setPairData((prev: any) => ({
          ...prev,
          [pairKey]: json
        }))
      } catch { }
    }

    refreshOpenPair()
    const interval = setInterval(refreshOpenPair, 6000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [openPair, subActive, authLoading])

  function togglePair(pair: string) {
    // Toggle between open/close pair expansion
    if (openPair === pair) {
      setOpenPair(null) // Collapse the pair
    } else {
      setOpenPair(pair) // Expand the specific pair
    }
  }
  function handleDragEnd(event: any) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = instrumentOrder.indexOf(active.id)
    const newIndex = instrumentOrder.indexOf(over.id)

    setInstrumentOrder(arrayMove(instrumentOrder, oldIndex, newIndex))
  }
  async function logoutCurrentSession() {

    const tgId =
      (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.id

if (tgId) {
  setSubActive(false)
  setAccessMeta(null)
  setSignals(generateDummySignals())
  setUiSignals(generateDummySignals())
  return
}

    const isAndroid =
      typeof window !== "undefined" &&
      !!(window as any).ReactNativeWebView

    const deviceId = localStorage.getItem("fxhedz_device_id")

    const storedEmail =
      localStorage.getItem("email") ||
      (window as any).__NATIVE_EMAIL__ ||
      null

    // Android handled natively
    if (isAndroid) {
      window.ReactNativeWebView?.postMessage("LOGOUT_REQUEST")
      return
    }

    if (storedEmail && deviceId) {
      try {
        await fetch("/api/logout-device", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: storedEmail,
            device_id: deviceId,
            platform: "web"
          })
        })
      } catch (e) {
        console.log("Logout device failed", e)
      }
    }

    localStorage.clear()
    window.location.reload()
  }

  async function logoutAllWebDevices() {

    if (!email) {
      console.error("Logout-all attempted without email")
      return
    }

    try {
      const res = await fetch("/api/logout-all-web", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      })

      if (!res.ok) {
        console.error("Logout-all failed with status:", res.status)
        return
      }

    } catch (e) {
      console.error("Logout-all network error:", e)
      return
    }

    logoutCurrentSession()
  }
  const pairsData = useMemo(() => {
    return instrumentOrder.map((pair) => {
      const signal = uiSignals?.[pair]
      const extra = pairData?.[pair] || {}
      return { pair, signal, orders: extra?.orders || [] }
    })
  }, [uiSignals, pairData])

  const isGuest =
    !isAuthenticated

  const plan = accessMeta?.status?.toLowerCase()

  const isLivePlus = plan === "live+"
  const isLive = plan === "live"

  const detailData = openPair
    ? (
      isGuest
        ? {
          ...pairData?.[openPair],
          ...generateDummyDetail(openPair),
          orders: uiSignals?.[openPair]?.orders || []
        }
        : pairData?.[openPair]
    )
    : undefined

  if (openPair) {
    console.log("DETAIL DATA:", detailData)
  }
  function SortableButton({ id, children }: any) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition
    } = useSortable({ id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition
    }

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        {children}
      </div>
    )
  }
  function SortableRow({ id, children }: any) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition
    } = useSortable({ id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      willChange: "transform"
    }

    return (
      <div ref={setNodeRef} style={style}>
        {typeof children === "function"
          ? children({ attributes, listeners })
          : children}
      </div>
    )
  }
  return (
    <div className="relative">

      <main
        className="h-[100dvh] bg-black text-white flex flex-col"
      >

        {/* TOP BAR */}
        <div
          className="shrink-0 grid border-b border-neutral-800"
          style={{
            gridTemplateColumns: "clamp(30px, 3.5vw, 46px) 1fr",
            height: "clamp(28px,3.5vh,50px)"
          }}
        >

          {/* TOP LEFT BUTTON */}
          <button
            onClick={() => {
              setOpenPair(null)
            }}
            className="
    border-r border-neutral-800
    bg-neutral-000
    hover:bg-neutral-000
    flex items-center justify-center
  "
          >
            <img
              src="/favicon.png"
              alt="FXHEDZ"
              className="
      w-[80%]
      h-[90%]
      object-contain
      select-none
      pointer-events-none
    "
            />
          </button>

          {/* ACCOUNT STRIP */}
          <AccountStrip
            pairs={pairsData}
            onStateChange={(state: string) => {
              setNetState(state)
            }}
          />

        </div>

        {/* SCROLL AREA */}
        <div className="flex-1 overflow-hidden relative">

          {openPair ? (

            <div
              className="absolute inset-0 grid"
              style={{
                gridTemplateColumns: "clamp(30px, 3.5vw, 46px) 1fr",
                gridTemplateRows: "1fr"
              }}
            >

              {/* LEFT RAIL */}
              <div className="grid"
                style={{
                  gridTemplateRows: `repeat(${instrumentOrder.length}, 1fr)`
                }}
              >
                {instrumentOrder.map((pair) => (
                  <VerticalSymbolButton
                    key={pair}
                    pair={pair}
                    active={openPair === pair}
                    onClick={() =>
                      setOpenPair(prev => (prev === pair ? null : pair))
                    }
                  />
                ))}
              </div>

              {/* RIGHT DETAIL */}
              <PairDetail
                pair={openPair}
                data={detailData}
                signal={uiSignals?.[openPair]}
                onClose={() => setOpenPair(null)}
                isGuest={isGuest}
                email={email || (window as any).__NATIVE_EMAIL__}
                appInstruments={appInstruments}
                setAppInstruments={setAppInstruments}
              />

            </div>

          ) : (

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={instrumentOrder}
                strategy={verticalListSortingStrategy}
              >

                <div
                  className="grid h-full"
                  style={{
                    gridTemplateRows: `repeat(${instrumentOrder.length}, 1fr)`
                  }}
                >
                  {instrumentOrder.map((pair: PairKey) => {

                    const realSignal = uiSignals?.[pair]
                    const dummySignal = dummySignals[pair]

                    const isLivePair =
                      pair === "ETHUSD" || pair === "USDCHF"

                    const subscriptionReady =
                      subActive !== null &&
                      accessMeta !== null

                    const canAccess =
                      subscriptionReady &&
                      subActive === true &&
                      (
                        isLivePlus ||
                        (isLive && isLivePair)
                      )

                    const displaySignal =
                      !isAuthenticated
                        ? dummySignal
                        : canAccess
                          ? (realSignal ?? dummySignal)
                          : dummySignal

                    const displayDirection =
                      !isAuthenticated
                        ? dummySignal?.direction
                        : !subscriptionReady
                          ? dummySignal?.direction
                          : canAccess
                            ? realSignal?.direction
                            : "LIVE+"

                    return (
                      <SortableRow key={pair} id={pair}>
                        {({ attributes, listeners }: any) => (
                          <div className="flex h-full">

                            <div
                              className="h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                              style={{
                                width: "clamp(30px, 3.5vw, 46px)",
                                touchAction: "none"
                              }}
                              {...attributes}
                              {...listeners}
                            >
                              <VerticalSymbolButton
                                pair={pair}
                                active={false}
                                onClick={() => {
                                  if (!subscriptionReady) return
                                  if (!canAccess) return
                                  setOpenPair(prev => prev === pair ? null : pair)
                                }}
                              />
                            </div>

                            <div className="flex-1 h-full">
                              <PairCard
                                pair={pair}
                                open={openPair === pair}
                                direction={displayDirection}
                                signal={displaySignal}
                                onToggle={() => {
                                  if (!subscriptionReady) return
                                  if (!canAccess) return
                                  setOpenPair(prev => prev === pair ? null : pair)
                                }}
                                isGuest={!canAccess}
                              />
                            </div>

                          </div>
                        )}
                      </SortableRow>
                    )
                  })}

                </div>

              </SortableContext>
            </DndContext>

          )}

        </div>

        {/* MENU LAYER */}
        {menuOpen && (
          <div
            ref={menuRef}
            className={
              isMobile
                ? `
      absolute
      inset-x-0
      top-0
      bottom-[clamp(28px,3.5vh,50px)]
      z-40
      bg-neutral-950
      flex
      flex-col
    `
                : `
            absolute
            bottom-[clamp(28px,3.5vh,50px)]
            left-0
            z-50
            w-[min(92vw,360px)]
            max-h-[80vh]
            overflow-y-auto
            backdrop-blur-md
            bg-black/40
            rounded-lg
            shadow-xl
          `
            }
          >
            <ControlPanel
              accessMeta={accessMeta}
              deviceId={
                typeof window !== "undefined"
                  ? localStorage.getItem("fxhedz_device_id")
                  : null
              }
              version={`v${pkg.version}`}
              onLogout={logoutCurrentSession}   // ðŸ‘ˆ ADD THIS
            />
          </div>
        )}

        {/* BOTTOM BAR */}
        <div
          className="shrink-0 grid border-t border-neutral-800 relative"
          style={{
            gridTemplateColumns: "clamp(30px, 3.5vw, 46px) 1fr",
            height: "clamp(28px,3.5vh,50px)"
          }}
        >


          {/* BOTTOM LEFT BUTTON (HAMBURGER HERE) */}
          <button
            ref={hamburgerRef}
            onClick={() => setMenuOpen(prev => !prev)}
            className="
    border-r border-neutral-800
    bg-neutral-950
    hover:bg-neutral-900
    flex items-center justify-center
    relative
  "
          >
            <div
              className="
      relative
      w-[clamp(12px,1.6vh,18px)]
      h-[clamp(8px,1.2vh,14px)]
    "
            >

              {/* TOP LINE */}
              <span
                className={`
        absolute left-0
        w-full
        h-[clamp(1px,0.25vh,2px)]
        bg-neutral-400
        transition-all duration-300 ease-in-out
        ${menuOpen
                    ? "top-1/2 -translate-y-1/2 rotate-45"
                    : "top-0"}
      `}
              />

              {/* MIDDLE LINE */}
              <span
                className={`
        absolute left-0 top-1/2 -translate-y-1/2
        w-full
        h-[clamp(1px,0.25vh,2px)]
        bg-neutral-400
        transition-all duration-300 ease-in-out
        ${menuOpen ? "opacity-0" : ""}
      `}
              />

              {/* BOTTOM LINE */}
              <span
                className={`
        absolute left-0
        w-full
        h-[clamp(1px,0.25vh,2px)]
        bg-neutral-400
        transition-all duration-300 ease-in-out
        ${menuOpen
                    ? "top-1/2 -translate-y-1/2 -rotate-45"
                    : "bottom-0"}
      `}
              />

            </div>
          </button>

          {/* RIGHT SIDE CONTENT */}
          <div className="bg-neutral-900 flex items-center px-3">
            <div className="text-[clamp(11px,6.66px+1.354vw,24px)] font-semibold leading-none">
              FXHEDZ
            </div>

            <div className="ml-auto text-right flex flex-col items-end">
              <div className="text-[clamp(7px,0.9vh,12px)] leading-[11px]">
                ZEROLOSS COMPOUNDED
              </div>
              <div className="text-[clamp(8px,1vh,14px)] text-neutral-500 leading-[10px] tracking-[0.098em]">
                HEDGING SYSTEM
              </div>
            </div>
          </div>

        </div>

      </main>
      {deviceLimit.active && (
        <div className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center">
          <div className="bg-neutral-900 p-6 rounded-xl w-[90%] max-w-md text-center space-y-4">

            <div className="text-lg font-semibold">
              Device Restricted
            </div>

            <div className="text-sm text-neutral-400">
              Maximum 2 web devices allowed.
            </div>

            <div className="flex gap-3">
              <button
                onClick={logoutAllWebDevices}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 py-2 rounded"
              >
                Logout All Devices
              </button>

              <button
                onClick={logoutCurrentSession}
                className="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded"
              >
                Logout
              </button>
            </div>

          </div>
        </div>
      )}

      {!deviceLimit.active && !authLoading && (
        <AccessOverlay sessionExists={sessionExists} />
      )}
    </div>
  )
}

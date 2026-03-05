
"use client"

import { useEffect, useRef } from "react"
import {
    createChart,
    ColorType,
    CandlestickSeries
} from "lightweight-charts"

export default function GlobalLightChart({
    mountId,
    signal,
    disableOverlays
}: {
    mountId?: string
    signal?: any
    disableOverlays?: boolean
}) {

    const chartRef = useRef<any>(null)
    const candleSeriesRef = useRef<any>(null)
    const dynamicLinesRef = useRef<any[]>([])
    const historyLoadedRef = useRef(false)

    // ==========================================
    // CREATE CHART
    // ==========================================
    useEffect(() => {

        if (!mountId) return

        const container = document.getElementById(mountId)
        if (!container) return

        while (container.firstChild) {
            container.removeChild(container.firstChild)
        }

        const width = container.clientWidth

        // ðŸ”¥ Responsive Font Clamp (9px - 14px)
        const clampedFontSize = Math.max(
            9,
            Math.min(14, Math.floor(width * 0.012))
        )

        // ðŸ”¥ Responsive Bar Spacing
        const clampedBarSpacing = Math.max(
            6,
            Math.min(14, Math.floor(width * 0.01))
        )

        const chart = createChart(container, {
            width: width,
            height: container.clientHeight,
            layout: {
                background: { type: ColorType.Solid, color: "#1E1E1E" },
                textColor: "#8A8A8A",
                fontSize: clampedFontSize,
                fontFamily: "monospace"
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { visible: false }
            },
            rightPriceScale: {
                borderColor: "rgba(255,255,255,0.05)"
            },
            timeScale: {
                borderColor: "rgba(255,255,255,0.05)",
                timeVisible: true,
                secondsVisible: false,
                rightOffset: 8,
                barSpacing: clampedBarSpacing
            }
        })

        const series = chart.addSeries(CandlestickSeries, {
            upColor: "#22C55E",
            downColor: "#EF4444",
            borderUpColor: "#22C55E",
            borderDownColor: "#EF4444",
            wickUpColor: "#22C55E",
            wickDownColor: "#EF4444"
        })

        chartRef.current = chart
        candleSeriesRef.current = series
        historyLoadedRef.current = false

        const resizeObserver = new ResizeObserver(() => {

            const width = container.clientWidth

            const newFontSize = Math.max(
                9,
                Math.min(14, Math.floor(width * 0.012))
            )

            const newBarSpacing = Math.max(
                6,
                Math.min(14, Math.floor(width * 0.01))
            )

            chart.applyOptions({
                width: container.clientWidth,
                height: container.clientHeight,
                layout: {
                    fontSize: newFontSize
                },
                timeScale: {
                    barSpacing: newBarSpacing
                }
            })
        })

        resizeObserver.observe(container)

        return () => {
            resizeObserver.disconnect()
            chart.remove()
        }

    }, [mountId])

    // ==========================================
    // CANDLE STREAM
    // ==========================================
    useEffect(() => {

        const series = candleSeriesRef.current
        if (!series) return
        if (!signal?.candles) return

        const data = signal.candles.map((c: any) => ({
            time: Number(c.time),
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close)
        }))

        if (!data.length) return

        if (!historyLoadedRef.current) {
            series.setData(data)
            historyLoadedRef.current = true
            return
        }

        const last = data[data.length - 1]
        series.update(last)

    }, [signal?.candles])

    // ==========================================
    // OVERLAY ENGINE
    // ==========================================
    useEffect(() => {

        if (disableOverlays) return

        const candleSeries = candleSeriesRef.current
        if (!candleSeries || !signal) return

        dynamicLinesRef.current.forEach((l: any) => {
            candleSeries.removePriceLine(l)
        })
        dynamicLinesRef.current = []

        let orders = signal?.orders || []

        if (!orders.length && signal?.direction && signal?.entry) {
            orders = [{
                label: signal.direction === "BUY" ? "B1" : "S1",
                entry: signal.entry,
                direction: signal.direction
            }]
        }

        if (!orders.length) return

        const isHedged = signal?.direction === "HEDGED"

        orders.forEach((o: any, index: number) => {

            const entry = Number(o.entry)
            if (!entry) return

            const isLatest = index === orders.length - 1
            const isHedged = signal?.direction === "HEDGED"

            const activeColor =
                o.direction === "BUY"
                    ? "#22C55E"
                    : "#EF4444"

            const mutedColor =
                o.direction === "BUY"
                    ? "rgba(34,197,94,0.45)"
                    : "rgba(239,68,68,0.45)"

            const color =
                isLatest && !isHedged
                    ? activeColor
                    : mutedColor

            const entryLine = candleSeries.createPriceLine({
                price: entry,
                color,
                lineWidth: 2,
                axisLabelVisible: isLatest && !isHedged,
                title: isLatest && !isHedged ? (o.label || "") : ""
            })

            dynamicLinesRef.current.push(entryLine)

            if (isHedged) return
            if (!isLatest) return

            const sl = Number(signal?.sl)
            const tp = Number(signal?.tp)

            if (sl) {
                const hedgeLabel =
                    o.direction === "BUY" ? "HS" : "HS"

                const slLine = candleSeries.createPriceLine({
                    price: sl,
                    color: "#F97316", // ðŸ”¥ Orange for hedge clarity
                    lineWidth: 1,
                    lineStyle: 2,
                    title: hedgeLabel
                })

                dynamicLinesRef.current.push(slLine)
            }

            if (tp) {
                const tpLine = candleSeries.createPriceLine({
                    price: tp,
                    color: "#22C55E",
                    lineWidth: 1,
                    lineStyle: 2,
                    title: "TP"
                })

                dynamicLinesRef.current.push(tpLine)
            }

        })

    }, [signal])

    return null
}


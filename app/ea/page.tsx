"use client"

import { useEffect, useState } from "react"

export default function MyHedzPage() {

  const [data, setData] = useState<any>(null)

  async function load() {
    const res = await fetch("/api/terminal")
    const json = await res.json()
    setData(json)
  }

  useEffect(() => {

    load()

    const interval = setInterval(load, 5000)

    return () => clearInterval(interval)

  }, [])

  if (!data) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center">
        Loading Terminal...
      </div>
    )
  }

  return (

    <div className="bg-black text-white min-h-screen p-6">

      <h1 className="text-xl font-bold mb-4">
        My HEDZ Terminal
      </h1>

      <div className="grid grid-cols-3 gap-4">

        <div className="bg-neutral-900 p-4 rounded">
          Balance: {data.balance}
        </div>

        <div className="bg-neutral-900 p-4 rounded">
          Equity: {data.equity}
        </div>

        <div className="bg-neutral-900 p-4 rounded">
          Floating PnL: {data.floating}
        </div>

      </div>

    </div>
  )
}
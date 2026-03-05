
"use client"

type Props = {
  pair: string
  active?: boolean
  onClick: () => void
}

function splitPair(pair: string) {
  const knownQuotes = ["USD", "JPY", "CHF", "OIL"]

  for (const quote of knownQuotes) {
    if (pair.endsWith(quote)) {
      return {
        base: pair.slice(0, pair.length - quote.length),
        quote
      }
    }
  }

  return {
    base: pair.slice(0, 3),
    quote: pair.slice(3)
  }
}

export default function VerticalSymbolButton({
  pair,
  active = false,
  onClick
}: Props) {

  const { base, quote } = splitPair(pair)

  return (
    <button
      onClick={onClick}
      className={`
        h-full w-full
        flex items-center justify-center
        border border-neutral-800
        rounded-none
        ${active
          ? "bg-neutral-900 text-white border-sky-400"
          : "bg-neutral-950 text-neutral-500 hover:bg-neutral-900"
        }
      `}
    >
      <div className="flex flex-col items-center leading-[1.05]">
        <span className="text-[clamp(8px,4.66px+1.0416vw,18px)] font-semibold tracking-wide">
          {base}
        </span>
        <span className="text-[clamp(8px,4.66px+1.0416vw,18px)] text-neutral-400 tracking-wide">
          {quote}
        </span>
      </div>
    </button>
  )
}
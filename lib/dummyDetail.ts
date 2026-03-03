
export function generateDummyDetail(pair: string) {

  const history = [
    { direction: "BUY", entry: 1.0800, exit: 1.0865, pnl: 65.00 },
    { direction: "SELL", entry: 1.0920, exit: 1.0850, pnl: 70.00 },
    { direction: "BUY", entry: 1.0700, exit: 1.0680, pnl: -20.00 }
  ]

  const performance = {
    winRate: 73,
    profitFactor: 1.82,
    trades: 48,
    wins: 35,
    losses: 13,
    pnlTotal: 1245.60
  }

  return {
    history,
    performance,
    notes: "Institutional accumulation detected. Liquidity engineering active."
  }
}


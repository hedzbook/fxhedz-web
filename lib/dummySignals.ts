
export function generateDummySignals() {

  return {

    XAUUSD: {
      direction: "SELL",
      entry: 2356.40,
      sl: 2374.90,
      tp: 2331.20,
      price: 2352.85,
      lots: 2.80,
      buys: 0,
      sells: 3,
      orders: [
        { id: "x1", direction: "SELL", entry: 2356.40, lots: 1.00, profit: 35.50, time: "10:14:22" },
        { id: "x2", direction: "SELL", entry: 2359.10, lots: 0.90, profit: 56.25, time: "10:22:48" },
        { id: "x3", direction: "SELL", entry: 2361.75, lots: 0.90, profit: 80.10, time: "10:33:11" }
      ]
    },

    BTCUSD: {
      direction: "BUY",
      entry: 64820.00,
      sl: 63600.00,
      tp: 67250.00,
      price: 65240.50,
      lots: 0.85,
      buys: 2,
      sells: 0,
      orders: [
        { id: "b1", direction: "BUY", entry: 64820.00, lots: 0.40, profit: 168.20, time: "09:18:44" },
        { id: "b2", direction: "BUY", entry: 65010.30, lots: 0.45, profit: 103.75, time: "09:41:09" }
      ]
    },

    ETHUSD: {
      direction: "BUY",
      entry: 3482.15,
      sl: 3368.40,
      tp: 3665.90,
      price: 3511.60,
      lots: 3.20,
      buys: 3,
      sells: 0,
      orders: [
        { id: "e1", direction: "BUY", entry: 3482.15, lots: 1.20, profit: 35.30, time: "11:02:18" },
        { id: "e2", direction: "BUY", entry: 3474.90, lots: 1.00, profit: 36.70, time: "11:07:53" },
        { id: "e3", direction: "BUY", entry: 3490.10, lots: 1.00, profit: 21.50, time: "11:16:31" }
      ]
    },

    EURUSD: {
      direction: "SELL",
      entry: 1.0864,
      sl: 1.0932,
      tp: 1.0748,
      price: 1.0841,
      lots: 5.60,
      buys: 1,
      sells: 4,
      orders: [
        { id: "eu1", direction: "SELL", entry: 1.0864, lots: 1.40, profit: 32.20, time: "12:02:14" },
        { id: "eu2", direction: "SELL", entry: 1.0878, lots: 1.50, profit: 55.90, time: "12:05:36" },
        { id: "eu3", direction: "SELL", entry: 1.0859, lots: 1.20, profit: 21.75, time: "12:08:51" },
        { id: "eu4", direction: "BUY", entry: 1.0825, lots: 1.50, profit: -24.60, time: "12:11:09" }
      ]
    },

    GBPUSD: {
      direction: "BUY",
      entry: 1.2745,
      sl: 1.2638,
      tp: 1.2910,
      price: 1.2792,
      lots: 4.10,
      buys: 3,
      sells: 1,
      orders: [
        { id: "gu1", direction: "BUY", entry: 1.2745, lots: 1.50, profit: 70.50, time: "08:45:18" },
        { id: "gu2", direction: "BUY", entry: 1.2762, lots: 1.30, profit: 38.40, time: "09:02:33" },
        { id: "gu3", direction: "SELL", entry: 1.2820, lots: 0.80, profit: -18.60, time: "09:17:11" },
        { id: "gu4", direction: "BUY", entry: 1.2730, lots: 0.50, profit: 31.10, time: "09:29:04" }
      ]
    },

    USDJPY: {
      direction: "SELL",
      entry: 150.82,
      sl: 152.10,
      tp: 148.60,
      price: 150.10,
      lots: 6.75,
      buys: 2,
      sells: 4,
      orders: [
        { id: "uj1", direction: "SELL", entry: 150.82, lots: 2.00, profit: 144.00, time: "07:52:40" },
        { id: "uj2", direction: "SELL", entry: 151.10, lots: 1.80, profit: 180.50, time: "08:06:12" },
        { id: "uj3", direction: "BUY", entry: 149.90, lots: 1.20, profit: 24.80, time: "08:15:21" },
        { id: "uj4", direction: "SELL", entry: 150.45, lots: 1.75, profit: 61.30, time: "08:23:55" }
      ]
    },

    AUDUSD: {
      direction: "BUY",
      entry: 0.6578,
      sl: 0.6489,
      tp: 0.6725,
      price: 0.6604,
      lots: 3.45,
      buys: 2,
      sells: 1,
      orders: [
        { id: "au1", direction: "BUY", entry: 0.6578, lots: 1.40, profit: 36.40, time: "10:11:08" },
        { id: "au2", direction: "SELL", entry: 0.6622, lots: 0.95, profit: -17.60, time: "10:17:45" },
        { id: "au3", direction: "BUY", entry: 0.6559, lots: 1.10, profit: 49.30, time: "10:28:17" }
      ]
    },

    USDCHF: {
      direction: "SELL",
      entry: 0.9026,
      sl: 0.9150,
      tp: 0.8874,
      price: 0.8988,
      lots: 2.95,
      buys: 1,
      sells: 2,
      orders: [
        { id: "uc1", direction: "SELL", entry: 0.9026, lots: 1.10, profit: 41.80, time: "13:05:44" },
        { id: "uc2", direction: "SELL", entry: 0.9051, lots: 1.25, profit: 79.10, time: "13:11:29" },
        { id: "uc3", direction: "BUY", entry: 0.8970, lots: 0.60, profit: 10.80, time: "13:18:02" }
      ]
    },

    USOIL: {
      direction: "BUY",
      entry: 78.40,
      sl: 75.10,
      tp: 83.60,
      price: 79.35,
      lots: 4.60,
      buys: 3,
      sells: 1,
      orders: [
        { id: "o1", direction: "BUY", entry: 78.40, lots: 1.80, profit: 171.00, time: "06:42:13" },
        { id: "o2", direction: "SELL", entry: 80.10, lots: 0.90, profit: -67.50, time: "06:55:47" },
        { id: "o3", direction: "BUY", entry: 77.95, lots: 1.20, profit: 168.00, time: "07:10:25" },
        { id: "o4", direction: "BUY", entry: 78.10, lots: 0.70, profit: 87.50, time: "07:21:38" }
      ]
    }

  }
}
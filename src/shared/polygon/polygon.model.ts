export interface PolygonStockSnapshot {
    day: {
      c: number
      h: number
      l: number
      o: number
      v: number
      vw: number
    }
    lastQuote: {
      P: number
      S: number
      p: number
      s: number
      t: number
    }
    lastTrade: {
      c: number[]
      i: string
      p: number
      s: number
      t: number
      x: number
      e: number
    }
    min: {
      av: number
      c: number
      h: number
      l: number
      o: number
      v: number
      vw: number
    }
    prevDay: {
      c: number
      h: number
      l: number
      o: number
      v: number
      vw: number
    }
    ticker: string
    todaysChange: number
    todaysChangePerc: number
    updated: number
}

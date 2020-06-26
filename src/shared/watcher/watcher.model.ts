export interface Message {
  ev: string
}

export interface ClientMessage {
  event: string
  room: string
  data: any
}


// STOCKS
export interface StockMessage {
  ev: string
  sym: string
}

export interface StockTradeMessage extends StockMessage {
  sym: string
  x: number
  i: string
  z: number
  p: number
  s: number
  c: number[]
  t: number
};

export interface StockAggregateMessage extends StockMessage {
  sym: string
  v: number
  av: number
  op: number
  vw: number
  o: number
  c: number
  h: number
  l: number
  a: number
  s: number
  e: number
}

export interface StockQuoteMessage extends StockMessage {
  sym: string
  bx: string
  bp: number
  bs: number
  ax: string
  ap: number
  as: number
  c: number
  t: number
};

// FOREX



// CRYPTO

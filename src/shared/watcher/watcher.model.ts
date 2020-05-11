export interface StockMessage {
  ev: string
  sym: string
}
export interface StockTradeMessage extends StockMessage {
  x: number
  i: string
  z: number
  p: number
  s: number
  c: number[]
  t: number
};
// // Stocks QUOTE:
// {
//     "ev": "Q",              // Event Type
//     "sym": "MSFT",          // Symbol Ticker
//     "bx": "4",              // Bix Exchange ID
//     "bp": 114.125,          // Bid Price
//     "bs": 100,              // Bid Size
//     "ax": "7",              // Ask Exchange ID
//     "ap": 114.128,          // Ask Price
//     "as": 160,              // Ask Size
//     "c": 0,                 // Quote Condition
//     "t": 1536036818784      // Quote Timestamp ( Unix MS )
// }

export interface StockQuoteMessage extends StockMessage {
  bx: string
  bp: number
  bs: number
  ax: string
  ap: number
  as: number
  c: number
  t: number
};

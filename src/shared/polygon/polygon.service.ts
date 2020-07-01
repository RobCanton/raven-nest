import { Injectable, Inject, HttpService, InternalServerErrorException } from '@nestjs/common';
import { Polygon } from './polygon.model';
import * as rp from 'request-promise';
import axios, { AxiosResponse } from 'axios';

export interface PolygonTickerWrapper {
  symbol: PolygonTicker
}

export interface PolygonTicker {
  symbol: string
}

export interface PolygonStockDetails {
  symbol: string
  name: string
  description: string
}

export interface PolygonStockTrade {
  price: number
  size: number
  exchange: number
  timestamp: number
}

export interface PolygonStockQuote {
  askprice: number
  asksize: number
  askechange: number
  bidprice: number
  bidsize: number
  bidexchange:number
  timestamp: number
}

export interface PolygonStockClose {
  volume: number
  open: number
  close: number
  low: number
  high: number
  symbol: string
}

export interface PolygonAggregateResponse {
  results: PolygonAggregateTick[]
}

export interface PolygonAggregateTick {
  T: string
  v: number
  o: number
  c: number
  h: number
  l: number
  t: number
  n: number
}

export interface MarketStatus {
  market: string
  serverTime: string
}

@Injectable()
export class PolygonService {

  private apiKey: string;
  constructor(@Inject('CONFIG_OPTIONS') private options, private httpService: HttpService) {
    this.apiKey = options.api_key;
  }

  private polygonURI(route:string, params?: Array<[string,string]>) {

    let baseURL = "https://api.polygon.io";
    var paramsStr = `?apiKey=${this.apiKey}`;

    if (params) {
      params.forEach(element => {
        paramsStr += `&${element[0]}=${element[1]}`;
      });
    }

    return `${baseURL}${route}${paramsStr}`;
  }

  private buildURI(route?:string, params?: Array<[string,string]>) {

    let baseURL = "https://api.polygon.io";
    var paramsStr = `?apiKey=${this.apiKey}`;

    if (params) {
      params.forEach(element => {
        paramsStr += `&${element[0]}=${element[1]}`;
      });
    }

    if (route) {
      return `${baseURL}${route}${paramsStr}`;
    } else {
      return `${baseURL}${paramsStr}`;
    }
  }

  private jsonRequest(uri: string) {
    return {
      uri: uri,
      json: true
    }
  }

  async marketStatus(): Promise<MarketStatus> {
    let route = `/v1/marketstatus/now`;
    let uri = this.polygonURI(route);
    return rp(this.jsonRequest(uri));
  }

  async ticker(symbol):Promise<PolygonTicker> {
    let route = `/v1/meta/symbols/${symbol}`;
    let uri = this.polygonURI(route);
    return rp(this.jsonRequest(uri));
  }

  async tickers(searchFragment: string) {
    let route = `/v2/reference/tickers`;

    let params:Array<[string, string]> = [
      ['sort', 'ticker'], ['search', searchFragment]
    ];

    let uri = this.polygonURI(route, params);
    return rp(this.jsonRequest(uri));
  }

  async tickerDetails(ticker: string):Promise<PolygonStockDetails> {
    let route = `/v1/meta/symbols/${ticker}/company`;
    let uri = this.polygonURI(route);
    return rp(this.jsonRequest(uri))
  }

  async stockLastTrade(ticker: string): Promise<PolygonStockTrade> {
    let route = `/v1/last/stocks/${ticker}`;
    let uri = this.polygonURI(route);
    return rp(this.jsonRequest(uri)).then ( results => {
      return results.last;
    }).catch ( e => {
      console.log(e);
      return {}
    })
  }

  async stockLastQuote(ticker: string): Promise<PolygonStockQuote> {
    let route = `/v1/last_quote/stocks/${ticker}`;
    let uri = this.polygonURI(route);
    return rp(this.jsonRequest(uri)).then ( results => {
      return results.last;
    }).catch ( e => {
      console.log(e);
      return {}
    })
  }

  async stockDailyOpenClose(ticker: string, date: string): Promise<PolygonStockClose> {
    let route = `/v1/open-close/${ticker}/${date}`;
    let uri = this.polygonURI(route);
    return rp(this.jsonRequest(uri)).then ( result => {
      return {
        volume: result.volume,
        open: result.open,
        close: result.close,
        low: result.low,
        high: result.high,
        symbol: result.symbol,
      }
    }).catch ( e => {
      console.log(e);
      return {}
    })
  }

  async stockPreviousClose(ticker: string): Promise<PolygonStockClose>  {
    let route = `/v2/aggs/ticker/${ticker}/prev`;
    let uri = this.polygonURI(route);
    return rp(this.jsonRequest(uri)).then ( results => {
      var response = {};
      if (results.results && results.results.length > 0) {
        let result = results.results[0];
        response = {
          volume: result.v,
          open: result.o,
          close: result.c,
          low: result.l,
          high: result.h,
          symbol: result.T,
        }
      }
      return response;

    }).catch (e => {
      console.log(e);
      return {}
    })
  }

  async stockSnapshotSingle(ticker: string): Promise<Polygon.StockSnapshot> {

    let route = `/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}`;
    let uri = this.buildURI(route);
    try {
      let response:AxiosResponse = await axios.get(uri);
      return response.data.ticker;
    } catch (exception) {
      return null;
    }

  }

  async stockAggregates(ticker: string, multiplier: number, timespan:string, from: string, to: string):Promise<PolygonAggregateResponse> {
    let route = `/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${from}/${to}`;
    let uri = this.polygonURI(route);
    return rp(this.jsonRequest(uri));
  }

  async stockExchanges() {
    let route = `/v1/meta/exchanges`;
    let uri = this.polygonURI(route);
    return rp(this.jsonRequest(uri));
  }

  async tickerNews(symbol: string) {
    let route = `/v1/meta/symbols/${symbol}/news`;
    let params:Array<[string, string]> = [
      ['perpage', '5']
    ];
    let uri = this.polygonURI(route);
    return rp(this.jsonRequest(uri));
  }


  // Crypto Market
  async cryptoSnapshotSingle(ticker: string): Promise<Polygon.Crypto.Snapshot> {
    let route = `/v2/snapshot/locale/global/markets/crypto/tickers/${ticker}`;
    let uri = this.buildURI(route);
    try {
      let response:AxiosResponse = await axios.get(uri);
      return response.data.ticker;
    } catch (exception) {
      return null;
    }
  }


  // Forex Market
  async forexSnapshotSingle(ticker: string): Promise<Polygon.Forex.Snapshot> {
    let route = `/v1/conversion/USD/CAD`;
    let params:Array<[string, string]> = [
      ['amount', '1'], ['precision', '2']
    ];
    let uri = this.buildURI(route, params);
    try {
      let response:AxiosResponse = await axios.get(uri);
      return response.data;
    } catch(exception) {
      console.log("exception: ", exception);
      return null;
    }
  }

  async forexLastQuote(from:string, to: string):Promise<Polygon.Forex.Quote> {
    let route = `/v1/last_quote/currencies/${from}/${to}`;
    let uri = this.buildURI(route);
    try {
      let response:AxiosResponse = await axios.get(uri);
      let quoteResponse:Polygon.Forex.QuoteResponse = response.data;
      return quoteResponse.last;
    } catch(exception) {
      console.log("exception: ", exception);
      return null;
    }
  }
}

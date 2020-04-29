import { Injectable, Inject, HttpService, InternalServerErrorException } from '@nestjs/common';
import * as rp from 'request-promise';

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

@Injectable()
export class PolygonService {

  private apiKey: string;
  constructor(@Inject('CONFIG_OPTIONS') private options, private httpService: HttpService) {
    this.apiKey = options.apiKey;
  }

  //private apiKey: string = 'P4GNjFy1Uk0a21ZUhjkNF227Kxoud_57KGRTV4';


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

  private jsonRequest(uri: string) {
    return {
      uri: uri,
      json: true
    }
  }

  async marketStatus() {
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
    console.log(`uri: ${uri}`);
    return rp(this.jsonRequest(uri))
  }

  async stockLastTrade(ticker: string): Promise<PolygonStockTrade> {
    let route = `/v1/last/stocks/${ticker}`;
    let uri = this.polygonURI(route);
    return rp(this.jsonRequest(uri)).then ( results => {
      return results.last;
    }).catch ( e => {
      return {}
    })
  }

  async stockLastQuote(ticker: string): Promise<PolygonStockQuote> {
    let route = `/v1/last_quote/stocks/${ticker}`;
    let uri = this.polygonURI(route);
    return rp(this.jsonRequest(uri)).then ( results => {
      return results.last;
    }).catch ( e => {
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
      return {}
    })
  }

  async stockExchanges() {
    let route = `/v1/meta/exchanges`;
    let uri = this.polygonURI(route);
    return rp(this.jsonRequest(uri));
  }

  /*


exports.historicalTrades = function(symbol, date, limit) {
  let route = `/v2/ticks/stocks/trades/${symbol}/${date}`;
  let params = {
    date: '2020-04-20',
    limit: limit
  }
  let uri = polygonURI(route, params);

  var options = {
    uri: uri,
    json: true
  }

  return rp(options);
}

exports.stockExchanges = function() {
  let route = `/v1/meta/exchanges`;

  let uri = polygonURI(route);

  var options = {
    uri: uri,
    json: true
  }

  return rp(options);
}


  */

}

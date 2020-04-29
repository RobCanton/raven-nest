import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from '../shared/redis/redis.service';
import { PolygonService, PolygonStockDetails, PolygonTickerWrapper, PolygonTicker } from '../shared/polygon/polygon.service';
import { IEXService } from '../shared/iex/iex.service';
import * as promiseReflect from 'promise-reflect';
import * as moment from 'moment';
import 'moment-timezone';

export interface PromiseReflectResult<T> {
  status: string
  data: T
}

export interface StockDetails {
  symbol: string
  name: string
  description: string
  shares: number
}

@Injectable()
export class StockService {

  constructor(
    private readonly redisService: RedisService,
    private readonly polygonService: PolygonService,
    private readonly iexService: IEXService
  ) {}


  async snapshot(symbol: string) {
    var stockDetails;

    let tickerDetailsKey = `ticker_details:${symbol}`;
    let redisDetailsStr = await this.redisService.get(tickerDetailsKey) as string;

    if (redisDetailsStr) {
      stockDetails = JSON.parse(redisDetailsStr);
    } else {
      const polygonStockDetails = await this.polygonService.tickerDetails(symbol);
      const iexStockQuote = await this.iexService.stockQuote(symbol);

      let shares = iexStockQuote.latestPrice / iexStockQuote.marketCap;
      stockDetails = {
        symbol: polygonStockDetails.symbol,
        name: polygonStockDetails.name,
        description: polygonStockDetails.description,
        shares: shares
      };

      let stockDetailsStr = JSON.stringify(stockDetails);
      await this.redisService.set(`ticker_details:${symbol}`, stockDetailsStr);

    }

    const lastTrade = await this.polygonService.stockLastTrade(symbol);
    const lastQuote = await this.polygonService.stockLastQuote(symbol);

    let m = moment().tz('America/New_York');
    console.log(m.format('YYYY-MM-DD'));
    let day = m.day();
    var previousClose;
    if (day >= 5 || day == 0) {
      var diff = 0;
      if (day >= 5) {
        diff = 4 - day;
      } else {
        diff = -3;
      }
      let fetchDate = m.day(diff).format('YYYY-MM-DD');
      console.log(`Previous daily open/close: ${fetchDate}`);
      previousClose = await this.polygonService.stockDailyOpenClose(symbol, fetchDate);
    } else {
      console.log('Previous close');
      previousClose = await this.polygonService.stockPreviousClose(symbol);
    }

    return {
      symbol: symbol,
      details: stockDetails,
      lastTrade: lastTrade,
      lastQuote: lastQuote,
      previousClose: previousClose,
      order: 0
    };
  }

  async polygonEnabledSymbols(symbols:Array<string>) {
    var validSymbols = [];
    var redisPromises = [];

    symbols.forEach( symbol => {
      let checkIsMember = this.redisService.sismember('polygon_enabled', symbol);
      redisPromises.push(checkIsMember);
    })

    let redisCheckResults = await Promise.all(redisPromises);

    var polygonPromises = [];
    for (var i = 0; i < redisCheckResults.length; i++) {
      let symbol = symbols[i];
      if (redisCheckResults[i]) {
        if (!validSymbols.includes(symbol)) {
          validSymbols.push(symbol);
        }
      } else {
        let checkPolygon = this.polygonService.ticker(symbol);
        polygonPromises.push(checkPolygon);
      }
    }

    let polygonCheckResults = await Promise.all(polygonPromises.map(promiseReflect)) as Array<PromiseReflectResult<PolygonTickerWrapper>>;

    var redisSADDPromises = [];

    for (var j = 0; j < polygonCheckResults.length; j++) {
      let result = polygonCheckResults[j];
      if (result.status === 'resolved' && result.data && result.data.symbol && result.data.symbol.symbol) {
        let symbol = result.data.symbol.symbol;
        if (!validSymbols.includes(symbol)) {
          validSymbols.push(symbol);
        }

        let setPolygonEnabled = this.redisService.sadd('polygon_enabled', symbol);
        redisSADDPromises.push(setPolygonEnabled);
      }
    }

    await Promise.all(redisSADDPromises);

    return validSymbols;
  }

  async search(fragment: string) {

    var searchSymbols = [];

    let searchResults = await this.iexService.search(fragment);
    searchResults.forEach( result => {
      if (result.region === 'US') {
        searchSymbols.push(result.symbol);
      }
    })

    let validSymbols = await this.polygonEnabledSymbols(searchSymbols);
    var response = [];
    for (var i = 0; i < searchResults.length; i++) {
      let searchResult = searchResults[i];
      if (validSymbols.includes(searchResult.symbol)) {
        response.push(searchResult);
      }
    }
    return response;
  }

}

import { Logger } from '@nestjs/common';
import { MarketType } from '../../../helpers/market.service';
import { RedisService } from '../../redis/redis.service';
import { Watcher } from './watcher';
import { WatcherDelegate } from '../watcher.service';
import * as Models from '../watcher.model';

export class StocksWatcher extends Watcher {

  constructor(
    delegate: WatcherDelegate,
    apiKey: string,
    redisService: RedisService) {

    super(MarketType.stocks, delegate, apiKey, redisService);
  }

  handleMessage(msg: Models.Message) {
    if (msg == undefined || msg == null) {
      return;
    }

    this.logger.log(`Message [${msg}]`);

    switch (msg.ev) {
      case "T":
      let trade = msg as Models.StockTradeMessage;
      this.delegate.sendMessage(msg.ev, trade.sym, trade);
      break;
      case "Q":
      let quote = msg as Models.StockQuoteMessage;
      this.delegate.sendMessage(msg.ev, quote.sym, quote);
      break;
      case "A":
      let aggregate = msg as Models.StockAggregateMessage;
      this.delegate.sendMessage(msg.ev, aggregate.sym, aggregate);
      break;
      default:
      break;
    }
  }

  subscribeTo(symbol: string) {
    this.sendWebsocketMessage(`{"action":"subscribe","params":"Q.${symbol},T.${symbol},A.${symbol}"}`);
  }

  async unsubscribeFrom(symbol: string) {
    try {
      let results = await this.redisService.hgetall(`stocks_watchers:${symbol}`) as string[];
      if (results) {
        console.log(`still results`);
        this.logger.log(`Remain subscribed to ${symbol}: other watchers`);
        return;
      } else {
        console.log(`no results`);
        this.logger.log(`Unsubscribe from ${symbol}`);
        this.sendWebsocketMessage(`{"action":"unsubscribe","params":"Q.${symbol},T.${symbol},A.${symbol}"}`);
        await this.redisService.srem('stocks_watchlist', symbol);
      }
    } catch (error) {
      console.log(error);
      return;
    }
  }


}

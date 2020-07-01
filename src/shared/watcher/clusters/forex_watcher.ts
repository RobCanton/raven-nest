import { Logger } from '@nestjs/common';
import { MarketType } from '../../market/market.model';
import { MarketService } from '../../market/market.service';
import { RedisService } from '../../redis/redis.service';
import { Watcher } from './watcher';
import { WatcherDelegate } from '../watcher.service';
import { Message, ForexQuoteMessage, ForexAggregateMessage } from '../watcher.model';

export class ForexWatcher extends Watcher {

  constructor(
    delegate: WatcherDelegate,
    apiKey: string,
    marketService:MarketService,
    redisService: RedisService) {

    super(MarketType.forex, delegate, apiKey, marketService, redisService);
  }

  handleMessage(msg: Message) {
    if (msg == undefined || msg == null) {
      return;
    }

    switch (msg.ev) {
      case "C":
      let quote = msg as ForexQuoteMessage;
      console.log("Forex: %j", quote);
      this.delegate.sendMessage(msg.ev, quote.p, quote);
      break;
      let aggregate = msg as ForexAggregateMessage;
      this.delegate.sendMessage(msg.ev, aggregate.pair, aggregate);
      break;
      default:
      break;
    }
  }

  async subscribeTo(symbol: string) {
    let socketSymbol = await this.marketService.socketSymbol(symbol);
    this.sendWebsocketMessage(`{"action":"subscribe","params":"C.${socketSymbol},CA.${socketSymbol}"}`);
  }

  async unsubscribeFrom(symbol: string) {
    let socketSymbol = await this.marketService.socketSymbol(symbol);
    try {
      let results = await this.redisService.hgetall(`${this.marketType}_watchers:${symbol}`) as string[];
      if (results) {
        this.logger.log(`Remain subscribed to ${symbol}: other watchers`);
        return;
      } else {
        this.logger.log(`Unsubscribe from ${symbol}`);
        this.sendWebsocketMessage(`{"action":"unsubscribe","params":"C.${socketSymbol},CA.${socketSymbol}"}`);
        await this.redisService.srem(`${this.marketType}_watchlist`, symbol);
      }
    } catch (error) {
      console.log(error);
      return;
    }
  }


}

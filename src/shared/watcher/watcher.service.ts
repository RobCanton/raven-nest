import { Injectable, Inject, HttpService, InternalServerErrorException } from '@nestjs/common';
import { WatcherGateway } from './watcher.gateway';
import { StockMessage, StockTradeMessage, StockQuoteMessage } from './watcher.model';
import { RedisService } from '../redis/redis.service';
import * as WebSocket from "ws"


@Injectable()
export class WatcherService {

  private ws;

  constructor(@Inject('CONFIG_OPTIONS') private options,
    private readonly watcherGateway: WatcherGateway,
    private readonly redisService: RedisService) {

    this.ws = new WebSocket('wss://socket.polygon.io/stocks');

    // Connection Opened:
    this.ws.on('open', async () => {
      console.log('Connected!');
      this.ws.send(`{"action":"auth","params":"${this.options.api_key}"}`);

      let results = await this.redisService.smembers("watchlist") as string[];
      results.forEach( symbol => {
        this.subscribeTo(symbol);
      })
    })

    this.ws.on('message', (data) => {
      data = JSON.parse(data)
      data.map((msg) => {
        if (msg.ev === 'status') {
          return console.log('Status Update:', msg.message)
        }

        let stock = msg as StockMessage;

        switch (stock.ev) {
          case "T":
          let trade = msg as StockTradeMessage;
          this.handleStockTradeMessage(trade);
          break
          case "Q":
          let quote = msg as StockQuoteMessage;
          this.handleStockQuoteMessage(quote);
          break
          default:
          break
        }

      })
    })

  }

  private handleStockTradeMessage(message:StockTradeMessage) {
    this.watcherGateway.sendStockTradeMessage(message)
  }

  private handleStockQuoteMessage(message:StockQuoteMessage) {
    this.watcherGateway.sendStockQuoteMessage(message)
  }

  subscribeTo(symbol:String) {
    this.ws.send(`{"action":"subscribe","params":"Q.${symbol},T.${symbol}"}`);
  }

  async unsubscribeFrom(symbol:String) {
    try {
      let results = await this.redisService.hgetall(`watchers:${symbol}`) as string[];
      if (results) {
        console.log(`still results`);
        return;
      } else {
        console.log(`no results`);
        this.ws.send(`{"action":"unsubscribe","params":"Q.${symbol},T.${symbol}"}`);
        await this.redisService.srem('watchlist', symbol);
      }
    } catch (exception) {
      console.log(exception);
      return;
    }



  }


}

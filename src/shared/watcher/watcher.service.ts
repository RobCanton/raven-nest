import { Injectable, Inject, HttpService, InternalServerErrorException, Logger } from '@nestjs/common';
import { WatcherGateway } from './watcher.gateway';
import { ClientMessage, StockMessage, StockTradeMessage, StockQuoteMessage, StockAggregateMessage } from './watcher.model';
import { RedisService } from '../redis/redis.service';
import { AlertService } from '../../helpers/alert.service';

import { StocksWatcher} from './clusters/stocks_watcher';
import * as WebSocket from "ws"



export interface WatcherDelegate {
  sendMessage(ev: string, symbol: string, data: any): void
}

@Injectable()
export class WatcherService {

  private logger: Logger = new Logger('WatcherService');
  // private ws;
  // private api_key;
  // private POLYGON_SOCKET_URL = "wss://socket.polygon.io/stocks";
  // private isConnectionAlive = false;

  private stocksWatcher: StocksWatcher;


  constructor(@Inject('CONFIG_OPTIONS') private options,
    private readonly watcherGateway: WatcherGateway,
    private readonly redisService: RedisService,
    private readonly alertService: AlertService) {

    //this.api_key = this.options.api_key;
    //this.ws = new WebSocket(this.POLYGON_SOCKET_URL);

    this.stocksWatcher = new StocksWatcher(this, this.options.api_key, redisService);

    // Connection Opened:
    //this.websocketConnect();
    //this.websocketOnMessage();

  }

  // private websocketConnect() {
  //   this.ws.on('open', async () => {
  //     this.isConnectionAlive = true;
  //     this.logger.log(`Connected to ${this.POLYGON_SOCKET_URL}`);
  //
  //     this.ws.send(`{"action":"auth","params":"${this.api_key}"}`);
  //
  //     let results = await this.redisService.smembers("stocks_watchlist") as string[];
  //     results.forEach( symbol => {
  //       this.subscribeTo(symbol);
  //     })
  //
  //   })
  //
  //   this.ws.on('pong', () => {
  //     this.logger.log(`Connection is alive: ${this.isConnectionAlive}`);
  //   })
  //
  //   this.ws.on('close', function close() {
  //     this.isConnectionAlive = false;
  //     if (this.logger) {
  //       this.logger.log(`Disconnected from ${this.POLYGON_SOCKET_URL}`);
  //     }
  //     this.websocketConnect();
  //   });
  //
  // }

  keepAlive() {
    // if (this.isConnectionAlive) {
    //     this.ws.ping();
    // }
    this.stocksWatcher.ping();
  }

  // private websocketOnMessage() {
  //   this.ws.on('message', (data) => {
  //     data = JSON.parse(data)
  //     data.map((msg) => {
  //       if (msg.ev === 'status') {
  //         this.logger.log(`StocksCluster [${msg.message}]`);
  //         return
  //       }
  //
  //       let stock = msg as StockMessage;
  //       switch (stock.ev) {
  //         case "T":
  //
  //         let trade = msg as StockTradeMessage;
  //         this.handleStockTradeMessage(trade);
  //         break
  //         case "Q":
  //         let quote = msg as StockQuoteMessage;
  //         this.handleStockQuoteMessage(quote);
  //         break
  //         case "A":
  //         let aggregate = msg as StockAggregateMessage;
  //         this.handleStockAggregateMessage(aggregate);
  //         break
  //         default:
  //         break
  //       }
  //
  //     })
  //   })
  // }

  private handleStockTradeMessage(message:StockTradeMessage) {
    this.watcherGateway.sendStockTradeMessage(message);
  }

  private handleStockQuoteMessage(message:StockQuoteMessage) {
    this.watcherGateway.sendStockQuoteMessage(message);
  }

  private handleStockAggregateMessage(message:StockAggregateMessage) {
    this.alertService.consumeAggregateMessage(message);
  }

  subscribeTo(symbol: string) {
    this.stocksWatcher.subscribeTo(symbol);
  }

  async unsubscribeFrom(symbol: string) {
    this.stocksWatcher.unsubscribeFrom(symbol);
  }

  async unwatchList(listKey: string) {
    /*
    let list = await this.redisService.lrange(listKey, 0 , -1) as string[];
    console.log("list: ", list);
    var unwatchPromises = [];
    var unsubscribePromises = [];

    list.forEach( symbol => {
      let unwatch = this.redisService.hdel(`stocks_watchers:${symbol}`, listKey);
      unwatchPromises.push(unwatch);

      let unsubscribe = this.unsubscribeFrom(symbol);
      unsubscribePromises.push(unsubscribe);
    })

    await Promise.all(unwatchPromises);
    await Promise.all(unsubscribePromises);
    await this.redisService.del(listKey);
    */
  }

  sendMessage(ev: string, symbol: string, data: any) {
    console.log(`Delegate: ${symbol}`);
    let message:ClientMessage = {
      event: `${ev}.${symbol}`,
      room: symbol,
      data: data
    }
    this.watcherGateway.sendMessage(message);
  }

}

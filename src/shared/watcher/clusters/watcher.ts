import { Logger } from '@nestjs/common';
import { MarketType } from '../../../helpers/market.service';
import { RedisService } from '../../redis/redis.service';
import { WatcherDelegate } from '../watcher.service';
import * as Models from '../watcher.model';
import * as WebSocket from "ws"

export abstract class Watcher {

    private marketType: MarketType;
    protected delegate: WatcherDelegate;
    protected logger: Logger;

    private ws;
    private apiKey;
    private socketURL;
    private isConnectionAlive = false;

    constructor(
      marketType: MarketType,
      delegate: WatcherDelegate,
      apiKey: string,
      protected readonly redisService: RedisService
    ) {
      this.delegate = delegate;
      this.marketType = marketType;
      this.logger = new Logger(`WatcherService ${marketType}`);
      this.socketURL = `wss://socket.polygon.io/${marketType}`;

      this.apiKey = apiKey;

      // Connection Opened:
      this.websocketConnect();
      // /this.websocketOnMessage();

    }

    websocketConnect() {
      this.ws = new WebSocket(this.socketURL);
      this.ws.on('open', async () => {
        this.isConnectionAlive = true;
        this.logger.log(`Connected to ${this.socketURL}`);

        this.ws.send(`{"action":"auth","params":"${this.apiKey}"}`);

        let results = await this.redisService.smembers(`${this.marketType}_watchlist`) as string[];
        results.forEach( symbol => {
          this.subscribeTo(symbol);
        })

      })

      this.ws.on('pong', () => {
        this.logger.log(`Connection is alive: ${this.isConnectionAlive}`);
      })

      this.ws.on('close', function close() {
        this.isConnectionAlive = false;
        if (this.logger) {
          this.logger.log(`Disconnected from ${this.socketURL}`);
        }
        this.websocketConnect();
      });

      this.ws.on('message', (data) => {
        data = JSON.parse(data)
        data.map((msg) => {
          if (msg.ev === 'status') {
            this.logger.log(`Message [${msg.message}]`);
            return;
          }

          this.handleMessage(msg as Models.Message);
        })
      })

    }

    ping() {
      if (this.isConnectionAlive) {
        this.ws.ping();
      }
    }

    sendWebsocketMessage(message:string) {
      this.ws.send(message);
    }

    abstract handleMessage(message: any): void

    abstract subscribeTo(symbol: string): void

    abstract unsubscribeFrom(symbol: string): void
}

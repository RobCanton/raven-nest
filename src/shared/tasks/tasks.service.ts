import { Injectable, Logger } from '@nestjs/common';
import { Cron, Interval, Timeout, NestSchedule, defaults } from '@proscom/nestjs-schedule';
import { RedisService } from '../redis/redis.service';
import { AlertService } from '../../helpers/alert.service';
import { StockService } from '../../helpers/stock.service';
import { WatcherGateway } from '../watcher/watcher.gateway';
import { WatcherService } from '../watcher/watcher.service';
import { IEXService, IEXStockQuote } from '../iex/iex.service';


@Injectable()
export class TasksService extends NestSchedule {

  private readonly logger = new Logger('TasksService');

  constructor(
    private readonly redisService: RedisService,
    private readonly alertService: AlertService,
    private readonly stockService: StockService,
    private readonly iexService: IEXService,
    private readonly watcherGateway: WatcherGateway,
    private readonly watcherService: WatcherService
  ) {
    super();

    this.alertsResetter();
    this.checkMarketStatus();
  }

  // Called every 10 seconds
  async resetAlert(alertID: string) {
    let alertStr = await this.redisService.get(`alerts:${alertID}`) as string;
    if (!alertStr) {
      await this.redisService.zrem(`fired_alerts`, alertID);
      return {}
    }

    this.logger.log(`Reset alert: ${alertID}`);

    let alert = JSON.parse(alertStr);
    let alertSuffix = this.alertService.alertSuffix(alert.t, alert.c);

    if (!alertSuffix) {
      return {
        success: false
      }
    }

    await this.redisService.zadd(`alerts_${alertSuffix}:${alert.s}`, alert.v, alertID);
    await this.redisService.zrem(`fired_alerts`, alertID);

    return {}

  }
  @Interval(10000)
  async alertsResetter() {
    this.logger.log(`Check alerts...`);
    let alertsForReset = await this.redisService.zrangebyscore(`fired_alerts`, 0, Date.now()) as Array<string>;

    var promises = [];
    alertsForReset.forEach( alertID => {
      promises.push(this.resetAlert(alertID));
    })

    return Promise.all(promises);

  }

  @Interval(10000)
  watcherKeepAlive() {
    this.watcherService.keepAlive();
  }

  @Cron('0 * 1-21 * * 0-5', {
    tz: 'America/New_York',
  })
  async checkMarketStatus() {
    let status = await this.stockService.marketStatus() as string;
    this.logger.log(`Market status: ${status}`);
    await this.redisService.set('market-status', status);
    this.watcherGateway.sendMarketStatus(status);
  }

  // @Cron('* * * * * *', {
  //   tz: 'America/New_York'
  // })
  async updateMostActiveStocks() {
    let mostActiveStocksKey = 'list:mostactivestocks';
    await this.watcherService.unwatchList(mostActiveStocksKey);

    let mostActiveStocks = await this.iexService.listMostActive() as IEXStockQuote[];
    var mostActiveStockSymbols:string[] = ['AAPL', 'AMZN', 'ROKU', 'NFLX'];
    // mostActiveStocks.forEach( stock => {
    //   mostActiveStockSymbols.push(stock.symbol);
    // })

    let mostActiveStocksPE = await this.stockService.polygonEnabledSymbols(mostActiveStockSymbols);
    this.logger.log(`mostActiveStocks: ${mostActiveStocksPE}`);

    await this.redisService.rpushMultiple(mostActiveStocksKey, mostActiveStocksPE);

    var promises = [];
    mostActiveStocksPE.forEach( symbol => {
      let addWatcher = this.redisService.hset(`watchers:${symbol}`, mostActiveStocksKey, true);
      let addToWatchlist = this.redisService.sadd(`watchlist`, symbol);

      promises.push(addWatcher);
      promises.push(addToWatchlist);

    })

    await Promise.all(promises);

    mostActiveStocksPE.forEach( symbol => {
      this.watcherService.subscribeTo(symbol);
    })

    //this.redisService.publish('watchlist:add', symbol);


  }



}

import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from '../../shared/redis/redis.service';
import { PolygonService } from '../../shared/polygon/polygon.service';
import { StockService } from '../../helpers/stock.service';
import { v4 as uuid } from 'uuid';

export interface MarketStatus {
  market: string
}

@Injectable()
export class UserService {

  constructor(
    private readonly stockService: StockService,
    private readonly redisService: RedisService,
    private readonly polygonService: PolygonService
  ) {}

  async watchlist(uid: string) {
    let results = await this.redisService.lrange(`user_watchlist:${uid}`, 0 , -1) as Array<string>;

    var promises = [];

    results.forEach( symbol => {
      promises.push(this.stockService.snapshot(symbol));
    })

    let response = await Promise.all(promises);

    let alerts = await this.getAlerts(uid);

    return {
      stocks: response,
      alerts: alerts
    };
  }

  async subscribe(uid: string, symbol:string) {
    console.log(`User ${uid} subscribe to ${symbol}`);

    await this.redisService.hset(`watchers:${symbol}`, uid, true);
    await this.redisService.rpush(`user_watchlist:${uid}`, symbol);
    await this.redisService.sadd(`watchlist`, symbol);

    this.redisService.publish('watchlist:add', symbol);

    let snapshot = await this.stockService.snapshot(symbol);

    return snapshot;

  }

  async unsubscribe(uid: string, symbol:string) {
    console.log(`User ${uid} unsubscribe from ${symbol}`);

    // Remove user from watchers & symbol from user watchlist
    await this.redisService.hdel(`watchers:${symbol}`, uid);
    await this.redisService.srem(`user_watchlist:${uid}`, symbol);

    // Lookup if symbol has any other watchers

    this.redisService.publish('watchlist:rem', symbol);


    /*
    let watchers = await this.redisService.hgetall(`watchers:${symbol}`);

    if (watchers) {
      console.log(`${symbol} still has watchers`);
    } else {
      console.log(`${symbol} has no watchers`);
      await this.redisService.srem(`watchlist`, symbol);
    }*/

    return {
      unsubscribed: true
    }

  }

  async getPushToken(uid: string) {
    let response = await this.redisService.hget('pushtokens', uid);
    return response;

  }


  async registerPushToken(uid: string, token: string) {
    await this.redisService.hset('pushtokens', uid, token);

    return {
      success: true
    }

  }

  async stockSnapshot(symbol: string) {
    let response = await this.stockService.snapshot(symbol);
    return response;
  }

  async getAlerts(uid: string) {
    let alertHashKeys = await this.redisService.smembers(`alerts:${uid}`) as Array<string>;

    var alertPromises = [];
    var alertSymbols = [];
    var alertIDs = [];
    alertHashKeys.forEach( key => {
      let split = key.split(':');
      let symbol = split[0];
      let alertID = split[1];
      alertPromises.push(this.redisService.hget(`alerts:${symbol}`, alertID));
      alertSymbols.push(symbol);
      alertIDs.push(alertID);
    })

    let alertStrs = await Promise.all(alertPromises);
    var alerts = [];

    for (var i = 0; i < alertStrs.length; i++) {
      let alertStr = alertStrs[i];
      let _alert = JSON.parse(alertStr);
      let alert = {
        id: alertIDs[i],
        type: parseInt(_alert.t),
        condition: parseInt(_alert.c),
        value: Number(_alert.v),
        symbol: alertSymbols[i],
        timestamp: _alert.d
      }

      alerts.push(alert);
    }
    return alerts;
  }

  async createAlert(
    uid:string,
    symbol: string,
    type: number,
    condition: number,
    value: number) {

    let alertKey = uuid();

    console.log(`createAlert: ${alertKey}`);

    let timestamp = Date.now();
    let alertObj = {
      t: type,
      c: condition,
      v: value,
      f: 0,
      u: uid,
      d: timestamp
    }

    console.log('alertObj: %j', alertObj);
    let hashKey = `alerts:${symbol}`;
    // TODO: replace with fast json
    let alertData = JSON.stringify(alertObj);

    /*
    let r = await this.redisService.hset(hashKey, alertKey, alertData);

    let userAlertsKey = `alerts:${uid}`;
    let symbolAlertKey = `${symbol}:${alertKey}`;
    await this.redisService.sadd(userAlertsKey, symbolAlertKey);
    */
    return {
      id: alertKey,
      type: Math.floor(type),
      condition: Math.floor(condition),
      value: Number(value),
      symbol: symbol,
      timestamp: timestamp
    }
  }

  async deleteAlert(uid: string) {
    return {
      success: true
    }
  }


}

import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from '../shared/redis/redis.service';
import * as promiseReflect from 'promise-reflect';

export interface Alert {
  s: string
  t: number
  c: number
  v: number
  d: number
  u: string
  e: number
  r: number
}
@Injectable()
export class AlertService {

  constructor(
    private readonly redisService: RedisService
  ) {}


  alertSuffix(type: number, condition: number) {
    var alertSuffix;
    switch (type) {
      case 1:
      switch (condition) {
        case 1:
        alertSuffix = 'price_over';
        break
        case 2:
        alertSuffix = 'price_under';
        break
      }
      break
      default:
      break
    }

    return alertSuffix;

  }

  notificationPayload(symbol: string, type: number, condition: number, value: number, price: number) {
    var payload = {
      title: "",
      body: ""
    }
    switch (type) {
      case 1:
      switch (condition) {
        case 1:
        payload.title = `${symbol} Alert`;
        payload.body = `${price} - Price is above ${value}`;
        break
        case 2:
        payload.title = `${symbol} Alert`;
        payload.body = `${price} - Price is below ${value}`;
        break
      }
      break
      default:
      break
    }
    return payload;
  }


  resetTime(resetOption: number):number {
    let now = Date.now();
    switch (resetOption) {
      case 0:
        return undefined;
      case 1:
        return now + 1000 * 60
      case 2:
        return now + 1000 * 60 * 5
      case 3:
        return now + 1000 * 60 * 15
      case 4:
        return now + 1000 * 60 * 30
      case 5:
        return now + 1000 * 60 * 60
      case 6:
        return now;
      default:
        return now;
    }
  }

}

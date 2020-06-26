import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { RedisService } from '../shared/redis/redis.service';
import { PolygonService } from '../shared/polygon/polygon.service';
import { IEXService } from '../shared/iex/iex.service';
import * as promiseReflect from 'promise-reflect';
import * as moment from 'moment';
import 'moment-timezone';

export interface PromiseReflectResult<T> {
  status: string
  data: T
}

export enum MarketType {
  stocks = "stocks",
  forex = "forex",
  crypto = "crypto"
}

@Injectable()
export class MarketService {

  private logger: Logger = new Logger('MarketService');

  constructor(
    private readonly redisService: RedisService,
    private readonly polygonService: PolygonService,
    private readonly iexService: IEXService
  ) {}

  typeForSymbol(symbol: string): MarketType {
    if (symbol.startsWith("C:")) {
      return MarketType.forex;
    } else if (symbol.startsWith("X:")) {
      return MarketType.crypto;
    } else {
      return MarketType.stocks;
    }
  }



}

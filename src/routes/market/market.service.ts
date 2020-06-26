import { Injectable, NotFoundException } from '@nestjs/common';
import { StockService, PromiseReflectResult } from '../../helpers/stock.service';
import { RedisService } from '../../shared/redis/redis.service';
import * as promiseReflect from 'promise-reflect';

@Injectable()
export class MarketService {

  constructor(private readonly redisService:RedisService,
    private readonly stockService:StockService) {

  }

  async getAllMarketData() {
    let mostActiveStocks = await this.getMostActiveStocks();



    return {
      lists: {
        mostActiveStocks: mostActiveStocks
      }
    }
  }

  async getMostActiveStocks() {
    let mostActiveStocks = ['UAL', 'BAC', 'RCL', 'CCL', 'BA'];//await this.redisService.lrange(`list:mostactivestocks`, 0 , -1) as string[];
    var promises_mostActiveStockSnapshots = [];
    mostActiveStocks.forEach( symbol => {
      console.log("snapshot for symbol: ", symbol);
      promises_mostActiveStockSnapshots.push(this.stockService.snapshot(symbol));
    })

    let mostActiveStockSnapshots = await Promise.all(promises_mostActiveStockSnapshots);
    let mostActiveStockReflections = await Promise.all(promises_mostActiveStockSnapshots.map(promiseReflect)) as Array<PromiseReflectResult<any>>;
    var results = [];
    mostActiveStockReflections.forEach( data => {
      results.push(data.data);
    })
    return results;
  }

}

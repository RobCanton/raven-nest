import { Module } from '@nestjs/common';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { StockService } from '../../helpers/stock.service';

@Module({
  controllers: [MarketController],
  providers: [MarketService, StockService]
})
export class MarketModule {
  /*configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(UserController);
  }*/
}

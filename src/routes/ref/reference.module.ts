import { Module } from '@nestjs/common';
import { ReferenceController } from './reference.controller';
import { ReferenceService } from './reference.service';
import { StockService } from '../../helpers/stock.service';
import { AlgoliaService } from '../../shared/algolia/algolia.service';

@Module({
  controllers: [ReferenceController],
  providers: [ReferenceService, StockService, AlgoliaService]
})
export class ReferenceModule {
  /*configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(UserController);
  }*/
}

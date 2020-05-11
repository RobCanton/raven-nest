import { Module, MiddlewareConsumer } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { StockService } from '../../helpers/stock.service';
import { AlertService } from '../../helpers/alert.service';
import { AuthMiddleware } from '../../middleware/auth/auth.middleware';

@Module({
  controllers: [UserController],
  providers: [UserService, StockService, AlertService]
})
export class UserModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(UserController);
  }
}

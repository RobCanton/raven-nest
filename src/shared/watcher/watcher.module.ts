import { Module, DynamicModule, Global, HttpModule } from '@nestjs/common';
import { WatcherService } from './watcher.service';
import { WatcherGateway } from './watcher.gateway';
import { AlertService } from '../../helpers/alert.service'
//import { StocksWatcherService } from './clusters/stocks_watcher.service';

@Global()
@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [WatcherGateway, AlertService]
})
export class WatcherModule {
  static register(options): DynamicModule {
    return {
      module: WatcherModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        WatcherService
      ],
      exports: [WatcherService],
    };
  }
}

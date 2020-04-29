import { Injectable, NotFoundException } from '@nestjs/common';
import { IEXService } from '../../shared/iex/iex.service';
import { StockService } from '../../helpers/stock.service';

@Injectable()
export class ReferenceService {

  constructor(
    private readonly iexService: IEXService,
    private readonly stockService: StockService
  ) {}

  async search(fragment: string) {
    let results = await this.stockService.search(fragment);
    return results;
  }

  async polygonEnabled(symbols: Array<string>) {
    let results = await this.stockService.polygonEnabledSymbols(symbols);
    return results;
  }
}

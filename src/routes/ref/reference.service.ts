import { Injectable, NotFoundException } from '@nestjs/common';
import { IEXService } from '../../shared/iex/iex.service';
import { StockService } from '../../helpers/stock.service';
import { PolygonService } from '../../shared/polygon/polygon.service';
import { AlgoliaService } from '../../shared/algolia/algolia.service';

@Injectable()
export class ReferenceService {

  constructor(
    private readonly iexService: IEXService,
    private readonly stockService: StockService,
    private readonly polygonService: PolygonService,
    private readonly algoliaService: AlgoliaService
  ) {}

  async search(fragment: string) {
    let results = await this.stockService.search(fragment);
    return results;
  }

  async searchCrypto(fragment: string) {
    let results = await this.algoliaService.search(fragment);
    return results;
  }

  async polygonEnabled(symbols: Array<string>) {
    let results = await this.stockService.polygonEnabledSymbols(symbols);
    return results;
  }

  async getNews(symbol: string) {
    let results = await this.iexService.news(symbol);
    console.log("results for " + symbol + " : %j", results);
    return results;
  }
}

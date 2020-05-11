import { Injectable, NotFoundException } from '@nestjs/common';
import algoliasearch from 'algoliasearch';
import axios from 'axios';

@Injectable()
export class AlgoliaService {

  private client;
  private cryptoIndex;

  constructor() {
    this.client = algoliasearch('J0PSFDMNOG', '8f13a38771fa3311cf44714087746885');
    this.cryptoIndex = this.client.initIndex('Crypto');
  }

  async search(fragment: string) {
    let hits = await this.cryptoIndex.search(fragment);
    return hits;
  }

}

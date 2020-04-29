import { Controller, Get, Post, Patch, Delete, Body, Param, Req } from '@nestjs/common';
import { ReferenceService } from './reference.service';

@Controller('ref')
export class ReferenceController {
  constructor(private readonly referenceService: ReferenceService) {}


  @Get()
  getStatus() {
    return { status: 'reference' }
  }

  @Get('/search/:fragment')
  async search(@Param('fragment') fragment: string) {
    let response = await this.referenceService.search(fragment);
    return response;
  }

  @Post('/polygon-enabled')
  async polygonEnabled(@Body('symbols') symbols: Array<string>) {
    console.log(`check polygon enabled: ${symbols}`)
    let response = await this.referenceService.polygonEnabled(symbols);
    return response;
  }
}
/*
function(req, res) {
  let fragment = req.query.fragment;

  var searchResults = [];
  var searchSymbols = [];

  var validSymbols = {};

  return iexAPI.search(fragment).then(_searchResults => {

    searchResults = _searchResults;

    _searchResults.forEach(result => {
      if (result.region === 'US') {
        searchSymbols.push(result.symbol);
      }
    })

    return getPolygonEnabledSymbols(searchSymbols);
  }).then(validSymbols => {
    var response = [];

    for (var k = 0; k < searchResults.length; k++) {
      let searchResult = searchResults[k];
      if (validSymbols[searchResult.symbol]) {
        response.push(searchResult);
      }
    }
    console.log("validSymbols: ", validSymbols);
    return res.send(response);
  })
}*/








function getStockSnapshot(ticker) {
  return new Promise((resolve, reject) => {
    let tickerDetailsKey = `ticker_details:${ticker}`;
    var snapshot = {
      symbol: ticker
    };
    return redisClient.get(tickerDetailsKey).then(details => {
      if (details) {
        snapshot.details = JSON.parse(details);
        return Promise.resolve();
      }

      let promises = [
        polygonAPI.tickerDetails(ticker),
        iexAPI.stockQuote(ticker)
      ]
      return Promise.all(promises);

    }).then(results => {
      if (results === undefined) {
        return Promise.resolve();
      }

      var details = results[0];
      let iexQuote = results[1];

      if (details && iexQuote) {
        snapshot.details = details;

        let marketCap = iexQuote.marketCap;
        let latestPrice = iexQuote.latestPrice;

        details.shares = marketCap / latestPrice;

        let detailsStr = JSON.stringify(details);
        return redisClient.set(`ticker_details:${ticker}`, detailsStr);
      } else {
        return Promise.reject("Missing data");
      }

      return Promise.resolve();
    }).then(() => {

      var getPreviousClose;
      let m = moment().tz('America/New_York');
      let day = m.day();
      if (day >= 5 || day == 0) {
        var diff = 0;
        if (day >= 5) {
          diff = 4 - day;
        } else {
          diff = -3;
        }

        let fetchDate = m.day(diff).format('YYYY-MM-DD');
        console.log("Fetch specific date: ", fetchDate);
        getPreviousClose = polygonAPI.stockDailyOpenClose(ticker, fetchDate);

      } else {
        console.log("Use previous close");
        getPreviousClose = polygonAPI.stockPreviousClose(ticker);

      }

      let promises = [
        polygonAPI.stockLastTrade(ticker),
        polygonAPI.stockLastQuote(ticker),
        getPreviousClose
        //        polygonAPI.stockFinancials(ticker)
      ];
      return Promise.all(promises);
    }).then(results => {

      if (results[0]) {
        if (results[0].last) {
          snapshot.lastTrade = results[0].last;
        }
      }

      if (results[1]) {
        if (results[1].last) {
          snapshot.lastQuote = results[1].last;
        }
      }

      if (results[2]) {
        snapshot.previousClose = results[2];
      }

      if (results[3]) {
        if (results[3].results) {
          if (results[3].results.length > 0) {
            snapshot.financials = results[3].results[0];
          }
        }
      }

      return resolve(snapshot);
    }).catch(e => {
      console.log("Error: ", e);
      return reject(e);
    })
  });
}

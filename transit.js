const client = require('cheerio-httpcli')
exports.fetchTransitInfo = (stationFrom, stationTo) => {
  return client.fetch('https://transit.yahoo.co.jp/')
    .then((result) => {
      result.$('#sfrom').val(stationFrom)
      result.$('#sto').val(stationTo)
      return result.$('#searchModuleSubmit').click()
    })
    .then((result) => {
      const $routeDetail = result.$('.routeDetail').first()
      const distance     = result.$('.distance').first().text()
      const fare         = result.$('.fare').first().text()
      const transport = $routeDetail.find('.transport')
                        .text()
                        .split(/\r\n|\r|\n/)
                        .filter((line) => line.indexOf('[train]') >= 0 || line.indexOf('[bus]') >= 0)[0]
                        .split(/\[.+\]/)[1];
      const startTime = $routeDetail.find('.time li').first().text()
      const arrivalTime = $routeDetail.find('.time li').last().text()
      return {
        distance,
        fare,
        startTime,
        arrivalTime,
        transport
      }
    })
}

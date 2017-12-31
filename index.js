const client = require('cheerio-httpcli')

client.fetch('https://transit.yahoo.co.jp/')
  .then((result) => {
    result.$('#sfrom').val('曳舟駅')
    result.$('#sto').val('渋谷駅')
    return result.$('#searchModuleSubmit').click()
  })
  .then((result) => {
    const $routeDetail = result.$('.routeDetail').first()
    const transport = $routeDetail.find('.transport').text().split('[train]')[1].trim()
    const startTime = $routeDetail.find('.time li').first().text()
    const arrivalTime = $routeDetail.find('.time li').last().text()
    console.log({
      startTime,
      arrivalTime,
      transport
    })
  })

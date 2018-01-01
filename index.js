const Alexa   = require('alexa-sdk');
const transit = require('./transit.js')

exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context);
  alexa.registerHandlers(firstHandlers, secondHandlers);
  alexa.execute();
};

const makeTransitMessage = (stationFrom, stationTo, transitInfo) => {
  const msg = `
    ${transitInfo.startTime}に${stationFrom}に到着する、
    ${transitInfo.transport}に乗車すると、${transitInfo.arrivalTime}に
    ${stationTo}に到着します。
    運賃は${transitInfo.fare}で、${transitInfo.transfer}回の乗り換えがあります。
  `
  return msg.replace('行に', 'ゆきに')
            .replace('0回の乗り換えがあります。', '乗り換えはありません。')
}

/**
 * 初回のハンドラ
 */
const firstHandlers = {
    'LaunchRequest': function () {
      this.emit('Transit');
    },
    'Transit': function () {
      const stationFrom = this.event.request.intent.slots.StationFrom.value
      const stationTo   = this.event.request.intent.slots.StationTo.value
      transit.fetchTransitInfo(stationFrom, stationTo).then((result) => {
        const transitMessage = makeTransitMessage(stationFrom, stationTo, result)
        this.attributes['stationFrom']    = stationFrom
        this.attributes['stationTo']      = stationTo
        this.attributes['transitMessage'] = transitMessage
        this.attributes['currentUrl']     = result.url
        this.handler.state = 'SECOND';
        this.emit(':ask', transitMessage)
      })
    },
    'AMAZON.HelpIntent': function () {},
    'AMAZON.CancelIntent': function () {},
    'AMAZON.StopIntent': function () {}
};

/**
 * 初回以降のハンドラ
 */
const secondHandlers = Alexa.CreateStateHandler('SECOND', {
  'Repeat': function() {
    this.emit(':ask', this.attributes['transitMessage'])
  },
  'Next': function() {
    transit.fetchNextTransitInfo(this.attributes['currentUrl']).then((result) => {
      const transitMessage = makeTransitMessage(
        this.attributes['stationFrom'],
        this.attributes['stationTo'],
        result
      )
      this.attributes['transitMessage'] = transitMessage
      this.attributes['currentUrl'] = result.url
      this.emit(':ask', transitMessage)
    })
  },
  'Complete': function() {
    this.emit(':tell', 'いってらっしゃい')
  },
})

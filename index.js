const Alexa   = require('alexa-sdk');
const transit = require('./transit.js')

exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context);
  alexa.registerHandlers(handlers);
  alexa.execute();
};

const transitMessage = (stationFrom, stationTo, transitInfo) => {
  const msg = `
    ${transitInfo.startTime}に${stationFrom}に到着する、
    ${transitInfo.transport}に乗車すると、${transitInfo.arrivalTime}に
    ${stationTo}に到着します。
    運賃は${transitInfo.fare}で、${transitInfo.transfer}回の乗り換えがあります。
  `
  return msg.replace('行に', 'ゆきに')
            .replace('0回の乗り換えがあります。', '乗り換えはありません。')
}

const handlers = {
    'LaunchRequest': function () {
      this.emit('Transit');
    },
    'Transit': function () {
      const stationFrom = this.event.request.intent.slots.StationFrom.value
      const stationTo   = this.event.request.intent.slots.StationTo.value
      transit.fetchTransitInfo(stationFrom, stationTo).then((result) => {
        this.emit(':tell', transitMessage(stationFrom, stationTo, result))
      })
    },
    'AMAZON.HelpIntent': function () {},
    'AMAZON.CancelIntent': function () {},
    'AMAZON.StopIntent': function () {}
};

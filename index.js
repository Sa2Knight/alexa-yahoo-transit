const Alexa   = require('alexa-sdk');
const transit = require('./transit.js')

exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context);
  alexa.registerHandlers(firstHandlers, secondHandlers);
  alexa.execute();
};

/**
 * 路線情報に関するメッセージを生成する
 * @param [String] stationFrom 出発地
 * @param [String] stationTo   到着地
 * @param [Object] transitInfo 路線情報オブジェクト
 */
const makeTransitMessage = (stationFrom, stationTo, transitInfo) => {
  const msg = `
    ${transitInfo.startTime}に${stationFrom}に到着する、
    ${transitInfo.transport}に乗車すると、${transitInfo.arrivalTime}に
    ${stationTo}に到着します。
    料金は${transitInfo.fare}で、${transitInfo.transfer}回の乗り換えがあります。
  `
  return msg.replace('行に', '行きに')
            .replace('0回の乗り換えがあります。', '乗り換えはありません。')
}

/**
 * １本前または１本後の路線情報を発話する
 * この関数はthisを束縛しないのでcall/applyで呼び出すこと
 * @param [String] orientation １本後の場合next,１本前の場合prevを指定
 */
const emitAdjacentTransitInfo = function(orientation = 'next') {
  transit.fetchAdjacentTransitInfo(this.attributes['currentUrl'], orientation).then((result) => {
    const transitMessage = makeTransitMessage(
      this.attributes['stationFrom'],
      this.attributes['stationTo'],
      result
    )
    this.attributes['transitMessage'] = transitMessage
    this.attributes['currentUrl'] = result.url
    this.emit(':ask', transitMessage)
  })
}

/**
 * 初回のハンドラ
 */
const firstHandlers = {
  /**
   * 他のインテントに合致しない場合に、スキルの説明をする
   */
  'LaunchRequest': function () {
    const launchMessage = `
      Yahoo路線を使ってルート案内します。東京駅から渋谷駅まで。のように、
      出発駅と到着駅を教えて下さい。
    `
    this.emit(':ask', launchMessage)
  },
  /**
   * 発着駅を指定した場合に、路線情報を発話する
   */
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
};

/**
 * 初回以降のハンドラ
 */
const secondHandlers = Alexa.CreateStateHandler('SECOND', {

  // 保持している路線情報をリピート
  'AMAZON.RepeatIntent': function() {
    this.emit(':ask', this.attributes['transitMessage'])
  },

  // １本後の路線情報を発話
  'Next': function() {
    emitAdjacentTransitInfo.call(this, 'next')
  },

  // １本前の路線情報を発話
  'Prev': function() {
    emitAdjacentTransitInfo.call(this, 'prev')
  },

  // セッション終了
  'Complete': function() {
    this.emit(':tell', 'いってらっしゃいませ')
  },
})

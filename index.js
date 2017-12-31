const transit = require('./transit.js')
transit.fetchTransitInfo('京成曳舟駅', 'お台場駅').then((result) => console.log(result))

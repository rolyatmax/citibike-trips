const css = require('dom-css')

module.exports = function createElapsedTimeView (el, trips) {
  // assuming trips are in order, we'll say the current time of the viz
  // is simply midnight of the day of the first trip in the list plus
  // elapsed time
  const firstTripStartDate = trips[0]['start_ts'].split(' ')[0]
  const vizStartTime = (new Date(`${firstTripStartDate} 00:00:00`)).getTime()

  css(el.parentElement, 'position', 'relative')
  css(el, {
    color: 'white',
    position: 'absolute',
    top: '3vh',
    left: '3vw',
    fontSize: 28,
    opacity: 0.8,
    fontFamily: 'monospace'
  })
  return function renderElapsedTime (elapsed) {
    const curDate = new Date(vizStartTime + elapsed * 1000)
    el.innerText = `${curDate.toDateString()} ${secondsToTime(elapsed)}`
  }
}

function secondsToTime (seconds) {
  seconds = seconds | 0
  const hours = seconds / 3600 | 0
  seconds = seconds % 3600
  const minutes = seconds / 60 | 0
  seconds = seconds % 60
  const time = [hours, minutes, seconds].map(v => leftPad(v, 2, 0)).join(':')
  return `${time}`
}

function leftPad (val, len, char) {
  val = `${val}`
  while (val.length < len) {
    val = `${char}${val}`
  }
  return val
}

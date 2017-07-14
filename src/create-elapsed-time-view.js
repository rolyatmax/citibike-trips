const css = require('dom-css')

module.exports = function createElapsedTimeView (el) {
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
    const timeString = secondsToTime(elapsed)
    el.innerText = timeString
  }
}

function secondsToTime (seconds) {
  seconds = seconds | 0
  const days = seconds / (3600 * 24) | 0
  seconds = seconds % (3600 * 24)
  const hours = seconds / 3600 | 0
  seconds = seconds % 3600
  const minutes = seconds / 60 | 0
  seconds = seconds % 60
  const time = [hours, minutes, seconds].map(v => leftPad(v, 2, 0)).join(':')
  return `${days === 0 ? 'sat' : 'sun'} ${time}`
}

function leftPad (val, len, char) {
  val = `${val}`
  while (val.length < len) {
    val = `${char}${val}`
  }
  return val
}

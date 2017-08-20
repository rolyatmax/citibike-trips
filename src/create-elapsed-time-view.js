const { secondsToTime, getMeridian, convertHourFrom24H } = require('./helpers')

module.exports = function createElapsedTimeView (el, trips) {
  // assuming trips are in order, we'll say the current time of the viz
  // is simply midnight of the day of the first trip in the list plus
  // elapsed time
  const firstTripStartDate = trips[0]['start_ts'].split(' ')[0]
  const vizStartTime = (new Date(`${firstTripStartDate} 00:00:00`)).getTime()

  const timeEl = el.querySelector('span.time')
  const meridanEl = el.querySelector('span.meridian')
  const dayEl = el.querySelector('.day')
  const dateEl = el.querySelector('.date')

  return function renderElapsedTime (elapsed) {
    const curDate = new Date(vizStartTime + elapsed * 1000)
    const curTime = secondsToTime(elapsed)
    dayEl.innerText = days[curDate.getDay()]
    dateEl.innerText = `${curDate.getDate()} ${months[curDate.getMonth()]} ${curDate.getFullYear()}`
    timeEl.innerText = convertHourFrom24H(curTime)
    meridanEl.innerText = getMeridian(curTime)
  }
}

const days = 'Sunday Monday Tuesday Wednesday Thursday Friday Saturday Sunday'.split(' ')
const months = 'January February March April May June July August September October November December'.split(' ')

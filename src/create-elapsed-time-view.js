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

function secondsToTime (seconds) {
  seconds = seconds | 0
  const hours = seconds / 3600 | 0
  seconds = seconds % 3600
  const minutes = seconds / 60 | 0
  const time = [hours, leftPad(minutes, 2, 0)].join(':')
  return `${time}`
}

function leftPad (val, len, char) {
  val = `${val}`
  while (val.length < len) {
    val = `${char}${val}`
  }
  return val
}

const days = 'Sunday Monday Tuesday Wednesday Thursday Friday Saturday Sunday'.split(' ')
const months = 'January February March April May June July August September October November December'.split(' ')

function getMeridian (time) {
  const hours = parseInt(time.split(':')[0], 10)
  return hours > 12 ? 'PM' : 'AM'
}

function convertHourFrom24H (time) {
  let [hours, minutes] = time.split(':')
  hours = parseInt(hours, 10)
  if (hours === 0) return `12:${minutes}`
  if (hours > 12) return `${hours - 12}:${minutes}`
  return time
}

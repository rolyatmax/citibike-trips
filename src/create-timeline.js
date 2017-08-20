const catRomSpline = require('cat-rom-spline')
const newArray = require('new-array')
const { createSpring } = require('spring-animator')
const css = require('dom-css')
const { getSeconds, secondsToTime, getMeridian, convertHourFrom24H } = require('./helpers')

const verticalPadding = 20

module.exports = function createTimeline (el, trips, vizDuration, setElapsed, settings) {
  const bucketGranularity = 60 * 30
  // get histogram buckets for both subscribers and non-subscribers
  const getBucket = getHistogramBucketsByFilter(trips, bucketGranularity, vizDuration)
  const svgEl = createSVG(el)
  const { width } = el.getBoundingClientRect()

  const updateHistogram = drawHistogram(svgEl, getBucket(settings))
  drawTimeline(svgEl, vizDuration)
  const updateScrubberPosition = createScrubber(svgEl, vizDuration)

  el.addEventListener('mousedown', mouseDown)
  el.addEventListener('mousemove', mouseMove)
  window.addEventListener('mouseup', mouseUp)

  let isMouseDown = false
  let curXPosition = 0
  function mouseDown (e) {
    isMouseDown = true
    curXPosition = Math.max(e.offsetX, 0)
    setElapsed(getTimeFromXPosition(curXPosition))
  }

  function mouseMove (e) {
    if (!isMouseDown) return
    curXPosition = Math.max(e.offsetX, 0)
    setElapsed(getTimeFromXPosition(curXPosition))
  }

  function mouseUp () {
    if (!isMouseDown) return
    isMouseDown = false
  }

  function getTimeFromXPosition (xPosition) {
    return xPosition / width * vizDuration
  }

  return function renderTimeline (elapsed, settings) {
    if (isMouseDown) {
      elapsed = getTimeFromXPosition(curXPosition)
      setElapsed(elapsed)
    }
    updateScrubberPosition(elapsed)
    updateHistogram(getBucket(settings))
  }
}

function getHistogramBucketsByFilter (trips, granularity, vizDuration) {
  const bucketsByFilter = {
    subscriber: [],
    nonSubscriber: []
  }
  const maxBuckets = vizDuration / granularity
  for (let trip of trips) {
    // +1 to every bucket that this trip touches
    const startBucket = getSeconds(trip.start_ts) / granularity | 0
    const endBucket = Math.min(maxBuckets, Math.ceil(trip.duration / granularity) + startBucket)
    const filter = trip.subscriber ? 'subscriber' : 'nonSubscriber'
    const buckets = bucketsByFilter[filter]
    for (let i = startBucket; i <= endBucket; i++) {
      buckets[i] = buckets[i] || 0
      buckets[i] += 1
    }
  }

  return (settings) => {
    const buckets = newArray(maxBuckets).map(() => 0)
    for (let filter in bucketsByFilter) {
      if (!settings[filter]) continue
      for (let i = 0; i < buckets.length; i++) {
        buckets[i] += bucketsByFilter[filter][i]
      }
    }
    return buckets
  }
}

function createSVG (el) {
  const { width, height } = el.getBoundingClientRect()
  const svgEl = el.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
  svgEl.setAttribute('width', width)
  svgEl.setAttribute('height', height)
  css(svgEl, { position: 'absolute', top: 0, left: 0 })
  return svgEl
}

function createScrubber (svgEl, vizDuration) {
  const { width, height } = svgEl.getBoundingClientRect()
  const lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  lineEl.setAttribute('stroke', '#dbb685')
  lineEl.setAttribute('stroke-width', 2)
  lineEl.setAttribute('x1', 0)
  lineEl.setAttribute('y1', verticalPadding)
  lineEl.setAttribute('x2', 0)
  lineEl.setAttribute('y2', height - verticalPadding)
  svgEl.appendChild(lineEl)
  return function updatePosition (elapsed) {
    const x = elapsed / vizDuration * width
    lineEl.setAttribute('x1', x)
    lineEl.setAttribute('x2', x)
  }
}

function drawTimeline (svgEl, vizDuration) {
  const { width, height } = svgEl.getBoundingClientRect()
  const tickSize = 3 * 60 * 60
  const tickCount = vizDuration / tickSize // not including last tick
  const startY = height - verticalPadding + 10 // 10 is the max tick height
  for (let i = 0; i <= tickCount; i++) {
    const x = i / tickCount * width
    const lineLength = i === tickCount / 2 ? 10 : i === tickCount / 4 ? 7 : 5
    const lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    lineEl.setAttribute('stroke', '#ddd')
    lineEl.setAttribute('x1', x)
    lineEl.setAttribute('y1', startY)
    lineEl.setAttribute('x2', x)
    lineEl.setAttribute('y2', startY + lineLength)
    svgEl.appendChild(lineEl)

    const timeEl = document.createElement('span')
    const time = secondsToTime(i / tickCount * vizDuration)
    const hour = convertHourFrom24H(time).split(':')[0]
    const meridian = getMeridian(time)
    timeEl.innerText = `${hour}${meridian}`
    const elWidth = 50
    css(timeEl, {
      position: 'absolute',
      top: height,
      left: x - elWidth / 2,
      width: elWidth,
      fontSize: 12,
      textAlign: 'center'
    })
    svgEl.parentElement.appendChild(timeEl)
  }
  const lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  lineEl.setAttribute('stroke', '#ddd')
  lineEl.setAttribute('x1', 0)
  lineEl.setAttribute('y1', startY - 1)
  lineEl.setAttribute('x2', width)
  lineEl.setAttribute('y2', startY - 1)
  svgEl.appendChild(lineEl)
}

function drawHistogram (svgEl, buckets) {
  const { width, height } = svgEl.getBoundingClientRect()
  const max = buckets.reduce((curMax, val) => Math.max(curMax, val), -Infinity)
  const histogramHeight = height - verticalPadding * 2

  const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  pathEl.setAttribute('fill', 'rgba(255, 255, 255, 0.6)')
  pathEl.setAttribute('stroke', '#ddd')
  svgEl.appendChild(pathEl)

  const controlsSprings = buckets.map(() => createSpring(0.1, 1.1, 0))

  updateHistogram(buckets)

  function getDAttribute (points) {
    let d = ''
    d += `M0,${histogramHeight + verticalPadding} `
    points.forEach(p => {
      d += `L${p[0]},${p[1]} `
    })
    d += `L${points[points.length - 1][0]},${histogramHeight + verticalPadding}`
    return d
  }

  function updateHistogram (buckets) {
    controlsSprings.forEach((spring, i) => spring.updateValue(buckets[i]))
    const controls = controlsSprings.map(spring => spring.tick()).map((v, i) => [
      i / (buckets.length - 1) * width,
      (histogramHeight + verticalPadding) - (v / max * histogramHeight)
    ])
    controls.unshift(controls[0].map(v => v + 1))
    controls.push(controls[controls.length - 1].map(v => v + 1))
    const points = catRomSpline(controls, { samples: 2 })
    pathEl.setAttribute('d', getDAttribute(points))
  }

  return updateHistogram
}

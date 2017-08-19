const catRomSpline = require('cat-rom-spline')
const css = require('dom-css')
const { getSeconds } = require('./helpers')

module.exports = function createTimeline (el, trips) {
  const bucketGranularity = 60 * 20
  const buckets = getHistogramBuckets(trips, bucketGranularity)
  const max = buckets.reduce((curMax, val) => Math.max(curMax, val), -Infinity)

  drawSVG(el, buckets)

  console.log(max, buckets)

  return function renderTimeline (elapsed) {}
}

function getHistogramBuckets (trips, granularity) {
  const maxBuckets = 60 * 60 * 24 / granularity
  const buckets = []
  for (let trip of trips) {
    // +1 to every bucket that this trip touches
    const startBucket = getSeconds(trip.start_ts) / granularity | 0
    const endBucket = Math.min(maxBuckets, Math.ceil(trip.duration / granularity) + startBucket)
    for (let i = startBucket; i <= endBucket; i++) {
      buckets[i] = buckets[i] || 0
      buckets[i] += 1
    }
  }
  return buckets
}

function drawSVG (el, data) {
  const topPadding = 20
  const { width, height } = el.getBoundingClientRect()
  const max = data.reduce((curMax, val) => Math.max(curMax, val), -Infinity)
  const controls = data.map((v, i) => [i / (data.length - 1) * width, (-v / max) * (height - topPadding)])
  controls.unshift(controls[0].map(v => v + 1))
  controls.push(controls[controls.length - 1].map(v => v + 1))
  const points = catRomSpline(controls, { samples: 20 })
  const svgPoints = points.map(p => ([p[0], p[1] + height]))
  const svgEl = el.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
  svgEl.setAttribute('width', width)
  svgEl.setAttribute('height', height)
  css(svgEl, { position: 'absolute', top: 0, left: 0 })
  const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  pathEl.setAttribute('fill', 'rgba(255, 255, 255, 0.4)')
  pathEl.setAttribute('stroke', '#ddd')
  pathEl.setAttribute('d', getDAttribute(svgPoints))
  svgEl.appendChild(pathEl)

  function getDAttribute (points) {
    let d = ''
    d += `M0,${height} `
    points.forEach(p => {
      d += `L${p[0]},${p[1]} `
    })
    d += `L${points[points.length - 1][0]},${height}`
    return d
  }
}

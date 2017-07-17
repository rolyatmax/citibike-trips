/* global fetch */

const createRegl = require('regl')
const fit = require('canvas-fit')
const css = require('dom-css')
const mat4 = require('gl-mat4')
const createCamera = require('3d-view-controls')
const showLoader = require('./loader')
const createProjection = require('./create-projection')
const createTripsRenderer = require('./create-trips-renderer')
const createMapRenderer = require('./create-map-renderer')
const createElapsedTimeView = require('./create-elapsed-time-view')
const setupDatGUI = require('./setup-dat-gui')
const {
  extent,
  parseLines,
  parseTripsCSV,
  parseStationsCSV,
  mungeStationsIntoTrip
} = require('./helpers')

const backgroundColor = [0.22, 0.22, 0.22, 1]
const rgba = `rgba(${backgroundColor.slice(0, 3).map(v => v * 256 | 0).join(',')}, ${backgroundColor[3]})`
css(document.body, 'background-color', rgba)
const removeLoader = showLoader(document.body)

const canvas = document.body.appendChild(document.createElement('canvas'))
const camera = createCamera(canvas)
const regl = createRegl(canvas)

const renderElapsedTime = createElapsedTimeView(document.body.appendChild(document.createElement('div')))

window.addEventListener('resize', fit(canvas), false)

const nycStreetsFile = './cleaned/nyc-streets'
const tripsFile = './cleaned/trips-20160910-11.csv'
const stationsFile = './cleaned/stations.csv'

Promise.all([
  fetch(nycStreetsFile).then(d => d.text()).then(parseLines),
  fetch(tripsFile).then(d => d.text()).then(parseTripsCSV),
  fetch(stationsFile).then(d => d.text()).then(parseStationsCSV)
]).then(function onLoad ([coordinates, trips, stations]) {
  trips = mungeStationsIntoTrip(trips, stations)

  const settings = setupDatGUI({
    pointSize: [3, 0.5, 4, 0.1],
    arcHeight: [2.5, 0, 6, 0.5],
    speed: [60 * 15, 1, 7000, 1],
    subscriber: [true],
    nonSubscriber: [true]
  }, setup)

  const projectCoords = createProjection({ bbox: extent(coordinates), zoom: 1300 })
  const lines = coordinates.map(points => points.map(projectCoords))
  let startTime, startFrom, renderMap
  let renderBySubscriber = {}
  for (let trip of trips) {
    trip.startPosition = projectCoords(trip.start_station)
    trip.endPosition = projectCoords(trip.end_station)
    renderBySubscriber[trip.subscriber] = renderBySubscriber[trip.subscriber] || []
    renderBySubscriber[trip.subscriber].push(trip)
  }
  for (let k in renderBySubscriber) {
    renderBySubscriber[k] = createTripsRenderer(regl, renderBySubscriber[k])
  }
  renderMap = createMapRenderer(regl, lines)
  function setup () {
    startTime = 0
    startFrom = 0
  }

  const globalRender = regl({
    uniforms: {
      projection: ({viewportWidth, viewportHeight}) => (
        mat4.perspective([],
          Math.PI / 4,
          viewportWidth / viewportHeight,
          0.01,
          10)
      ),
      view: () => camera.matrix,
      pointSize: regl.prop('pointSize'),
      arcHeight: regl.prop('arcHeight'),
      elapsed: regl.prop('elapsed'),
      center: regl.prop('center')
    }
  })

  setup()
  window.camera = camera
  camera.zoomSpeed = 4
  camera.distanceLimits = [0.05, 1.03]
  const center = projectCoords([-73.990891, 40.728729]) // cooper union
  center.push(0)
  camera.lookAt([center[0] - 0.15, center[1] + 0.15, -0.2], center, [0.52, -0.11, -99])
  regl.frame(({ time }) => {
    if (!startTime) removeLoader()
    startTime = startTime || time
    regl.clear({
      color: backgroundColor,
      depth: 1
    })
    camera.tick()
    const loopAtTime = 2 * 24 * 60 * 60
    const elapsed = ((time - startTime) * settings.speed + startFrom) % loopAtTime
    renderElapsedTime(elapsed)
    globalRender({
      pointSize: settings.pointSize,
      arcHeight: settings.arcHeight,
      elapsed: elapsed,
      center: camera.center
    }, () => {
      renderMap()
      if (settings.subscriber) renderBySubscriber[true]()
      if (settings.nonSubscriber) renderBySubscriber[false]()
    })
  })
})

/* global fetch */

const createRegl = require('regl')
const fit = require('canvas-fit')
const mat4 = require('gl-mat4')
const createCamera = require('canvas-orbit-camera')
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

const canvas = document.body.appendChild(document.createElement('canvas'))
const camera = createCamera(canvas)
const regl = createRegl(canvas)

const renderElapsedTime = createElapsedTimeView(document.body.appendChild(document.createElement('div')))

window.addEventListener('resize', fit(canvas), false)

const nycStreetsFile = './cleaned/community-districts' // './cleaned/nyc-streets'
const tripsFile = './cleaned/trips-20160910-11.csv'
const stationsFile = './cleaned/stations.csv'

Promise.all([
  fetch(nycStreetsFile).then(d => d.text()).then(parseLines),
  fetch(tripsFile).then(d => d.text()).then(parseTripsCSV),
  fetch(stationsFile).then(d => d.text()).then(parseStationsCSV)
]).then(function start ([coordinates, trips, stations]) {
  trips = mungeStationsIntoTrip(trips, stations)

  const projectCoords = createProjection({ bbox: extent(coordinates), zoom: 1300 })
  const lines = coordinates.map(points => points.map(projectCoords))
  const points = trips.map(trip => {
    return Object.assign({}, trip, {
      startPosition: projectCoords(trip.start_station),
      endPosition: projectCoords(trip.end_station)
    })
  })

  const settings = setupDatGUI({
    pointSize: [2, 0.5, 3, 0.1],
    arcHeight: [1.8, 0, 6, 0.5],
    speed: [60 * 5, 1, 7000, 1]
  }, setup)

  let startTime, startFrom, renderPoints, renderMap
  renderPoints = createTripsRenderer(regl, points)
  renderMap = createMapRenderer(regl, lines)
  function setup () {
    startTime = 0
    startFrom = 3600 * 0 // start at 9am
  }

  const globalRender = regl({
    uniforms: {
      projection: ({viewportWidth, viewportHeight}) => (
        mat4.perspective([],
          Math.PI / 2,
          viewportWidth / viewportHeight,
          0.01,
          1000)
      ),
      view: () => camera.view(),
      pointSize: regl.prop('pointSize'),
      arcHeight: regl.prop('arcHeight'),
      elapsed: regl.prop('elapsed')
    }
  })

  setup()
  camera.lookAt([1, 0.8, -0.15], [1, 1, 0], [0.5, -0.5, 1])
  regl.frame(({ time }) => {
    startTime = startTime || time
    regl.clear({
      color: [0.22, 0.22, 0.22, 1],
      depth: 1
    })
    camera.tick()
    const loopAtTime = 2 * 24 * 60 * 60
    const elapsed = ((time - startTime) * settings.speed + startFrom) % loopAtTime
    renderElapsedTime(elapsed)
    globalRender({
      pointSize: settings.pointSize,
      arcHeight: settings.arcHeight,
      elapsed: elapsed
    }, () => {
      renderPoints()
      renderMap()
    })
  })
})

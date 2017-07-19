/* global fetch */

const createRegl = require('regl')
const fit = require('canvas-fit')
const css = require('dom-css')
const { createSpring } = require('spring-animator')
const mat4 = require('gl-mat4')
const createCamera = require('3d-view-controls')
const showLoader = require('./loader')
const createProjection = require('./create-projection')
const createTripPointsRenderer = require('./create-trip-points-renderer')
const createTripPathsRenderer = require('./create-trip-paths-renderer')
// const createTripArrivalsRenderer = require('./create-trip-arrivals-renderer')
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

const MAX_ARC_HEIGHT = 2.5
const MAX_PT_SIZE = 3
const BG_COLOR = [0.22, 0.22, 0.22, 1]
const rgba = `rgba(${BG_COLOR.slice(0, 3).map(v => v * 256 | 0).join(',')}, ${BG_COLOR[3]})`
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
    speed: [60 * 15, 1, 7000, 1],
    showPoints: [true],
    // showArrivals: [true],
    showPaths: [true],
    curvedPaths: [true],
    subscriber: [true],
    nonSubscriber: [true]
  }, setup)

  const projectCoords = createProjection({ bbox: extent(coordinates), zoom: 1300 })
  const lines = coordinates.map(points => points.map(projectCoords))
  let renderMap
  let elapsed = 0

  const dampening = 0.1
  const stiffness = 1

  // ughhhhh this is ugly
  function getValue (conditions, max) {
    for (let condition of conditions) {
      if (!settings[condition]) return 0
    }
    return max
  }

  const subscriberArcHeight = createSpring(dampening, stiffness, getValue(['subscriber', 'curvedPaths'], MAX_ARC_HEIGHT))
  const nonSubscriberArcHeight = createSpring(dampening, stiffness, getValue(['nonSubscriber', 'curvedPaths'], MAX_ARC_HEIGHT))
  const subscriberPathAlpha = createSpring(dampening, stiffness, getValue(['subscriber', 'showPaths'], 1))
  const nonSubscriberPathAlpha = createSpring(dampening, stiffness, getValue(['nonSubscriber', 'showPaths'], 1))
  const subscriberPointSize = createSpring(dampening, stiffness, getValue(['subscriber', 'showPoints'], MAX_PT_SIZE))
  const nonSubscriberPointSize = createSpring(dampening, stiffness, getValue(['nonSubscriber', 'showPoints'], MAX_PT_SIZE))
  // const subscriberArrivalAlpha = createSpring(dampening, stiffness, getValue(['subscriber', 'showArrivals'], 1))
  // const nonSubscriberArrivalAlpha = createSpring(dampening, stiffness, getValue(['nonSubscriber', 'showArrivals'], 1))

  let renderBySubscriber = {}
  for (let trip of trips) {
    trip.startPosition = projectCoords(trip.start_station)
    trip.endPosition = projectCoords(trip.end_station)
    renderBySubscriber[trip.subscriber] = renderBySubscriber[trip.subscriber] || []
    renderBySubscriber[trip.subscriber].push(trip)
  }
  for (let k in renderBySubscriber) {
    // too intensive to render trip arrivals at the moment
    // const drawTripArrivals = createTripArrivalsRenderer(regl, renderBySubscriber[k])
    const drawTripPoints = createTripPointsRenderer(regl, renderBySubscriber[k])
    const drawTripPaths = createTripPathsRenderer(regl, renderBySubscriber[k])
    renderBySubscriber[k] = function renderTrip ({ arcHeight, pointSize, pathAlpha, arrivalAlpha }) {
      drawTripPoints({ arcHeight, pointSize })
      drawTripPaths({ pathAlpha, arcHeight })
      // drawTripArrivals({ arrivalAlpha })
    }
  }
  renderMap = createMapRenderer(regl, lines)
  function setup () {
    elapsed = 0
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
      elapsed: regl.prop('elapsed'),
      center: regl.prop('center')
    }
  })

  setup()
  window.camera = camera
  camera.zoomSpeed = 4
  camera.distanceLimits = [0.05, 1.03]

  const [fX, fY] = projectCoords([-73.990891, 40.728729]) // cooper union
  const center = [fX - 0.15, fY + 0.15, -0.2] // i feel like these are misnamed in the 3d controls lib
  const eye = [fX, fY, 0] // i feel like these are misnamed in the 3d controls lib

  const cameraX = createSpring(0.005, 1.5, center[0])
  const cameraY = createSpring(0.005, 1.5, center[1])
  const cameraZ = createSpring(0.005, 1.5, center[2])

  const focusX = createSpring(0.005, 1.5, fX)
  const focusY = createSpring(0.005, 1.5, fY)

  camera.lookAt(
    center,
    eye,
    [0.52, -0.11, -99]
  )

  function setRandomCameraPosition () {
    const newFocusX = fX + (Math.random() - 0.5) * 0.2
    const newFocusY = fY + (Math.random() - 0.5) * 0.2
    focusX.updateValue(newFocusX)
    focusY.updateValue(newFocusY)

    cameraX.updateValue(newFocusX + Math.random() - 0.5)
    cameraY.updateValue(newFocusY + Math.random() - 0.5)
    cameraZ.updateValue(Math.random() * -0.5)
  }

  setRandomCameraPosition()
  // setInterval(setRandomCameraPosition, 10000)

  removeLoader()
  const loopAtTime = 2 * 24 * 60 * 60
  let lastTime = 0
  regl.frame(({ time }) => {
    const timeDiff = (time - lastTime) * settings.speed
    elapsed = (elapsed + timeDiff) % loopAtTime
    lastTime = time
    regl.clear({
      color: BG_COLOR,
      depth: 1
    })
    camera.tick()
    camera.up = [camera.up[0], camera.up[1], -999]
    // camera.center = [cameraX.tick(), cameraY.tick(), cameraZ.tick()]
    // camera.eye = [focusX.tick(), focusY.tick(), 0]

    subscriberArcHeight.updateValue(getValue(['subscriber', 'curvedPaths'], MAX_ARC_HEIGHT))
    nonSubscriberArcHeight.updateValue(getValue(['nonSubscriber', 'curvedPaths'], MAX_ARC_HEIGHT))
    subscriberPathAlpha.updateValue(getValue(['subscriber', 'showPaths'], 1))
    nonSubscriberPathAlpha.updateValue(getValue(['nonSubscriber', 'showPaths'], 1))
    subscriberPointSize.updateValue(getValue(['subscriber', 'showPoints'], MAX_PT_SIZE))
    nonSubscriberPointSize.updateValue(getValue(['nonSubscriber', 'showPoints'], MAX_PT_SIZE))
    // subscriberArrivalAlpha.updateValue(getValue(['subscriber', 'showArrivals'], 1))
    // nonSubscriberArrivalAlpha.updateValue(getValue(['nonSubscriber', 'showArrivals'], 1))

    renderElapsedTime(elapsed)
    globalRender({
      elapsed: elapsed,
      center: camera.center
    }, () => {
      renderMap()

      renderBySubscriber[true]({
        pathAlpha: subscriberPathAlpha.tick(),
        arcHeight: subscriberArcHeight.tick(),
        pointSize: subscriberPointSize.tick(),
        // arrivalAlpha: subscriberArrivalAlpha.tick()
      })
      renderBySubscriber[false]({
        pathAlpha: nonSubscriberPathAlpha.tick(),
        arcHeight: nonSubscriberArcHeight.tick(),
        pointSize: nonSubscriberPointSize.tick(),
        // arrivalAlpha: nonSubscriberArrivalAlpha.tick()
      })
    })
  })
})

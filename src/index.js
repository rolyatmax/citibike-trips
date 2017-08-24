/* global fetch */

const createRegl = require('regl')
const fit = require('canvas-fit')
const css = require('dom-css')
const mat4 = require('gl-mat4')
const createProjection = require('./create-projection')
const createTripPointsRenderer = require('./create-trip-points-renderer')
const createTripPathsRenderer = require('./create-trip-paths-renderer')
const createStateTransitioner = require('./create-state-transitioner')
const createMapRenderer = require('./create-map-renderer')
const createElapsedTimeView = require('./create-elapsed-time-view')
const createTimeline = require('./create-timeline')
const createButtons = require('./create-buttons')
const createRoamingCamera = require('./create-roaming-camera')
const checkSupport = require('./check-support')
const setupDatGUI = require('./setup-dat-gui')
const {
  extent,
  parseLines,
  parseTripsCSV,
  parseStationsCSV,
  mungeStationsIntoTrip
} = require('./helpers')

const vizDuration = 24 * 60 * 60
const BG_COLOR = [0.22, 0.22, 0.22, 1]
const rgba = `rgba(${BG_COLOR.slice(0, 3).map(v => v * 256 | 0).join(',')}, ${BG_COLOR[3]})`
css(document.body, 'background-color', rgba)

const appContainer = document.querySelector('.app-container')
const canvas = appContainer.querySelector('.visualization').appendChild(document.createElement('canvas'))
const regl = createRegl({
  extensions: 'OES_texture_float',
  canvas: canvas
})

checkSupport(regl)

window.addEventListener('resize', fit(canvas), false)

const nycStreetsFile = './cleaned/nyc-streets'
const tripsFile = './cleaned/trips-2017-06-09.csv'
const stationsFile = './cleaned/stations.csv'

Promise.all([
  fetch(nycStreetsFile).then(d => d.text()).then(parseLines),
  fetch(tripsFile).then(d => d.text()).then(parseTripsCSV),
  fetch(stationsFile).then(d => d.text()).then(parseStationsCSV)
]).then(function onLoad ([coordinates, trips, stations]) {
  trips = mungeStationsIntoTrip(trips, stations)

  const projectCoords = createProjection({ bbox: extent(coordinates), zoom: 1300 })
  const lines = coordinates.map(points => points.map(projectCoords))

  const getProjection = () => mat4.perspective(
    [],
    Math.PI / 4,
    window.innerWidth / window.innerHeight,
    0.01,
    10
  )
  const focus = projectCoords([-74.006861, 40.724130]) // holland tunnel
  const [fX, fY] = focus
  const center = [fX - 0.15, fY + 0.15, -0.2] // i feel like these are misnamed in the 3d controls lib
  const eye = [fX, fY, 0] // i feel like these are misnamed in the 3d controls lib
  const camera = createRoamingCamera(canvas, focus, center, eye, getProjection)

  let settings = setupDatGUI({
    speed: [60 * 15, 1, 7000, 1],
    rayPickerThreshold: [0.05, 0.01, 0.1, 0.01],
    startRoaming: camera.startRoaming,
    'start/stop': () => { paused = !paused }
  })

  settings = Object.assign(settings, {
    showPoints: true,
    showPaths: true,
    curvedPaths: true,
    subscriber: true,
    nonSubscriber: true
  })

  let elapsed = 4 * 60 * 60 // start at 4:00 so we get into the action a lil' faster
  const setElapsed = (newElapsed) => { elapsed = newElapsed }
  const timelineEl = document.querySelector('.timeline')
  const renderTimeline = createTimeline(timelineEl, trips, vizDuration, setElapsed, settings)
  const renderElapsedTime = createElapsedTimeView(document.querySelector('.clock'), trips)
  const renderButtons = createButtons(document.querySelector('.buttons'), settings)

  for (let j = 0; j < trips.length; j++) {
    const trip = trips[j]
    trip.startPosition = projectCoords(trip.start_station)
    trip.endPosition = projectCoords(trip.end_station)
  }

  const stateTransitioner = createStateTransitioner(regl, trips, settings)
  const stateIndexes = stateTransitioner.getStateIndexes()

  for (let j = 0; j < trips.length; j++) {
    const trip = trips[j]
    trip.tripStateIndex = stateIndexes[j]
  }

  const drawTripPoints = createTripPointsRenderer(regl, trips)
  const drawTripPaths = createTripPathsRenderer(regl, trips)
  const renderMap = createMapRenderer(regl, lines)

  const globalRender = regl({
    uniforms: {
      projection: regl.prop('projection'),
      view: regl.prop('view'),
      elapsed: regl.prop('elapsed'),
      center: regl.prop('center'),
      tripStateTexture: () => stateTransitioner.getStateTexture()
    },
    blend: {
      enable: true,
      func: {
        srcRGB: 'src alpha',
        dstRGB: 1,
        srcAlpha: 1,
        dstAlpha: 1
      },
      equation: {
        rgb: 'add',
        alpha: 'add'
      }
    }
  })

  removeLoader()
  appContainer.classList.remove('hidden')
  let lastTime = 0
  let paused = false
  regl.frame(({ time }) => {
    if (!paused) {
      const timeDiff = (time - lastTime) * settings.speed
      elapsed = (elapsed + timeDiff) % vizDuration
    }
    lastTime = time

    regl.clear({
      color: BG_COLOR,
      depth: 1
    })

    const view = camera.getMatrix()

    camera.tick(settings)

    stateTransitioner.tick(Object.assign({
      projection: getProjection(),
      view: view,
      viewport: [0, 0, window.innerWidth, window.innerHeight]
    }, settings))

    renderButtons(settings)
    renderTimeline(elapsed, settings)
    renderElapsedTime(elapsed)
    globalRender({
      elapsed: elapsed,
      center: camera.getCenter(),
      view: view,
      projection: getProjection()
    }, () => {
      renderMap()
      drawTripPoints()
      drawTripPaths()
    })
  })
})

function removeLoader () {
  const loader = document.querySelector('.loader')
  loader.parentElement.removeChild(loader)
}

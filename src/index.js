/* global fetch */

const createRegl = require('regl')
const fit = require('canvas-fit')
const css = require('dom-css')
const mat4 = require('gl-mat4')
const showLoader = require('./loader')
const createProjection = require('./create-projection')
const createTripPointsRenderer = require('./create-trip-points-renderer')
const createTripPathsRenderer = require('./create-trip-paths-renderer')
const createStateTransitioner = require('./create-state-transitioner')
const createMapRenderer = require('./create-map-renderer')
const createElapsedTimeView = require('./create-elapsed-time-view')
const createRoamingCamera = require('./create-roaming-camera')
const setupDatGUI = require('./setup-dat-gui')
const {
  extent,
  parseLines,
  parseTripsCSV,
  parseStationsCSV,
  mungeStationsIntoTrip
} = require('./helpers')

const BG_COLOR = [0.22, 0.22, 0.22, 1]
const rgba = `rgba(${BG_COLOR.slice(0, 3).map(v => v * 256 | 0).join(',')}, ${BG_COLOR[3]})`
css(document.body, 'background-color', rgba)
const removeLoader = showLoader(document.body)

const canvas = document.body.appendChild(document.createElement('canvas'))
const regl = createRegl({
  extensions: 'OES_texture_float',
  canvas: canvas
})

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
    showPaths: [true],
    curvedPaths: [true],
    subscriber: [true],
    nonSubscriber: [true],
    roamingCamera: [true] // TODO: turn this into a function that 'create-roaming-camera' provides
  }, setup)

  const projectCoords = createProjection({ bbox: extent(coordinates), zoom: 1300 })
  const lines = coordinates.map(points => points.map(projectCoords))
  let elapsed = 0

  const stateTransitioner = createStateTransitioner(regl, trips, settings)
  const stateIndexes = stateTransitioner.getStateIndexes()

  for (let j = 0; j < trips.length; j++) {
    const trip = trips[j]
    trip.tripStateIndex = stateIndexes[j]
    trip.startPosition = projectCoords(trip.start_station)
    trip.endPosition = projectCoords(trip.end_station)
  }

  const drawTripPoints = createTripPointsRenderer(regl, trips)
  const drawTripPaths = createTripPathsRenderer(regl, trips)
  const renderMap = createMapRenderer(regl, lines)

  function setup () {
    elapsed = 0
  }

  const focus = projectCoords([-73.990891, 40.728729]) // cooper union
  const [fX, fY] = focus
  const center = [fX - 0.15, fY + 0.15, -0.2] // i feel like these are misnamed in the 3d controls lib
  const eye = [fX, fY, 0] // i feel like these are misnamed in the 3d controls lib
  const camera = createRoamingCamera(canvas, focus, center, eye)

  const globalRender = regl({
    uniforms: {
      projection: ({viewportWidth, viewportHeight}) => (
        mat4.perspective([],
          Math.PI / 4,
          viewportWidth / viewportHeight,
          0.01,
          10)
      ),
      view: () => camera.getMatrix(),
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

  setup()

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
    camera.tick(settings)

    stateTransitioner.tick(settings)

    renderElapsedTime(elapsed)
    globalRender({
      elapsed: elapsed,
      center: camera.getCenter()
    }, () => {
      renderMap()
      drawTripPoints()
      drawTripPaths()
    })
  })
})

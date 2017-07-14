/* global fetch */

const createRegl = require('regl')
const fit = require('canvas-fit')
const mat4 = require('gl-mat4')
const createCamera = require('canvas-orbit-camera')
const createProjection = require('./create-projection')
const createTripsRenderer = require('./create-trips-renderer')
const createMapRenderer = require('./create-map-renderer')
const setupDatGUI = require('./setup-dat-gui')

const canvas = document.body.appendChild(document.createElement('canvas'))
const camera = createCamera(canvas)
const regl = createRegl(canvas)

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
    pointSize: [1.2, 0.5, 10, 0.1],
    arcHeight: [1, 0, 6, 0.5],
    speed: [15, 1, 50, 1]
  }, setup)

  let startTime, startFrom, renderPoints, renderMap
  renderPoints = createTripsRenderer(regl, points)
  renderMap = createMapRenderer(regl, lines)
  function setup () {
    startTime = 0
    startFrom = 3600 * 9 // start at 9am
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
      elapsed: regl.prop('elapsed'),
      speed: regl.prop('speed')
    }
  })

  setup()
  camera.lookAt([1, 0.8, -0.15], [1, 1, 0], [0.5, -0.5, 1])
  regl.frame(({ time }) => {
    startTime = startTime || time
    regl.clear({
      color: [0.18, 0.18, 0.18, 1],
      depth: 1
    })
    camera.tick()
    const elapsed = (time - startTime) * 1000 + startFrom
    globalRender({
      pointSize: settings.pointSize,
      arcHeight: settings.arcHeight,
      elapsed: elapsed,
      speed: settings.speed / 30
    }, () => {
      renderPoints()
      renderMap()
    })
  })
})

function extent (lines) {
  let minLon, minLat, maxLon, maxLat
  lines.forEach(points => {
    points.forEach(pt => {
      if (!minLon || pt[0] < minLon) minLon = pt[0]
      if (!maxLon || pt[0] > maxLon) maxLon = pt[0]
      if (!minLat || pt[1] < minLat) minLat = pt[1]
      if (!maxLat || pt[1] > maxLat) maxLat = pt[1]
    })
  })
  return [minLon, minLat, maxLon, maxLat]
}

function parseLines (data) {
  return data
    .split('\n')
    .map(l => l.split(';')
      .map(pts => pts.split(',')
        .map(v => parseFloat(v)).filter(v => v)
      ).filter(l => l.length)
    ).filter(l => l.length)
}

function parseCSV (data, formatValue) {
  const lines = data.split('\n')
  const header = lines[0]
  const columns = header.split(',')
  return lines.slice(1).filter(l => l).map(line => {
    const obj = {}
    line.split(',').forEach((value, i) => {
      const name = columns[i]
      obj[name] = formatValue(value, name)
    })
    return obj
  })
}

function parseTripsCSV (data) {
  return parseCSV(data, (value, name) => {
    if (['birth_year', 'duration', 'end_station', 'start_station'].includes(name)) {
      return parseInt(value, 10)
    }
    if (name === 'subscriber') return (value === '1')
    return value
  })
}

function parseStationsCSV (data) {
  const stations = {}
  parseCSV(data, (value, name) => {
    if (['latitude', 'longitude'].includes(name)) {
      return parseFloat(value)
    }
    if (name === 'station_id') return parseInt(value)
    // strip out the opening and closing quotes
    if (name === 'name') return value.slice(1, value.length - 1)
    return value
  }).forEach(station => {
    stations[station.station_id] = station
  })
  return stations
}

function mungeStationsIntoTrip (trips, stations) {
  return trips.map(trip => {
    return Object.assign({}, trip, {
      start_station: getLatLonFromStation(stations[trip.start_station]),
      end_station: getLatLonFromStation(stations[trip.end_station])
    })
  })
}

function getLatLonFromStation (station) {
  const { latitude, longitude } = station
  return [longitude, latitude]
}

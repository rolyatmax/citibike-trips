module.exports = {
  extent,
  parseLines,
  parseTripsCSV,
  parseStationsCSV,
  mungeStationsIntoTrip,
  getSeconds
}

function extent (lines) {
  let minLon, minLat, maxLon, maxLat
  for (let points of lines) {
    for (let pt of points) {
      if (!minLon || pt[0] < minLon) minLon = pt[0]
      if (!maxLon || pt[0] > maxLon) maxLon = pt[0]
      if (!minLat || pt[1] < minLat) minLat = pt[1]
      if (!maxLat || pt[1] > maxLat) maxLat = pt[1]
    }
  }
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
  const filteredTrips = []
  const knownMissingStations = {}
  for (let trip of trips) {
    const startStation = stations[trip.start_station]
    const endStation = stations[trip.end_station]
    if (!startStation) {
      if (!knownMissingStations[trip.start_station]) {
        console.warn(`station ${trip.start_station} not found in stations list`)
      }
      knownMissingStations[trip.start_station] = true
      continue
    }
    if (!endStation) {
      if (!knownMissingStations[trip.end_station]) {
        console.warn(`station ${trip.end_station} not found in stations list`)
      }
      knownMissingStations[trip.end_station] = true
      continue
    }
    trip.start_station = getLatLonFromStation(startStation)
    trip.end_station = getLatLonFromStation(endStation)
    filteredTrips.push(trip)
  }
  if (trips.length - filteredTrips.length > 0) {
    console.warn(`filtered out ${trips.length - filteredTrips.length} trips`)
  }
  return filteredTrips
}

function getLatLonFromStation (station) {
  const { latitude, longitude } = station
  return [longitude, latitude]
}

// gets seconds from day start
function getSeconds (datetimeString) {
  const [, time] = datetimeString.split(' ')
  const [hours, minutes, seconds] = time.split(':').map(n => parseInt(n, 10))
  return seconds + minutes * 60 + hours * 3600
}

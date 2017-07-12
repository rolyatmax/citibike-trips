// go through all citibike trip csv data and output two files:
// 1. stations.csv - station_id,lat,lon,name
// 2. trips.csv - start_ts,duration,start_station,end_station,subscriber,birth_year

const fs = require('fs')
const csv = require('fast-csv')

const STATIONS_OUT = './stations.csv'
const stationsHeader = 'station_id,latitude,longitude,name'
const stations = {}

process.stdout.write('start_ts,duration,start_station,end_station,subscriber,birth_year\n')

csv
  .fromStream(process.stdin, { headers: true })
  .on('data', processLine)
  .on('end', onEnd)

function processLine (data) {
  const startTs = data['starttime']
  const duration = int(data['tripduration'])
  const startStation = int(data['start station id'])
  const endStation = int(data['end station id'])
  const subscriber = data['usertype'] === 'Subscriber' ? 1 : 0
  const birthYear = int(data['birth year']) || 0

  if (!startStation || !endStation || !duration || !startTs) return

  process.stdout.write(`${startTs},${duration},${startStation},${endStation},${subscriber},${birthYear}\n`)

  if (!stations[startStation]) {
    stations[startStation] = [
      startStation,
      data['start station latitude'],
      data['start station longitude'],
      `"${data['start station name']}"`
    ].join(',')
  }
  if (!stations[endStation]) {
    stations[endStation] = [
      endStation,
      data['end station latitude'],
      data['end station longitude'],
      `"${data['end station name']}"`
    ].join(',')
  }
}

function onEnd () {
  const csvText = [
    stationsHeader,
    ...Object.keys(stations).map(id => stations[id])
  ].join('\n')

  fs.writeFileSync(STATIONS_OUT, csvText + '\n')
}

function int (val) {
  return parseInt(val, 10)
}

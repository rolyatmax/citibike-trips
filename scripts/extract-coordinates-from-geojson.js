// clean nyc-streets.geo.json
const fs = require('fs')
const path = require('path')
const topojson = require('topojson')
const argv = require('argv')
const args = argv.option({
  name: 'help',
  short: 'h',
  type: 'boolean'
}).run()

const pathToGeoJSON = args.targets[0]

if (args.options.help || !pathToGeoJSON) help()

function help () {
  console.log(`usage: node ${path.basename(__filename)} PATH/TO/GEOJSON.json`)
  process.exit()
}

const json = fs.readFileSync(pathToGeoJSON, 'utf-8')
const geoJSON = JSON.parse(json)

if (geoJSON.type === 'Topology') {
  const result = topojson.mesh(geoJSON)
  console.log('TOPOLOGY! Check the code and figure out how to do this')
  console.log(result.coordinates.length)
  process.exit()
}

geoJSON.features.forEach(feat => {
  // filter to just BK and Manhattan streets
  // if (!['047', '061'].includes(feat.properties['COUNTYFP'])) return
  // if (feat.properties['COUNTYFP'] !== '061') return
  // if (feat.properties['MTFCC'] !== 'S1200' && feat.properties['MTFCC'] !== 'S1100') return
  if (feat.geometry.type === 'MultiLineString') feat.geometry.coordinates.forEach(processLine)
  if (feat.geometry.type === 'LineString') processLine(feat.geometry.coordinates)
  if (feat.geometry.type === 'Polygon') feat.geometry.coordinates.forEach(processLine)
  if (feat.geometry.type === 'MultiPolygon') feat.geometry.coordinates.forEach(c => c.forEach(processLine))
})

function processLine (line) {
  process.stdout.write(line.map(pt => pt.join(',')).join(';'))
  process.stdout.write('\n')
}

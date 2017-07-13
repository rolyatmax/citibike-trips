const mercator = require('projections/mercator')

module.exports = function createProjection ({ bbox, zoom }) {
  const projectionOpts = {
    meridian: 180 + bbox[0],
    latLimit: bbox[3]
  }
  return function project ([lon, lat]) {
    const { x, y } = mercator({ lon, lat }, projectionOpts)
    return [x * zoom, y * zoom]
  }
}

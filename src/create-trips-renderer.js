const glslify = require('glslify')

module.exports = function createTripsRenderer (regl, points) {
  // console.log(points)
  return regl({
    vert: glslify.file('./trips.vert'),
    frag: glslify.file('./trips.frag'),

    attributes: {
      startPosition: points.map(p => p.startPosition),
      endPosition: points.map(p => p.endPosition),
      color: points.map(p => p.subscriber ? [1, 1, 1, 1] : [1, 0, 0, 1]),
      startTime: points.map(p => 0), // make this the actual start
      duration: points.map(p => p.duration * 100)
    },

    count: points.length,

    primitive: 'point'
  })
}

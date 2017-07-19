const glslify = require('glslify')
const { getSeconds } = require('./helpers')

module.exports = function createTripPointsRenderer (regl, points) {
  return regl({
    vert: glslify.file('./trip-points.vert'),
    frag: glslify.file('./trip-points.frag'),

    attributes: {
      startPosition: points.map(p => p.startPosition),
      endPosition: points.map(p => p.endPosition),
      color: points.map(p => p.subscriber ? [0.7, 0.7, 1, 1] : [1, 0.7, 0.7, 1]),
      startTime: points.map(p => getSeconds(p.start_ts)),
      duration: points.map(p => p.duration)
    },

    uniforms: {
      arcHeight: regl.prop('arcHeight'),
      pointSize: regl.prop('pointSize')
    },

    count: points.length,

    primitive: 'point'
  })
}

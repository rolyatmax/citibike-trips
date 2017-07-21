const glslify = require('glslify')
const { getSeconds } = require('./helpers')

module.exports = function createTripArrivalsRenderer (regl, points) {
  // !!!!!!!!!! too intensive right now
  points = points.slice(0, 10000)

  points.forEach(p => {
    p.startTime = getSeconds(p.start_ts)
  })

  const positions = [[0, 0]]
  const granularity = 3
  let j = granularity + 1
  while (j--) {
    const rads = (j / granularity) * Math.PI * 2
    positions.push([Math.cos(rads), Math.sin(rads)])
  }

  const globalDraw = regl({
    vert: glslify.file('./trip-arrivals.vert'),
    frag: glslify.file('./trip-arrivals.frag'),

    attributes: {
      position: positions
    },

    uniforms: {
      arrivalAlpha: regl.prop('arrivalAlpha'),
      radius: 0.0001
    },

    count: positions.length,

    primitive: 'triangle fan'
  })

  const renderCircle = regl({
    uniforms: {
      endPosition: regl.prop('endPosition'),
      startTime: regl.prop('startTime'),
      duration: regl.prop('duration')
    }
  })

  return function renderArrivals ({ arrivalAlpha }) {
    globalDraw({ arrivalAlpha }, () => renderCircle(points))
  }
}

const glslify = require('glslify')
const vec2 = require('gl-vec2')
const { getSeconds } = require('./helpers')

module.exports = function createTripsRenderer (regl, points) {
  // points = points.slice(0, 70000)
  const drawTripPoints = regl({
    vert: glslify.file('./trips.vert'),
    frag: glslify.file('./trips.frag'),

    attributes: {
      startPosition: points.map(p => p.startPosition),
      endPosition: points.map(p => p.endPosition),
      color: points.map(p => p.subscriber ? [0.7, 0.7, 1, 1] : [1, 0.7, 0.7, 1]),
      startTime: points.map(p => getSeconds(p.start_ts)),
      duration: points.map(p => p.duration)
    },

    count: points.length,

    primitive: 'point'
  })

  function getPosition (start, end, t) {
    const position = vec2.lerp([], start, end, t)
    const z = Math.sin(t * Math.PI) * -0.1 * vec2.distance(start, end)
    position.push(z)
    return position
  }

  // because drawing in lines mode takes a start point, then an end point,
  // then the next line's start, and then end - we have to reorg these points
  // to work with the shader
  const linesPoints = []
  points.forEach(p => {
    const arcPoints = 18
    for (let j = 0; j < arcPoints; j++) {
      linesPoints.push(Object.assign({ position: getPosition(p.startPosition, p.endPosition, j / arcPoints) }, p))
      linesPoints.push(Object.assign({ position: getPosition(p.startPosition, p.endPosition, (j + 1) / arcPoints) }, p))
    }
  })

  console.log('line segment points', linesPoints.length)

  const drawTripPaths = regl({
    vert: glslify.file('./trip-path.vert'),
    frag: glslify.file('./trip-path.frag'),

    attributes: {
      position: linesPoints.map(p => p.position),
      color: linesPoints.map(p => p.subscriber ? [0.7, 0.7, 1, 0.3] : [1, 0.7, 0.7, 0.3]),
      startTime: linesPoints.map(p => getSeconds(p.start_ts)), // make this the actual start
      duration: linesPoints.map(p => p.duration)
    },

    blend: {
      enable: true,
      func: {
        srcRGB: 'src alpha',
        srcAlpha: 1,
        dstRGB: 'one minus src alpha',
        dstAlpha: 1
      },
      equation: {
        rgb: 'add',
        alpha: 'add'
      },
      color: [0, 0, 0, 0]
    },

    count: linesPoints.length,

    primitive: 'lines'
  })

  return () => {
    drawTripPoints()
    drawTripPaths()
  }
}

const glslify = require('glslify')
const vec2 = require('gl-vec2')
const lerp = require('lerp')
const { getSeconds } = require('./helpers')

module.exports = function createTripsRenderer (regl, points) {
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

    uniforms: {
      arcHeight: regl.prop('arcHeight'),
      pointSize: regl.prop('pointSize')
    },

    count: points.length,

    primitive: 'point'
  })

  const startColor = [235, 127, 0]
  const endColor = [172, 240, 242]
  function getColor (t) {
    return [
      lerp(startColor[0], endColor[0], t) / 255,
      lerp(startColor[1], endColor[1], t) / 255,
      lerp(startColor[2], endColor[2], t) / 255
    ]
  }

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
  const linesColors = []
  const linesStartTimes = []
  const linesDurations = []
  points.forEach(p => {
    const arcPoints = 18
    const startTime = getSeconds(p.start_ts)
    for (let j = 0; j < arcPoints; j++) {
      linesPoints.push(getPosition(p.startPosition, p.endPosition, j / arcPoints))
      linesColors.push(getColor(j / arcPoints))
      linesStartTimes.push(startTime)
      linesDurations.push(p.duration)

      linesPoints.push(getPosition(p.startPosition, p.endPosition, (j + 1) / arcPoints))
      linesColors.push(getColor((j + 1) / arcPoints))
      linesStartTimes.push(startTime)
      linesDurations.push(p.duration)
    }
  })

  console.log('line segment points', linesPoints.length)

  const drawTripPaths = regl({
    vert: glslify.file('./trip-path.vert'),
    frag: glslify.file('./trip-path.frag'),

    attributes: {
      position: linesPoints,
      color: linesColors,
      startTime: linesStartTimes,
      duration: linesDurations
    },

    uniforms: {
      pathAlpha: regl.prop('pathAlpha'),
      arcHeight: regl.prop('arcHeight')
    },

    blend: {
      enable: true,
      func: {
        srcRGB: 'src alpha',
        dstRGB: 'one minus src alpha',
        srcAlpha: 1,
        dstAlpha: 'one minus src alpha'
      },
      equation: {
        rgb: 'add',
        alpha: 'add'
      }
    },

    count: linesPoints.length,

    primitive: 'lines'
  })
  return ({ pathAlpha, arcHeight, pointSize }) => {
    drawTripPoints({ arcHeight, pointSize })
    drawTripPaths({ pathAlpha, arcHeight })
  }
}

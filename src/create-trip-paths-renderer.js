const glslify = require('glslify')
const vec2 = require('gl-vec2')
const lerp = require('lerp')
const { getSeconds } = require('./helpers')

module.exports = function createTripPathsRenderer (regl, points) {
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
    const z = Math.sin(t * Math.PI) * -0.1 * Math.max(0.04, vec2.distance(start, end))
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
  const linesTripStateIndex = []
  points.forEach(p => {
    const arcPoints = 25
    const startTime = getSeconds(p.start_ts)
    for (let j = 0; j < arcPoints; j++) {
      linesPoints.push(getPosition(p.startPosition, p.endPosition, j / arcPoints))
      linesColors.push(getColor(j / arcPoints))
      linesStartTimes.push(startTime)
      linesDurations.push(p.duration)
      linesTripStateIndex.push(p.tripStateIndex)

      linesPoints.push(getPosition(p.startPosition, p.endPosition, (j + 1) / arcPoints))
      linesColors.push(getColor((j + 1) / arcPoints))
      linesStartTimes.push(startTime)
      linesDurations.push(p.duration)
      linesTripStateIndex.push(p.tripStateIndex)
    }
  })

  console.log('line segment points', linesPoints.length)

  return regl({
    vert: glslify.file('./trip-path.vert'),
    frag: glslify.file('./trip-path.frag'),

    attributes: {
      position: linesPoints,
      color: linesColors,
      startTime: linesStartTimes,
      duration: linesDurations,
      tripStateIndex: linesTripStateIndex
    },

    count: linesPoints.length,

    primitive: 'lines'
  })
}

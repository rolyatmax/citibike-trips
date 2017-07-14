const glslify = require('glslify')

module.exports = function createTripsRenderer (regl, points) {
  points = points.slice(0, 40000)

  const drawTripPoints = regl({
    vert: glslify.file('./trips.vert'),
    frag: glslify.file('./trips.frag'),

    attributes: {
      startPosition: points.map(p => p.startPosition),
      endPosition: points.map(p => p.endPosition),
      color: points.map(p => p.subscriber ? [1, 1, 1, 1] : [1, 0, 0, 1]),
      startTime: points.map(p => getSeconds(p.start_ts)), // make this the actual start
      duration: points.map(p => p.duration)
    },

    count: points.length,

    primitive: 'point'
  })

  // because drawing in lines mode takes a start point, then an end point,
  // then the next line's start, and then end - we have to reorg these points
  // to work with the shader
  const linesPoints = []
  points.forEach(p => {
    linesPoints.push(Object.assign({ position: p.startPosition }, p))
    linesPoints.push(Object.assign({ position: p.endPosition }, p))
  })

  const drawTripPaths = regl({
    vert: glslify.file('./trip-path.vert'),
    frag: glslify.file('./trip-path.frag'),

    attributes: {
      position: linesPoints.map(p => p.position),
      color: linesPoints.map(p => p.subscriber ? [1, 1, 1, 1] : [1, 0, 0, 1]),
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

function getSeconds (datetimeString) {
  const time = datetimeString.split(' ')[1]
  const [hours, minutes, seconds] = time.split(':').map(n => parseInt(n, 10))
  return seconds + minutes * 60 + hours * 3600
}

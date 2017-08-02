const glslify = require('glslify')

module.exports = function createMapRenderer (regl, lines) {
  const lineSegments = []
  for (let line of lines) {
    for (let j = 0; j < line.length - 1; j++) {
      lineSegments.push(line[j])
      lineSegments.push(line[j + 1])
    }
  }

  const renderMap = regl({
    vert: glslify.file('./map.vert'),
    frag: glslify.file('./simple.frag'),
    attributes: {
      position: lineSegments
    },
    count: lineSegments.length,
    uniforms: {
      color: [0.75, 0.75, 0.75]
    },
    primitive: 'lines'
  })

  const gridLines = []
  const separation = 0.05
  const limit = 2
  for (let j = -limit; j <= limit; j += separation) {
    gridLines.push([j, -limit, 0], [j, limit, 0], [-limit, j, 0], [limit, j, 0])
  }

  const renderGrid = regl({
    vert: glslify.file('./simple.vert'),
    frag: glslify.file('./simple.frag'),
    attributes: {
      position: gridLines
    },
    count: gridLines.length,
    uniforms: {
      color: [0.15, 0.15, 0.15, 0.25]
    },
    primitive: 'lines'
  })

  return () => {
    renderGrid()
    renderMap()
  }
}

const glslify = require('glslify')

module.exports = function createMapRenderer (regl, lines) {
  const globalLineRender = regl({
    vert: glslify.file('./map.vert'),
    frag: glslify.file('./map.frag'),
    primitive: 'line strip'
  })

  const drawCalls = lines.map((points, i) => {
    const colors = points.map(() => [0.9, 0.9, 0.9, 1])

    console.log('drawcallsssss', i, '/', lines.length)
    return regl({
      attributes: {
        position: points,
        color: colors
      },
      count: points.length
    })
  })

  return function renderMap () {
    globalLineRender(() => drawCalls.forEach(render => render()))
  }
}

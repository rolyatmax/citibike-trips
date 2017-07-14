const glslify = require('glslify')

module.exports = function createMapRenderer (regl, lines) {
  const globalLineRender = regl({
    vert: glslify.file('./map.vert'),
    frag: glslify.file('./map.frag'),
    primitive: 'line strip',
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
    }
  })

  const drawCalls = lines.map((points, i) => {
    const colors = points.map(() => [0.85, 0.85, 0.85, 1])
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

module.exports = function checkSupport (regl) {
  const data = new Float32Array(4)
  data[0] = data[1] = data[2] = data[3] = 0.1234567
  const initialTexture = regl.texture({
    data: data,
    shape: [1, 1, 4],
    type: 'float'
  })
  try {
    regl.framebuffer({
      color: initialTexture,
      depth: false,
      stencil: false
    })
  } catch (err) {
    notSupported()
    throw new Error('visualization requires OES_texture_float webgl extension', err)
  }
}

function notSupported () {
  document.body.innerHTML = ''
  const warningDiv = document.body.appendChild(document.createElement('div'))
  warningDiv.classList.add('not-supported')
  warningDiv.innerHTML = 'This visualization requires a WebGL ' +
    'extension that may not be available on mobile browsers. But you can take a look at ' +
    '<a href="https://vimeo.com/230861960">this little video</a> I made of it!'
}

const glslify = require('glslify')

module.exports = function createStateTransitioner (regl, trips, settings) {
  const tripStateTextureSize = Math.ceil(Math.sqrt(trips.length))
  const tripStateTextureLength = tripStateTextureSize * tripStateTextureSize
  const initialTripState = new Float32Array(tripStateTextureLength * 4)
  for (let i = 0; i < tripStateTextureLength; ++i) {
    initialTripState[i * 4] = 0 // arcHeight
    initialTripState[i * 4 + 1] = 0 // pathAlpha
    initialTripState[i * 4 + 2] = 0 // pointSize
  }

  let prevTripStateTexture = createStateBuffer(initialTripState, tripStateTextureSize)
  let curTripStateTexture = createStateBuffer(initialTripState, tripStateTextureSize)
  let nextTripStateTexture = createStateBuffer(initialTripState, tripStateTextureSize)

  const stateIndexes = []
  const tripMetaDataState = new Float32Array(tripStateTextureLength * 4)
  for (let j = 0; j < trips.length; j++) {
    const tripStateIndexX = j % tripStateTextureSize
    const tripStateIndexY = j / tripStateTextureSize | 0
    stateIndexes.push([tripStateIndexX / tripStateTextureSize, tripStateIndexY / tripStateTextureSize])
    tripMetaDataState[j * 4] = trips[j].subscriber ? 1.0 : 0.0 // subscriber
  }
  const tripMetaDataTexture = createStateBuffer(tripMetaDataState, tripStateTextureSize)

  const dampening = 1.0
  const stiffness = 0.1
  const MAX_ARC_HEIGHT = 2.5
  const MAX_PT_SIZE = 3

  const updateState = regl({
    framebuffer: () => nextTripStateTexture,

    vert: glslify.file('./trip-state.vert'),
    frag: glslify.file('./trip-state.frag'),

    attributes: {
      position: [
        -1, -1,
        1, -1,
        -1, 1,
        1, 1
      ]
    },

    uniforms: {
      curTripStateTexture: () => curTripStateTexture,
      prevTripStateTexture: () => prevTripStateTexture,
      tripMetaDataTexture: tripMetaDataTexture,
      dampening: dampening,
      stiffness: stiffness,
      maxArcHeight: MAX_ARC_HEIGHT,
      maxPointSize: MAX_PT_SIZE,
      showSubscriber: regl.prop('showSubscriber'),
      showNonSubscriber: regl.prop('showNonSubscriber'),
      curvedPaths: regl.prop('curvedPaths'),
      showPaths: regl.prop('showPaths'),
      showPoints: regl.prop('showPoints')
    },

    count: 4,
    primitive: 'triangle strip'
  })

  function getStateIndexes () {
    return stateIndexes
  }

  function tick (settings) {
    cycleStates()
    updateState({
      showSubscriber: settings.subscriber,
      showNonSubscriber: settings.nonSubscriber,
      curvedPaths: settings.curvedPaths,
      showPaths: settings.showPaths,
      showPoints: settings.showPoints
    })
  }

  function getStateTexture () {
    return curTripStateTexture
  }

  return {
    tick,
    getStateTexture,
    getStateIndexes
  }

  function createStateBuffer (initialState, textureSize) {
    const initialTexture = regl.texture({
      data: initialState,
      shape: [textureSize, textureSize, 4],
      type: 'float'
    })

    let fbuffer
    try {
      fbuffer = regl.framebuffer({
        color: initialTexture,
        depth: false,
        stencil: false
      })
    } catch (err) {
      // notSupported()
      throw new Error(err)
    }

    return fbuffer
  }

  function cycleStates () {
    const tmp = prevTripStateTexture
    prevTripStateTexture = curTripStateTexture
    curTripStateTexture = nextTripStateTexture
    nextTripStateTexture = tmp
  }
}

const { createSpring } = require('spring-animator')
const createCamera = require('3d-view-controls')

module.exports = function createRoamingCamera (canvas, focus, center, eye) {
  const camera = createCamera(canvas, {
    zoomSpeed: 4,
    distanceLimits: [0.05, 1.03]
  })
  const [fX, fY] = focus
  const cameraX = createSpring(0.005, 1.5, center[0])
  const cameraY = createSpring(0.005, 1.5, center[1])
  const cameraZ = createSpring(0.005, 1.5, center[2])

  const focusX = createSpring(0.005, 1.5, fX)
  const focusY = createSpring(0.005, 1.5, fY)

  camera.lookAt(
    center,
    eye,
    [0.52, -0.11, -99]
  )

  function setRandomCameraPosition () {
    const newFocusX = fX + (Math.random() - 0.5) * 0.2
    const newFocusY = fY + (Math.random() - 0.5) * 0.2
    focusX.updateValue(newFocusX)
    focusY.updateValue(newFocusY)

    cameraX.updateValue(newFocusX + Math.random() - 0.5)
    cameraY.updateValue(newFocusY + Math.random() - 0.5)
    cameraZ.updateValue(Math.random() * -0.5)
  }

  setRandomCameraPosition()
  setInterval(setRandomCameraPosition, 10000)

  function tick (settings) {
    camera.tick()
    camera.up = [camera.up[0], camera.up[1], -999]
    if (settings.roamingCamera) {
      camera.center = [cameraX.tick(), cameraY.tick(), cameraZ.tick()]
      camera.eye = [focusX.tick(), focusY.tick(), 0]
    }
  }
  function getMatrix () {
    return camera.matrix
  }
  function getCenter () {
    return camera.center
  }

  window.camera = camera
  return {
    tick,
    getMatrix,
    getCenter
  }
}

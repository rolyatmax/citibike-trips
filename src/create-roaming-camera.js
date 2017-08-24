const { createSpring } = require('spring-animator')
const createCamera = require('3d-view-controls')
const { getIntersection } = require('./helpers')

module.exports = function createRoamingCamera (canvas, focus, center, eye, getProjection) {
  let isRoaming = true
  let timeout

  canvas.addEventListener('mousedown', stopRoaming)
  canvas.addEventListener('dblclick', onDblClick)

  const camera = createCamera(canvas, {
    zoomSpeed: 4,
    distanceLimits: [0.05, 1.03]
  })
  const [fX, fY] = focus
  const cameraX = createSpring(0.005, 1.5, center[0])
  const cameraY = createSpring(0.005, 1.5, center[1])
  const cameraZ = createSpring(0.005, 1.5, center[2])

  const focusX = createSpring(0.05, 1.5, fX)
  const focusY = createSpring(0.05, 1.5, fY)

  camera.lookAt(
    center,
    eye,
    [0.52, -0.11, -99]
  )

  function onDblClick (e) {
    const [fX, fY] = getIntersection(
      [e.clientX, e.clientY],
      // prob not the best idea since elsewhere we are using `viewportWidth`
      // and `viewportHeight` passed by regl
      [0, 0, window.innerWidth, window.innerHeight],
      getProjection(),
      camera.matrix
    )
    setSpringsToCurrentCameraValues()
    focusX.updateValue(fX)
    focusY.updateValue(fY)

    // clear this text selection nonsense on screen after double click
    if (document.selection && document.selection.empty) {
      document.selection.empty()
    } else if (window.getSelection) {
      const sel = window.getSelection()
      sel.removeAllRanges()
    }
  }

  function setRandomCameraPosition () {
    // dont move focus too much because it has a much snappier spring
    const newFocusX = fX + (Math.random() - 0.5) * 0.01
    const newFocusY = fY + (Math.random() - 0.5) * 0.01
    focusX.updateValue(newFocusX)
    focusY.updateValue(newFocusY)

    cameraX.updateValue(newFocusX + Math.random() - 0.5)
    cameraY.updateValue(newFocusY + Math.random() - 0.5)
    cameraZ.updateValue(Math.random() * -0.5)
  }

  cameraRoamLoop()
  function cameraRoamLoop () {
    clearTimeout(timeout)
    timeout = setTimeout(cameraRoamLoop, 10000)
    setRandomCameraPosition()
  }

  function tick () {
    camera.tick()
    camera.up = [camera.up[0], camera.up[1], -999]
    camera.eye = [focusX.tick(), focusY.tick(), 0]
    if (isRoaming) {
      camera.center = [cameraX.tick(), cameraY.tick(), cameraZ.tick()]
    }
  }
  function getMatrix () {
    return camera.matrix
  }
  function getCenter () {
    return camera.center
  }
  function stopRoaming () {
    clearTimeout(timeout)
    timeout = null
    isRoaming = false
  }
  function startRoaming () {
    setSpringsToCurrentCameraValues()
    cameraRoamLoop()
    isRoaming = true
  }

  function setSpringsToCurrentCameraValues () {
    focusX.updateValue(camera.center[0], false)
    focusY.updateValue(camera.center[1], false)

    cameraX.updateValue(camera.eye[0], false)
    cameraY.updateValue(camera.eye[1], false)
    cameraZ.updateValue(camera.eye[2], false)
  }

  window.camera = camera
  return {
    tick,
    getMatrix,
    getCenter,
    startRoaming
  }
}

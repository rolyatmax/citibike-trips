const createCamera = require('3d-view-controls')

// module.exports = function createRoamingCamera (canvas, focus, center, eye) {
//   let isRoaming = true
//   let timeout

//   const camera = createCamera(canvas, {
//     zoomSpeed: 4,
//     distanceLimits: [0.05, 1.03]
//   })
//   const [fX, fY] = focus
//   const cameraX = createSpring(0.005, 1.5, center[0])
//   const cameraY = createSpring(0.005, 1.5, center[1])
//   const cameraZ = createSpring(0.005, 1.5, center[2])

//   const focusX = createSpring(0.05, 1.5, fX)
//   const focusY = createSpring(0.05, 1.5, fY)

//   camera.lookAt(
//     center,
//     eye,
//     [0.52, -0.11, -99]
//   )

//   function setRandomCameraPosition () {
//     // dont move focus too much because it has a much snappier spring
//     const newFocusX = fX + (Math.random() - 0.5) * 0.01
//     const newFocusY = fY + (Math.random() - 0.5) * 0.01
//     focusX.updateValue(newFocusX)
//     focusY.updateValue(newFocusY)

//     cameraX.updateValue(newFocusX + Math.random() - 0.5)
//     cameraY.updateValue(newFocusY + Math.random() - 0.5)
//     cameraZ.updateValue(Math.random() * -0.5)
//   }

//   cameraRoamLoop()
//   function cameraRoamLoop () {
//     clearTimeout(timeout)
//     timeout = setTimeout(cameraRoamLoop, 10000)
//     setRandomCameraPosition()
//   }

//   function tick () {
//     camera.tick()
//     camera.up = [camera.up[0], camera.up[1], -999]
//     camera.eye = [focusX.tick(), focusY.tick(), 0]
//     if (isRoaming) {
//       camera.center = [cameraX.tick(), cameraY.tick(), cameraZ.tick()]
//     }
//   }
//   function getMatrix () {
//     return camera.matrix
//   }
//   function getCenter () {
//     return camera.center
//   }
//   function stopRoaming () {
//     clearTimeout(timeout)
//     timeout = null
//     isRoaming = false
//   }
//   function startRoaming () {
//     setSpringsToCurrentCameraValues()
//     cameraRoamLoop()
//     isRoaming = true
//   }

//   function setSpringsToCurrentCameraValues () {
//     focusX.updateValue(camera.center[0], false)
//     focusY.updateValue(camera.center[1], false)

//     cameraX.updateValue(camera.eye[0], false)
//     cameraY.updateValue(camera.eye[1], false)
//     cameraZ.updateValue(camera.eye[2], false)
//   }

//   window.camera = camera
//   return {
//     tick,
//     getMatrix,
//     getCenter,
//     startRoaming
//   }
// }


// -------------------------------

module.exports = function createRoamingCamera (opts) {
  const {canvas, zoomSpeed, center, eye, getCameraPosition, getCameraEye, accel, friction, moveEveryNFrames} = opts
  const roamOnEveryNFrames = moveEveryNFrames || 600
  let isRoaming = true
  let frameCount = 0

  canvas.addEventListener('mousedown', stopRoaming)

  const camera = createCamera(canvas, {
    zoomSpeed: zoomSpeed
  })

  const cameraPos = createAnimator(center, accel, friction)
  const focus = createAnimator(eye, accel, friction)

  camera.lookAt(
    center,
    eye,
    [0.52, -0.11, -99]
  )

  setRandomCameraPosition()

  function setRandomCameraPosition () {
    cameraPos.moveTo(getCameraPosition())
    focus.moveTo(getCameraEye())
  }

  function tick (accel, friction) {
    frameCount += 1
    camera.tick()
    camera.up = [camera.up[0], camera.up[1], -999]
    camera.eye = focus.tick(accel, friction)
    if (isRoaming) {
      camera.center = cameraPos.tick(accel, friction)
    }
    if (frameCount >= roamOnEveryNFrames) {
      setRandomCameraPosition()
      frameCount = 0
    }
  }
  function getMatrix () {
    return camera.matrix
  }
  function getCenter () {
    return camera.center
  }
  function stopRoaming () {
    isRoaming = false
    frameCount = 0
  }
  function startRoaming () {
    if (!isRoaming) setSpringsToCurrentCameraValues()
    isRoaming = true
    frameCount = 0
    setRandomCameraPosition()
  }

  function setSpringsToCurrentCameraValues () {
    cameraPos.setTo(camera.eye)
    focus.setTo(camera.center)
  }

  return {
    tick,
    getMatrix,
    getCenter,
    startRoaming,
    stopRoaming,
    moveToNextPosition: startRoaming
  }
}

function createAnimator (initVal, accel, friction, speedLimit) {
  const add = (first, second) => first.map((v, i) => v + second[i])
  const subtract = (first, second) => first.map((v, i) => v - second[i])
  const scale = (vec, mult) => vec.map(v => v * mult)
  const length = vec => Math.sqrt(vec.reduce((total, v) => total + v * v, 0))

  const initialValue = Array.isArray(initVal) ? initVal : [initVal]
  let curVal = initialValue
  let lastVal = initialValue
  let destVal = initialValue
  return {
    moveTo (val) {
      destVal = Array.isArray(val) ? val : [val]
    },
    setTo (val) {
      curVal = Array.isArray(val) ? val : [val]
      lastVal = Array.isArray(val) ? val : [val]
      destVal = Array.isArray(val) ? val : [val]
    },
    tick (a = accel, f = friction, l = speedLimit) {
      const delta = subtract(destVal, curVal)
      const curVelocity = subtract(curVal, lastVal)
      let velocity = add(scale(delta, a), curVelocity)
      velocity = add(velocity, scale(curVelocity, -1 * f))
      const speed = length(velocity)
      if (l && speed > l) {
        velocity = scale(velocity, l / speed)
      }
      const nextVal = add(velocity, curVal)
      lastVal = curVal
      curVal = nextVal
      return curVal
    },
    getCurrentVal () {
      return Array.isArray(initVal) ? curVal : curVal[0]
    }
  }
}

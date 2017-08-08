const { GUI } = require('dat-gui')

module.exports = function guiSettings (settings, onChange) {
  const settingsObj = {}
  const gui = new GUI()
  for (let key in settings) {
    if (typeof settings[key] === 'function') {
      gui.add({ [key]: settings[key] }, key)
      continue
    }
    settingsObj[key] = settings[key][0]
    const setting = gui
      .add(settingsObj, key, settings[key][1], settings[key][2])
    if (settings[key][3]) {
      setting.step(settings[key][3])
    }
    if (settings[key][4]) {
      setting.onChange(onChange)
    }
  }
  return settingsObj
}

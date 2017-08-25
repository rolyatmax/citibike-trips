module.exports = function createButtons (container, settings) {
  const createBtnEl = () => document.createElement('span')
  const buttons = [
    { name: 'showPoints', label: 'Points', group: 'view-options', el: createBtnEl() },
    { name: 'showPaths', label: 'Paths', group: 'view-options', el: createBtnEl() },
    { name: 'curvedPaths', label: 'Arcs', group: 'view-options', el: createBtnEl() },

    { name: 'subscriber', label: 'Member', group: 'filter', el: createBtnEl() },
    { name: 'nonSubscriber', label: 'Day Pass', group: 'filter', el: createBtnEl() }
  ]

  const btnGroups = {}
  buttons.forEach(({ name, label, el, group }) => {
    btnGroups[group] = btnGroups[group] || createAndAppendButtonGroup(container, group)
    el.innerText = label
    btnGroups[group].appendChild(el)
    el.addEventListener('click', () => toggleFilter(name))
  })

  return function renderButtons (settings) {
    buttons.forEach(({ name, el }) => {
      if (settings[name]) {
        el.classList.add('highlight')
      } else {
        el.classList.remove('highlight')
      }
    })
  }

  function toggleFilter (name) {
    settings[name] = !settings[name]
  }
}

function createAndAppendButtonGroup (el, name) {
  const btnGroupEl = el.appendChild(document.createElement('div'))
  btnGroupEl.classList.add('button-group')
  btnGroupEl.classList.add(name)
  return btnGroupEl
}

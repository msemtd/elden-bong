import $ from 'jquery'
import './FileDrop.css'

/**
 * expanded to return URI types too
 */
function getFileDataTransferItems (ev) {
  if (!ev || !ev.originalEvent || !ev.originalEvent.dataTransfer || !ev.originalEvent.dataTransfer.items || !ev.originalEvent.dataTransfer.items.length) { return false }
  const items = ev.originalEvent.dataTransfer.items
  const files = []
  for (let i = 0; i < items.length; i++) {
    const e = items[i]
    // we could filter on mime types here
    // console.log(`kind = ${e.kind} ; type = ${e.type}`)
    if (e.kind === 'file') {
      // NB: return the items rather than DataTransferItem.getAsFile() values which are not available under all use cases!
      files.push(e)
    } else {
      if (e.kind === 'string' && e.type === 'text/uri-list') {
        files.push(e)
      }
    }
  }
  return files.length ? files : false
}

const tryNewStyle = true

class FileDrop {
  constructor () {
    this.enable()
  }

  enable () { this.enabled = true }

  disable () { this.enabled = false }

  init (element, dropCallback, urlCallback, dragOverSelector) {
    // disable events for entire window?
    $(window).on('drop', false)
    $(window).on('dragover', false)
    $(window).on('dragenter', false)
    // handle drag enter for putting up the drop cloth
    // see https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
    const sel = dragOverSelector || element
    $(sel).on('dragenter', (ev) => {
      if (!this.enabled) { return }
      // only interested in file items
      if (getFileDataTransferItems(ev)) {
        // $('#dropCloth').show()
        ev.originalEvent.dataTransfer.effectAllowed = 'copyLink'
      }
    })
    // TODO bad flashing if hide on leave
    // $(sel).on('dragleave', (ev) => {
    //   $('#dropCloth').hide()
    // })
    // define the drop cloth
    // const html = tryNewStyle
    //   ? '<div id="dropCloth" class="dropClothNew"><div id="div1">div1</div><div id="div2">div2</div><div id="div3">div3</div><div id="div4">div4</div></div>'
    //   : '<div id="dropCloth" class="dropCloth"><div id="dropZone" class="dropZone">DROP FILES TO LOAD</div></div>'
    // const dc = $(html).appendTo(element).hide()
    // dc.on('dragover', false)
    // dc.on('dragenter', false)
    // dc.on('dragleave click', (_ev) => {
    //   console.log('dc dragleave click')
    //   // TODO gets triggered when moving cursor over child elements and borders for some reason
    //   // TODO adding a delay to dropCloth show and hide highlights the issue
    //   $('#dropCloth').hide()
    //   return false
    // })
    $(sel).on('drop', (ev) => {
      ev.preventDefault()
      // $('#dropCloth').hide()
      const items = getFileDataTransferItems(ev)
      if (!items) { return false }
      // here upon drop (on electron at least) we have access to getAsFile() on items
      const filePaths = items.map(x => x.getAsFile()).filter(x => !!x)
      // .map(x => x.path)
      if (filePaths.length) {
        dropCallback(filePaths)
      }
      const uriList = items.filter(e => e.kind === 'string' && e.type === 'text/uri-list')
      if (urlCallback instanceof Function && uriList.length) {
        // TODO: seems hard to get a URL from the items themselves so we pass the
        // whole event too
        urlCallback(uriList, ev)
      }
      return false
    })
  }
}

export { FileDrop }

import $ from 'jquery'
import './FileDrop.css'

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
    }
  }
  return files.length ? files : false
}

class FileDrop {
  init (element, dropCallback, dragOverSelector) {
    // first handle drag over for putting up the drop cloth
    const sel = dragOverSelector || element
    $(sel).on('dragover', (ev) => {
      // only interested in file items
      if (getFileDataTransferItems(ev)) {
        $('#dropCloth').show()
      }
    })
    // define the drop cloth
    const html = '<div id="dropCloth" class="dropCloth"><div id="dropZone" class="dropZone">DROP FILES TO LOAD</div></div>'
    const dc = $(html).appendTo(element)
    dc.on('dragover', false)
    dc.on('dragenter', false)
    dc.on('dragleave click', (_ev) => {
      $('#dropCloth').hide()
      return false
    })
    dc.on('drop', (ev) => {
      ev.preventDefault()
      $('#dropCloth').hide()
      const items = getFileDataTransferItems(ev)
      if (!items) { return false }
      // here upon drop (on electron at least) we have access to getAsFile() on items
      const filePaths = items.map(x => x.getAsFile()).filter(x => !!x)
      // .map(x => x.path)
      if (!filePaths) { return false }
      dropCallback(filePaths)
      return false
    })
  }
}

export { FileDrop }

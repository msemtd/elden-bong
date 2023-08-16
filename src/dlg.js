import jBox from 'jbox'
import 'jbox/dist/jBox.all.css'

export const errMsg = (e) => e instanceof Error && e.message ? e.message : `${e}`

export class Dlg {
  static errorDialog (error) {
    console.error(error)
    // eslint-disable-next-line new-cap
    new jBox('Modal', {
      title: 'Error',
      content: errMsg(error),
      closeButton: true,
    }).open()
  }

  static async awaitableDialog (msg, title) {
    return new Promise((resolve, _reject) => {
      new jBox('Modal', {
        title,
        content: msg,
        closeButton: true,
        onClose: () => {
          resolve()
        }
      }).open()
    })
  }

  static async awaitableConfirmDialog (msg, title) {
    return new Promise((resolve, _reject) => {
      new jBox('Modal', {
        title,
        content: msg,
        closeButton: true,
        onClose: () => {
          resolve()
        }
      }).open()
    })
  }

  static tempDialogShow (options, content) {
    // const parentElement = this.container
    const opts = {
      content,
      // appendTo: $(parentElement),
      blockScroll: false,
      overlay: false,
      closeOnEsc: true,
      animation: 'zoomIn',
      draggable: 'title',
      closeButton: true,
      dragOver: true,
      theme: 'tempDialog',
      position: {
        x: 'center',
        y: 'center',
      },
      onCloseComplete: function () { this.destroy() },
      ...options,
    }
    // eslint-disable-next-line new-cap
    const jb = new jBox('Modal', opts)
    jb.open()
    return jb
  }
}

import jBox from 'jbox'
import 'jbox/dist/jBox.all.css'

export const errMsg = (e) => e instanceof Error && e.message ? e.message : `${e}`

export class Dlg {
  static errorDialog (error) {
    console.error(error)
    // eslint-disable-next-line new-cap
    new jBox('Modal', {
      title: 'Error',
      content: errMsg(error)
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
}

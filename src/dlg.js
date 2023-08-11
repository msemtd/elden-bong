import jBox from 'jbox'
import 'jbox/dist/jBox.all.css'

export class Dlg {
  static errorDialog (error) {
    console.error(error)
    const msg = error instanceof Error && error.message ? error.message : `${error}`
    // eslint-disable-next-line new-cap
    new jBox('Modal', {
      title: 'Error',
      content: msg
    }).open()
  }
}

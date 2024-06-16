/* eslint-disable no-return-assign */
/* eslint-disable new-cap */
import van from 'vanjs-core/debug'
import { Modal } from 'vanjs-ui'
const { p, div, button } = van.tags

export class VanStuff {
  // https://vanjs.org/vanui#modal
  testModal () {
    const closed = van.state(false)
    van.add(document.body, Modal({ closed },
      p('Hello, World!'),
      div({ style: 'display: flex; justify-content: center;' },
        button({ onclick: () => closed.val = true }, 'Ok'),
      ),
    ))
  }
}

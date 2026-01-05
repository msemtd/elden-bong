import van from 'vanjs-core/debug'
import { Modal } from 'vanjs-ui'
import { shellOpenExternal } from './HandyApi'

const { div, p, h1, li, ul, button, a } = van.tags

/**
 * About Box
 */

export class AboutBox {
  static async show () {
    const closed = van.state(false)
    const clickMe = (ev) => {
      ev.preventDefault()
      shellOpenExternal(ev.currentTarget.href)
    }
    const link = (u) => { return a({ onclick: clickMe, href: u }, u) }
    van.add(document.body, Modal({ closed },
      h1('LICENSES AND ATTRIBUTION'),
      p('Many thanks to the many contributors to the many open source libraries and artworks used in this software. Quite especially...',
        ul(
          li(
            'Sky/Cloud boxes created by Zachery "skiingpenguins" Slocum (freezurbern@gmail.com) ',
            link('http://www.freezurbern.com'), ' ',
            link('https://opengameart.org/content/skiingpenguins-skybox-pack'),
            ', license: Creative Commons Attribution-ShareAlike 3.0 Unported License (',
            link('http://creativecommons.org/licenses/by-sa/3.0/'), ')'
          ),
          li(
            'Grass Texture by p0ss ', link('https://opengameart.org/node/9710'),
            ', license: GPL 2.0 (',
            link('http://www.gnu.org/licenses/old-licenses/gpl-2.0.html'), ')'
          ),
          li(
            'Anime Classroom model ', ' by ArielCastilleroV (',
            link('https://sketchfab.com/ArielCastilleroV'), ') ',
            link('https://sketchfab.com/3d-models/anime-classroom-6e17b75780c044429323cd7ab6a5b83c'),
            ', license: CC-BY-4.0 (',
            link('http://creativecommons.org/licenses/by/4.0/'), ')'
          )
        )
      ),
      div(
        button({ onclick: () => { closed.val = true } }, 'Ok')
      )
    ))
  }
}

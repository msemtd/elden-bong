import van from 'vanjs-core/debug'
import { Modal } from 'vanjs-ui'
const { div, p, br, h1, li, ul, button, a } = van.tags

/**
 * About Box
 */

export class AboutBox {
  static async show () {
    const closed = van.state(false)
    van.add(document.body, Modal({ closed },
      h1('LICENSES AND ATTRIBUTION'),
      p('Many thanks to the many contributors to the many open source libraries and artworks used in this software. Quite especially...'),
      p(
        'Sky/Cloud boxes created by Zachery "skiingpenguins" Slocum (',
        a({ href: 'mailto:freezurbern@gmail.com' },
          'freezurbern@gmail.com'
        ),
        ') ',
        a({ href: 'http://www.freezurbern.com' },
          'http://www.freezurbern.com'
        ),
        '\nContent released under the Creative Commons Attribution-ShareAlike? 3.0 Unported License.\n',
        a({ href: 'http://creativecommons.org/licenses/by-sa/3.0/' },
          'http://creativecommons.org/licenses/by-sa/3.0/'
        )
      ),
      p(
        'Grass Texture ',
        a({ href: 'https://opengameart.org/node/9710' },
          'https://opengameart.org/node/9710'
        )
      ),
      p(
        'Anime Classroom model by ArielCastilleroV (',
        a({ href: 'https://sketchfab.com/ArielCastilleroV' },
          'https://sketchfab.com/ArielCastilleroV'
        ),
        ')'
      ),
      ul(
        li(
          '"license": "CC-BY-4.0 (',
          a({ href: 'http://creativecommons.org/licenses/by/4.0/' },
            'http://creativecommons.org/licenses/by/4.0/'
          ),
          ')"'
        ),
        li(
          '"source": "',
          a({ href: 'https://sketchfab.com/3d-models/anime-classroom-6e17b75780c044429323cd7ab6a5b83c' },
            'https://sketchfab.com/3d-models/anime-classroom-6e17b75780c044429323cd7ab6a5b83c'
          ),
          '"'
        )
      ),

      div(
        br(),
        button({ onclick: () => { closed.val = true } }, 'Ok')
      )
    ))
  }
}

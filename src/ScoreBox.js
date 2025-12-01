// ScoreBox.js
import * as THREE from 'three'

export class ScoreBox extends THREE.Group {
  /**
   * A 2D text score displayed on a 3D box
   * to start off with I'll just plonk the text in a canvas and have the canvas
   * material update when the score changes.
   *
   * Best head over to the canvas tutorial again as I can never remember this stuff...
   * - https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial
   *
   * @param {boolean} buildFont try out our own pixel font just for fun right now
   */
  constructor (buildFont = false) {
    super()
    if (buildFont) {
      const fd = this.makeNumFont()
      console.dir(fd)
    }
    this.name = 'ScoreBox'
    this.score = 0
    const [h, w, d] = [1, (1 + Math.sqrt(5)) / 2, 0.25]
    const geo = new THREE.BoxGeometry(w, h, d)
    const [cw, ch] = [200, Math.floor(200 / w * h)]
    this.params = { w, h, cw, ch }
    const c = this.canvas = document.createElement('canvas')
    c.width = cw
    c.height = ch
    const texture = new THREE.CanvasTexture(c)
    const matTop = this.canvasMaterial = new THREE.MeshLambertMaterial({ map: texture })
    const matSide = new THREE.MeshLambertMaterial({ color: 'cyan' })
    const mesh = new THREE.Mesh(geo, [matSide, matSide, matSide, matSide, matTop, matSide])
    mesh.name = 'box'
    this.add(mesh)
    this.setScore(0)
  }

  setScore (newScore) {
    this.score = newScore
    const text = `${this.score}`.padStart(7, '0')
    this.drawText(this.canvas.getContext('2d'), text, this.params.cw, this.params.ch)
    this.canvasMaterial.map.needsUpdate = true
  }

  drawText (ctx, text, w, h) {
    ctx.fillStyle = 'LightYellow'
    ctx.fillRect(0, 0, w, h)
    ctx.font = '50px monospace'
    ctx.fillStyle = 'green'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText(text, Math.floor(w / 2), Math.floor(h / 2))
  }

  makeNumFont () {
    const font = {
      1: `
        .####..
        ...##..
        ...##..
        ...##..
        ...##..
        ...##..
        .######
      `,
      2: `
        .#####.
        ##...##
        ....##.
        ..###..
        .##....
        ##.....
        #######
      `,
      3: `
        .#####.
        ##...##
        .....##
        ..####.
        .....##
        ##...##
        .#####.
      `,
      4: `
        ...####
        ..##.##
        .##..##
        ##...##
        #######
        .....##
        .....##
      `,
      5: `
        #######
        ##.....
        ######.
        .....##
        .....##
        ##...##
        .#####.
      `,
      6: `
        .#####.
        ##...##
        ##.....
        ######.
        ##...##
        ##...##
        .#####.
      `,
      7: `
        #######
        ##...##
        ....##.
        ...##..
        ..##...
        .##....
        ##.....
      `,
      8: `
        .#####.
        ##...##
        ##...##
        .#####.
        ##...##
        ##...##
        .#####.
      `,
      9: `
        .#####.
        ##...##
        ##...##
        .######
        .....##
        ##...##
        .#####.
      `,
      0: `
        .#####.
        ##..###
        ##...##
        ##...##
        ##...##
        ###..##
        .#####.
      `,
    }
    return font
  }
}

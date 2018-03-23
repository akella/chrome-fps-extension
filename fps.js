
// @todo
// save coord and visibility to storage with page URL
// fix drag-pause issue
// color schemes on double click

class FPS {
  constructor() {
    this.container     = document.createElement('div')
    this.canvas        = document.createElement('canvas')
    this.ctx           = this.canvas.getContext('2d')

    this.width         = 180 // 3 sec
    this.height        = 70

    this.posX          = window.innerWidth - this.width - 20
    this.posY          = 20

    this.originalX     = this.posX
    this.originalY     = this.posY

    this.time          = performance || Date

    this.hidden        = true
    this.playing       = true
    this.startTime     = 0
    this.frame         = 0
    this.currentFPS    = 0
    this.currentTime   = 0

    this.allFPS        = Array.apply(null, Array(this.width)).map(
      Number.prototype.valueOf,
      60
    )


    this.init()
    this.loop()
  }


  init() {
    this.canvas.width  = this.width
    this.canvas.height = this.height

    this.container.style.left = `${this.posX}px`
    this.container.style.top  = `${this.posY}px`

    this.container.classList.add('fps-extension', 'is-hidden')

    this.container.appendChild(this.canvas)

    document.body.appendChild(this.container)


    this.container.addEventListener('dblclick', () => {
      this.toggle()
    })

    this.addDrag()

    chrome.storage.sync.get('hidden', data => {
      if (typeof data.hidden != "undefined") {
        this.hidden = data.hidden
      }
      if (!this.hidden) {
        this.container.classList.remove("is-hidden");
      }
    })
  }


  addDrag() {
    const diffs = {}

    let dragging = false

    this.container.onmousedown = e => {
      dragging = false
      diffs.x = e.clientX - this.posX
      diffs.y = e.clientY - this.posY

      document.onmousemove = e => {
        dragging = true

        this.posX = Math.min(Math.max(e.clientX - diffs.x, 0), window.innerWidth - this.width)
        this.posY = Math.min(Math.max(e.clientY - diffs.y, 0), window.innerHeight - this.height)

        this.move()
      }
    }

    document.onmouseup = () => {
      document.onmousemove = null
    }

    this.container.onclick = e => {
      if (!dragging) {
        this.playpause()
      } else {
        return false
      }
    }
  }


  move() {
    this.container.style.left = `${this.posX}px`
    this.container.style.top  = `${this.posY}px`
  }


  playpause() {
    this.playing = !this.playing
  }


  toggle(isFirstRun) {
    this.hidden = !this.hidden

    chrome.storage.sync.set({ hidden: this.hidden }, () => {
      if (this.hidden) {
        this.container.classList.add("is-hidden")
      } else {
        this.container.classList.remove("is-hidden")
      }
    })
  }


  add(x) {
    for (let i = this.allFPS.length; i--;) {
      this.allFPS[i] = i !== 0 ? this.allFPS[i-1] : x
    }
  }


  update() {
    this.currentFPS = this.getFPS()

    if (this.currentFPS > 57) {
      this.currentFPS = 60
    }

    this.add(this.currentFPS)
  }


  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height)


    this.ctx.fillStyle = '#fff'

    for (let i = this.width; i--;) {
      this.ctx.fillRect(i, this.height - this.allFPS[i], 1, 2)
    }


    this.ctx.fillStyle = '#212121'

    for (let i = this.width; i--;) {
      this.ctx.fillRect(i, 0, 1, this.height - this.allFPS[i])
    }

    this.ctx.font = 'bold 18px Arial'
    this.ctx.fillText(`${this.currentFPS}`, 8, 61)

    this.ctx.font = 'bold 14px Arial'
    this.ctx.fillText(`fps`, 30, 61)
  }


  loop() {
    this.requestId = window.requestAnimationFrame(this.loop.bind(this))

    if (this.hidden || !this.playing) {
      return
    }


    this.update()
    this.draw()
  }


  getFPS() {
    this.frame++

    const d = this.time.now()

    this.currentTime = (d - this.startTime) / 1000

    const result = Math.floor(this.frame / this.currentTime)

    if (this.currentTime > 1) {
      this.startTime = this.time.now()
      this.frame = 0
    }

    return result
  }

}

const fps = new FPS()

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.message === "clicked_browser_action") {
    fps.toggle()
  }
});


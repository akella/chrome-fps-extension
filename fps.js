// @todo
// save coord and visibility to storage with page URL
// fix drag-pause issue
// color schemes on double click

class FPS {
  constructor() {
    this.length = 190;
    this.height = 70;

    this.perf = performance || Date;
    this.wrap = document.createElement("div");
    this.wrap.classList.add("fps-extension");
    this.wrap.classList.add("is-hidden");
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = this.length;
    this.wrap.style.width = this.length + "px";
    this.canvas.height = this.height;
    this.wrap.style.height = this.height + "px";
    this.wrap.style.top = "10px";
    this.wrap.style.right = "10px";
    this.x = 10;
    this.y = 10;
    this.originalX = 10;
    this.originalY = 10;

    this.wrap.appendChild(this.canvas);
    document.body.appendChild(this.wrap);

    this.hidden = true;
    this.playing = true;
    this.startTime = 0;
    this.frame = 0;
    this.currentFPS = 0;

    this.ctx.font = "bold 24px Arial";
    this.allFPS = Array.apply(null, Array(this.length)).map(
      Number.prototype.valueOf,
      60
    );
    var self = this;

    this.wrap.addEventListener("dblclick", function() {
      self.toggle();
    });
    this.addDrag();
    chrome.storage.sync.get("hidden", function(data) {
      if (typeof data.hidden != "undefined") {
        self.hidden = data.hidden;
      }
      if (!self.hidden) {
        self.wrap.classList.remove("is-hidden");
        self.loop();
      }
    });
  }
  addDrag() {
    var self = this;
    var diffs = {};
    var dragging = false;

    this.wrap.onmousedown = function(e) {
      diffs.x = window.innerWidth - e.clientX - self.x;
      diffs.y = e.clientY - self.y;
      dragging = true;
      self.playpause();
    };

    document.onmouseup = function() {
      if (self.x != self.originalX && self.originalY != self.y) {
        setTimeout(function() {
          self.playpause();
        }, 100);
      }

      dragging = false;
      self.originalX = self.x;
      self.originalY = self.y;
    };

    document.onmousemove = function(e) {
      if (dragging) {
        self.x = Math.min(Math.max(window.innerWidth - e.clientX - diffs.x, 0), window.innerWidth - self.length);
        self.y = Math.min(Math.max(e.clientY - diffs.y, 0), window.innerHeight - self.height);
        self.move();
        return false;
      }
    };
  }
  move() {
    this.wrap.style.right = this.x + "px";
    this.wrap.style.top = this.y + "px";
  }
  playpause() {
    this.playing = !this.playing;
    if (this.playing) this.loop();
  }
  toggle(isFirstRun) {
    var self = this;

    self.hidden = !self.hidden;
    chrome.storage.sync.set({ hidden: self.hidden }, function() {
      if (self.hidden) {
        self.wrap.classList.add("is-hidden");
      } else {
        self.wrap.classList.remove("is-hidden");
        self.x = document.documentElement.clientWidth - self.wrap.offsetLeft - self.length;
        self.y = self.wrap.offsetTop;
        self.loop();
      }
    });
  }
  add(x) {
    this.allFPS.unshift(x);
    this.allFPS = this.allFPS.slice(0, this.length);
  }
  draw() {
    this.currentFPS = this.getFPS();
    if (this.currentFPS > 57) this.currentFPS = 60;
    this.add(this.currentFPS);
    this.ctx.clearRect(0, 0, this.length, this.height);

    for (var i = this.length - 1; i >= 0; i--) {
      this.ctx.fillStyle = "#000000";
      this.ctx.fillRect(i, 0, 1, 10 + 60 - this.allFPS[i]);
    }
    this.ctx.fillText(this.currentFPS + " fps", 31 - 15, 61 + 3);
    this.ctx.fillStyle = "#ffffff";
    for (var i = this.length - 1; i >= 0; i--) {
      this.ctx.fillRect(i, 10 + 60 - this.allFPS[i], 1, 2);
    }
    this.ctx.fillText(this.currentFPS + " fps", 30 - 15, 60 + 3);
  }
  loop() {
    var self = this;
    if (this.hidden || !this.playing) {
      return false;
    }

    window.requestAnimationFrame(function() {
      self.draw();
      self.loop();
    });
  }
  getFPS() {
    this.frame++;

    var d = this.perf.now();
    this.currentTime = (d - this.startTime) / 1000;
    var result = Math.floor(this.frame / this.currentTime);
    if (this.currentTime > 1) {
      this.startTime = this.perf.now();
      this.frame = 0;
    }

    return result;
  }
}

var fps = new FPS();
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.message === "clicked_browser_action") {
    fps.toggle();
  }
});

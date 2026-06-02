function Candidate(config) {
  var self = this;
  Draggable.call(self, config);

  // Passed properties
  self.id = config.id;
  self.size = 40;

  // GRAPHICS
  // The five "characters" (square/triangle/...) have hand-drawn images.
  // Any other id is a GENERATED candidate: a plain coloured circle, so we
  // can run realistic elections with many more candidates than seats.
  Candidate.ensure(self.id);
  var _graphics = Candidate.graphics[self.id];
  self.fill = _graphics.fill;
  if (_graphics.img) {
    self.img = new Image();
    // The model only repaints on interaction, so if the image hasn't
    // finished loading by the first paint the candidate is invisible until
    // you click. Repaint once it loads. (Set onload BEFORE src so a cached
    // image still triggers it.)
    self.img.onload = function () {
      if (config.model && config.model.update) config.model.update();
    };
    self.img.src = _graphics.img;
  } else {
    // Generated candidate: a coloured shape (stable per id) with a face.
    self.shape = Candidate.shapeFor(self.id);
  }

  self.draw = function (ctx) {
    // RETINA
    var x = self.x * 2;
    var y = self.y * 2;
    var size = self.size * 2;

    if (self.img) {
      // Hand-drawn character.
      ctx.drawImage(self.img, x - size / 2, y - size / 2, size, size);
    } else {
      // Generated candidate: draw its shape + a little face.
      var r = size * 0.45;
      _candPath(ctx, self.shape, x, y, r);
      ctx.fillStyle = self.fill;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.stroke();
      _candFace(ctx, self.shape, x, y, r);
    }
  };
}

// The shapes generated candidates can take, and a STABLE pick per id
// (so a candidate keeps the same shape across redraws).
Candidate.shapes = [
  "circle",
  "triangle",
  "square",
  "pentagon",
  "hexagon",
  "diamond",
];
Candidate.shapeFor = function (id) {
  var n = parseInt(String(id).replace(/\D/g, ""), 10) || 0;
  return Candidate.shapes[(n * 5) % Candidate.shapes.length];
};

// Trace a candidate shape's path (canvas). cx/cy/r are in retina pixels.
function _candPath(ctx, shape, cx, cy, r) {
  if (shape === "circle") {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.TAU);
    return;
  }
  var sides =
    { triangle: 3, square: 4, pentagon: 5, hexagon: 6, diamond: 4 }[shape] || 6;
  var rot = shape === "square" ? Math.TAU / 8 : -Math.TAU / 4; // point-up, or flat square
  ctx.beginPath();
  for (var i = 0; i < sides; i++) {
    var a = rot + (i * Math.TAU) / sides;
    var px = cx + r * Math.cos(a);
    var py = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

// Draw a simple ._. face, nudged down a touch for point-up shapes.
function _candFace(ctx, shape, cx, cy, r) {
  // Match the characters' faces: small eyes set high (~upper quarter),
  // and a short mouth about a quarter of the shape's width below them.
  var dy =
    shape === "triangle" ? r * 0.22 : shape === "pentagon" ? r * 0.08 : 0;
  var fcy = cy + dy; // face centre (nudged down on point-up shapes)
  var col = "rgba(0,0,0,0.6)";
  var eyeR = Math.max(2, r * 0.11);
  var eyeY = fcy - r * 0.28; // eyes up in the top portion
  var eyeDX = r * 0.28;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(cx - eyeDX, eyeY, eyeR, 0, Math.TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + eyeDX, eyeY, eyeR, 0, Math.TAU);
  ctx.fill();
  // mouth: a line ~1/4 of the shape's width (half-width = 0.25 * radius)
  var mouthHalf = r * 0.25;
  var mouthY = fcy + r * 0.22;
  ctx.strokeStyle = col;
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx - mouthHalf, mouthY);
  ctx.lineTo(cx + mouthHalf, mouthY);
  ctx.stroke();
}

// An inline SVG of a generated candidate's shape (for caption legends/seat rows).
Candidate.svgFor = function (id) {
  var g = Candidate.graphics[id];
  var fill = g ? g.fill : "#999";
  var shape = Candidate.shapeFor(id);
  var s = 18,
    c = s / 2,
    r = s * 0.46,
    inner;
  if (shape === "circle") {
    inner = "<circle cx='" + c + "' cy='" + c + "' r='" + r + "'/>";
  } else {
    var sides =
      { triangle: 3, square: 4, pentagon: 5, hexagon: 6, diamond: 4 }[shape] ||
      6;
    var rot = shape === "square" ? Math.TAU / 8 : -Math.TAU / 4;
    var pts = [];
    for (var i = 0; i < sides; i++) {
      var a = rot + (i * Math.TAU) / sides;
      pts.push(
        (c + r * Math.cos(a)).toFixed(1) +
          "," +
          (c + r * Math.sin(a)).toFixed(1),
      );
    }
    inner = "<polygon points='" + pts.join(" ") + "'/>";
  }
  return (
    "<svg class='cicon' width='" +
    s +
    "' height='" +
    s +
    "' viewBox='0 0 " +
    s +
    " " +
    s +
    "' fill='" +
    fill +
    "'>" +
    inner +
    "</svg>"
  );
};

// Extra colours for generated candidates, picked to stay distinct from each
// other AND from the five characters (blue/yellow/red/green/orange).
Candidate.extraColors = [
  "hsl(270,70%,62%)",
  "hsl(180,65%,45%)",
  "hsl(315,70%,62%)",
  "hsl(210,75%,58%)",
  "hsl(150,60%,45%)",
  "hsl(330,75%,65%)",
  "hsl(255,60%,60%)",
  "hsl(195,75%,50%)",
  "hsl(285,55%,58%)",
  "hsl(165,60%,42%)",
  "hsl(225,65%,62%)",
  "hsl(345,65%,60%)",
];

// Make sure a graphics entry exists for any id (generating one if needed).
Candidate.ensure = function (id) {
  if (Candidate.graphics[id]) return;
  var n = parseInt(String(id).replace(/\D/g, ""), 10) || 0;
  Candidate.graphics[id] = {
    img: null,
    fill: Candidate.extraColors[n % Candidate.extraColors.length],
  };
};

// CONSTANTS: the GRAPHICS!
// id => img & fill
Candidate.graphics = {
  square: {
    img: "img/square.png",
    fill: "hsl(240,80%,70%)",
  },
  triangle: {
    img: "img/triangle.png",
    fill: "hsl(45,80%,70%)",
  },
  hexagon: {
    img: "img/hexagon.png",
    fill: "hsl(0,80%,70%)",
  },
  pentagon: {
    img: "img/pentagon.png",
    fill: "hsl(90,80%,70%)",
  },
  bob: {
    img: "img/bob.png",
    fill: "hsl(30,80%,70%)",
  },
};

// -nocheck
// YES, TAU.
Math.TAU = Math.PI * 2;

// For the election sandbox code.
// The five characters have little hand-drawn icons; generated candidates
// get a matching inline SVG instead.
function _icon(name) {
  var g = typeof Candidate !== "undefined" ? Candidate.graphics[name] : null;
  if (g && !g.img) {
    return Candidate.svgFor(name);
  }
  return "<img src='img/icon/" + name + ".png'/>";
}

globalThis._icon = _icon;

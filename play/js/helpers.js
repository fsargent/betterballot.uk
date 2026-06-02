// YES, TAU.
Math.TAU = Math.PI*2;

// For the election sandbox code.
// The five characters have little hand-drawn icons; generated candidates
// (coloured circles) get a matching coloured dot instead.
function _icon(name){
	var g = (typeof Candidate !== "undefined") ? Candidate.graphics[name] : null;
	if(g && !g.img){
		return "<span class='cdot' style='background:"+g.fill+"'></span>";
	}
	return "<img src='img/icon/"+name+".png'/>";
}
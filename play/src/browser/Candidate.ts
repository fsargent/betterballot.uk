// -nocheck
function Candidate(config){

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
	if(_graphics.img){
		self.img = new Image();
		// The model only repaints on interaction, so if the image hasn't
		// finished loading by the first paint the candidate is invisible until
		// you click. Repaint once it loads. (Set onload BEFORE src so a cached
		// image still triggers it.)
		self.img.onload = function(){
			if(config.model && config.model.update) config.model.update();
		};
		self.img.src = _graphics.img;
	}

	self.draw = function(ctx){

		// RETINA
		var x = self.x*2;
		var y = self.y*2;
		var size = self.size*2;

		if(self.img){
			// Hand-drawn character.
			ctx.drawImage(self.img, x-size/2, y-size/2, size, size);
		}else{
			// Generated candidate: a coloured disc.
			ctx.beginPath();
			ctx.arc(x, y, size*0.42, 0, Math.TAU);
			ctx.fillStyle = self.fill;
			ctx.fill();
			ctx.lineWidth = 4;
			ctx.strokeStyle = "rgba(0,0,0,0.35)";
			ctx.stroke();
		}

	};

}

// Extra colours for generated candidates, picked to stay distinct from each
// other AND from the five characters (blue/yellow/red/green/orange).
Candidate.extraColors = [
	"hsl(270,70%,62%)", "hsl(180,65%,45%)", "hsl(315,70%,62%)",
	"hsl(210,75%,58%)", "hsl(150,60%,45%)", "hsl(330,75%,65%)",
	"hsl(255,60%,60%)", "hsl(195,75%,50%)", "hsl(285,55%,58%)",
	"hsl(165,60%,42%)", "hsl(225,65%,62%)", "hsl(345,65%,60%)"
];

// Make sure a graphics entry exists for any id (generating one if needed).
Candidate.ensure = function(id){
	if(Candidate.graphics[id]) return;
	var n = parseInt(String(id).replace(/\D/g, ""), 10) || 0;
	Candidate.graphics[id] = {
		img: null,
		fill: Candidate.extraColors[n % Candidate.extraColors.length]
	};
};

// CONSTANTS: the GRAPHICS!
// id => img & fill
Candidate.graphics = {
	square: {
		img: "img/square.png",
		fill: "hsl(240,80%,70%)"
	},
	triangle: {
		img: "img/triangle.png",
		fill: "hsl(45,80%,70%)"
	},
	hexagon: {
		img: "img/hexagon.png",
		fill: "hsl(0,80%,70%)"
	},
	pentagon: {
		img: "img/pentagon.png",
		fill: "hsl(90,80%,70%)"
	},
	bob: {
		img: "img/bob.png",
		fill: "hsl(30,80%,70%)"
	}
};

globalThis.Candidate = Candidate;

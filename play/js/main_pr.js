// PROPORTIONAL (multi-winner) simulator.
// A trimmed cousin of main_sandbox.js: same Model + draggables, but the
// voting-system switcher offers the three PROPORTIONAL methods, plus a
// "how many seats?" control. The election methods live in Election.js.

window.HACK_BIG_RANGE = true;
window.ONLY_ONCE = false;

function main(config){

	// ONCE.
	if(ONLY_ONCE) return;
	ONLY_ONCE = true;

	// Defaults...
	config = config || {};
	config.system = config.system || "Party List";
	config.candidates = config.candidates || 9;
	config.voters = config.voters || 1;
	config.seats = config.seats || 5;
	var initialConfig = JSON.parse(JSON.stringify(config));

	// Which proportional voting systems? (ballot type follows the method)
	// Names are spelled out (no confusing acronyms).
	var votingSystems = [
		{name:"Party List", voter:PluralityVoter, election:Election.partylist},
		{name:"Single Transferable Vote", voter:RankedVoter, election:Election.stv},
		{name:"Proportional Choose Many", voter:ApprovalVoter, election:Election.spav}
	];

	Loader.onload = function(){

		// THE MODEL
		window.model = new Model();
		document.querySelector("#center").appendChild(model.dom);
		model.dom.removeChild(model.caption);
		document.querySelector("#right").appendChild(model.caption);
		model.caption.style.width = "";

		// INIT!
		model.onInit = function(){

			model.numOfCandidates = config.candidates;
			model.numOfVoters = config.voters;
			model.system = config.system;
			model.seats = config.seats;

			var votingSystem = votingSystems.filter(function(system){
				return (system.name==model.system);
			})[0];
			model.voterType = votingSystem.voter;
			model.election = votingSystem.election;

			// Voters (one or more crowds)
			var num = model.numOfVoters;
			var voterPositions;
			if(num==1){
				voterPositions = [[150,150]];
			}else if(num==2){
				voterPositions = [[150,100],[150,200]];
			}else{
				voterPositions = [[150,115],[115,180],[185,180]];
			}
			for(var i=0; i<num; i++){
				var pos = voterPositions[i];
				model.addVoters({
					dist: GaussianVoters,
					type: model.voterType,
					num:(4-num),
					x:pos[0], y:pos[1]
				});
			}

			// Candidates, spread evenly around a ring. Realistic elections
			// have MANY candidates competing for a few seats, so the first
			// five are our characters and the rest are coloured circles.
			var shapes = ["square","triangle","hexagon","pentagon","bob"];
			var n = model.numOfCandidates;
			var r = 108;
			for(var i=0; i<n; i++){
				var id = (i<shapes.length) ? shapes[i] : ("c"+i);
				var angle = Math.TAU*(i/n) - Math.TAU/4; // start at top
				var x = 150 + r*Math.cos(angle);
				var y = 150 + r*Math.sin(angle);
				model.addCandidate(id, x, y);
			}

		};
		model.onUpdate = function(){
			model.election(model, {sidebar:true, seats:model.seats});
		};

		// Put candidates/voters at any preset positions, then update.
		var setInPosition = function(){
			var positions = config.candidatePositions;
			if(positions){
				for(var i=0; i<positions.length; i++){
					model.candidates[i].x = positions[i][0];
					model.candidates[i].y = positions[i][1];
				}
			}
			positions = config.voterPositions;
			if(positions){
				for(var i=0; i<positions.length; i++){
					model.voters[i].x = positions[i][0];
					model.voters[i].y = positions[i][1];
				}
			}
			model.update();
		};

		// Save current positions (used when switching counts)
		window.save = function(){
			var c = [];
			for(var i=0; i<model.candidates.length; i++){
				c.push([Math.round(model.candidates[i].x), Math.round(model.candidates[i].y)]);
			}
			var v = [];
			for(var i=0; i<model.voters.length; i++){
				v.push([Math.round(model.voters[i].x), Math.round(model.voters[i].y)]);
			}
			return { candidatePositions:c, voterPositions:v };
		};


		///////// BUTTONS /////////

		// Voting system (hidden on the single-method demos)
		if(!config.hideSystem){
			var onChooseSystem = function(data){
				config.system = data.name;
				model.system = data.name;
				model.voterType = data.voter;
				for(var i=0; i<model.voters.length; i++) model.voters[i].setType(data.voter);
				model.election = data.election;
				model.update();
			};
			window.chooseSystem = new ButtonGroup({
				label: "what voting system?",
				width: 190,
				data: votingSystems,
				onChoose: onChooseSystem
			});
			document.querySelector("#left").appendChild(chooseSystem.dom);
		}

		// How many seats?
		var seatChoices = [
			{name:"3", num:3, margin:6},
			{name:"5", num:5, margin:6},
			{name:"7", num:7}
		];
		var onChooseSeats = function(data){
			config.seats = data.num;
			model.seats = data.num;
			model.update();
		};
		window.chooseSeats = new ButtonGroup({
			label: "how many seats?",
			width: 56,
			data: seatChoices,
			onChoose: onChooseSeats
		});
		document.querySelector("#left").appendChild(chooseSeats.dom);

		// How many candidates/parties? (realistic: more than there are seats)
		var candidateChoices = [
			{name:"5", num:5, margin:5},
			{name:"9", num:9, margin:5},
			{name:"13", num:13}
		];
		var onChooseCandidates = function(data){
			config.candidates = data.num;
			config.voterPositions = save().voterPositions;
			config.candidatePositions = null;
			model.reset();
			setInPosition();
		};
		window.chooseCandidates = new ButtonGroup({
			label: "how many candidates?",
			width: 64,
			data: candidateChoices,
			onChoose: onChooseCandidates
		});
		document.querySelector("#left").appendChild(chooseCandidates.dom);


		///////// INIT /////////

		model.onInit();
		setInPosition();

		var selectUI = function(){
			if(window.chooseSystem) chooseSystem.highlight("name", model.system);
			chooseSeats.highlight("num", model.seats);
			chooseCandidates.highlight("num", model.numOfCandidates);
		};
		selectUI();


		///////// RESET /////////

		var resetDOM = document.createElement("div");
		resetDOM.id = "reset";
		resetDOM.innerHTML = "reset";
		resetDOM.style.top = "340px";
		resetDOM.style.left = "350px";
		resetDOM.onclick = function(){
			config = JSON.parse(JSON.stringify(initialConfig));
			model.reset(true);
			model.onInit();
			setInPosition();
			selectUI();
		};
		document.body.appendChild(resetDOM);

	};

	Loader.load([
		"img/voter_face.png",
		"img/square.png",
		"img/triangle.png",
		"img/hexagon.png",
		"img/pentagon.png",
		"img/bob.png"
	]);

}

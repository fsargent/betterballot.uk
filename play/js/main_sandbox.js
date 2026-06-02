window.FULL_SANDBOX = window.FULL_SANDBOX || false;
window.HACK_BIG_RANGE = true;

window.ONLY_ONCE = false;

function main(config){

	// ONCE.
	if(ONLY_ONCE) return;
	ONLY_ONCE=true;

	///////////////////////////////////////////////////////////////
	// ACTUALLY... IF THERE'S DATA IN THE QUERY STRING, OVERRIDE //
	///////////////////////////////////////////////////////////////

	var _getParameterByName = function(name, url){
		var url = window.top.location.href;
		name = name.replace(/[\[\]]/g, "\\$&");
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	};
	var modelData = _getParameterByName("m");
	if(modelData){

		// Parse!
		var data = JSON.parse(modelData);

		// Turn into initial config
		config = {
			features: 4,
			system: data.s,
			seats: data.k || 3,
			candidates: data.c.length,
			candidatePositions: data.c,
			voters: data.v.length,
			voterPositions: data.v,
			description: data.d
		};

	}

	// Defaults...
	config = config || {};
	config.system = config.system || "FPTP / Choose one";
	config.candidates = config.candidates || 3;
	config.voters = config.voters || 1;
	config.seats = config.seats || 3; // only used by proportional methods
	config.features = config.features || 1; // 1-basic, 2-voters, 3-candidates, 4-save
	var initialConfig = JSON.parse(JSON.stringify(config));

	Loader.onload = function(){

		////////////////////////
		// THE FRIGGIN' MODEL //
		////////////////////////

		window.model = new Model();
		document.querySelector("#center").appendChild(model.dom);
		model.dom.removeChild(model.caption);
		document.querySelector("#right").appendChild(model.caption);
		model.caption.style.width = "";

		// INIT!
		model.onInit = function(){

			// Based on config... what should be what?
			model.numOfCandidates = config.candidates;
			model.numOfVoters = config.voters;
			model.system = config.system;
			model.seats = config.seats;
			var votingSystem = votingSystems.filter(function(system){
				return(system.name==model.system);
			})[0];
			model.voterType = votingSystem.voter;
			model.election = votingSystem.election;

			// Voters
			var num = model.numOfVoters;
			var voterPositions;
			if(num==1){
				voterPositions = [[150,150]];
			}else if(num==2){
				voterPositions = [[150,100],[150,200]];
			}else if(num==3){
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

			// Candidates, evenly around a ring. First five are the
			// characters; any beyond that are generated coloured circles.
			var shapes = ["square","triangle","hexagon","pentagon","bob"];
			var num = model.numOfCandidates;
			var r = (num>5) ? 108 : 100;
			for(var i=0; i<num; i++){
				var id = (i<shapes.length) ? shapes[i] : ("c"+i);
				var a = Math.TAU*(i/num) - Math.TAU/4; // start at top
				var x = 150 + r*Math.cos(a);
				var y = 150 + r*Math.sin(a);
				model.addCandidate(id, x, y);
			}

		};
		model.election = Election.plurality;
		model.onUpdate = function(){
			model.election(model, {sidebar:true, seats:model.seats});
		};

		// In Position!
		var setInPosition = function(){

			var positions;
			
			// CANDIDATE POSITIONS
			positions = config.candidatePositions;
			if(positions){
				for(var i=0; i<positions.length; i++){
					var position = positions[i];
					var candidate = model.candidates[i];
					candidate.x = position[0];
					candidate.y = position[1];
				}
			}

			// VOTER POSITION
			positions = config.voterPositions;
			if(positions){
				for(var i=0; i<positions.length; i++){
					var position = positions[i];
					var voter = model.voters[i];
					voter.x = position[0];
					voter.y = position[1];
				}
			}

			// update!
			model.update();

		};


		//////////////////////////////////
		// BUTTONS - WHAT VOTING SYSTEM //
		//////////////////////////////////

		// Which voting system? Single-winner always; the proportional
		// (multi-seat) methods join in the full sandbox (features>=4).
		var votingSystems = [
			{name:"FPTP / Choose one", voter:PluralityVoter, election:Election.plurality},
			{name:"Alternative Vote", voter:RankedVoter, election:Election.irv},
			{name:"Choose many", voter:ApprovalVoter, election:Election.approval}
		];
		if(initialConfig.features>=4){
			votingSystems = votingSystems.concat([
				{name:"Party List", voter:PluralityVoter, election:Election.partylist, proportional:true},
				{name:"Single Transferable Vote", voter:RankedVoter, election:Election.stv, proportional:true},
				{name:"Proportional Choose Many", voter:ApprovalVoter, election:Election.spav, proportional:true}
			]);
		}
		var onChooseSystem = function(data){

			// update config...
			config.system = data.name;

			// no reset...
			model.voterType = data.voter;
			for(var i=0;i<model.voters.length;i++){
				model.voters[i].setType(data.voter);
			}
			model.election = data.election;

			// Show the seats control only for proportional methods.
			if(window.chooseSeats) chooseSeats.dom.style.display = data.proportional ? "" : "none";

			model.update();

		};
		window.chooseSystem = new ButtonGroup({
			label: "what voting system?",
			width: 200,
			data: votingSystems,
			onChoose: onChooseSystem
		});
		document.querySelector("#left").appendChild(chooseSystem.dom);

		// How many seats? (proportional methods only)
		if(initialConfig.features>=4){
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
		}

		// How many voters?
		if(initialConfig.features>=2){ // CANDIDATES as feature.

			var voters = [
				{name:"one", num:1, margin:5},
				{name:"two", num:2, margin:5},
				{name:"three", num:3},
			];
			var onChooseVoters = function(data){

				// update config...
				config.voters = data.num;

				// save candidates before switching!
				config.candidatePositions = save().candidatePositions;

				// reset!
				config.voterPositions = null;
				model.reset();
				setInPosition();

			};
			window.chooseVoters = new ButtonGroup({
				label: "how many groups of voters?",
				width: 70,
				data: voters,
				onChoose: onChooseVoters
			});
			document.querySelector("#left").appendChild(chooseVoters.dom);

		}

		// How many candidates?
		if(initialConfig.features>=3){ // VOTERS as feature.

			var candidates = [
				{name:"2", num:2, margin:4},
				{name:"3", num:3, margin:4},
				{name:"5", num:5, margin:4},
				{name:"9", num:9, margin:4},
				{name:"13", num:13}
			];
			var onChooseCandidates = function(data){

				// update config...
				config.candidates = data.num;

				// save voters before switching!
				config.voterPositions = save().voterPositions;

				// reset!
				config.candidatePositions = null;
				model.reset();
				setInPosition();

			};
			window.chooseCandidates = new ButtonGroup({
				label: "how many candidates?",
				width: 52,
				data: candidates,
				onChoose: onChooseCandidates
			});
			document.querySelector("#left").appendChild(chooseCandidates.dom);

		}


		///////////////////////
		//////// INIT! ////////
		///////////////////////

		model.onInit(); // NOT init, coz don't update yet...
		setInPosition();

		// Select the UI!
		var selectUI = function(){
			if(window.chooseSystem) chooseSystem.highlight("name", model.system);
			if(window.chooseCandidates) chooseCandidates.highlight("num", model.numOfCandidates);
			if(window.chooseVoters) chooseVoters.highlight("num", model.numOfVoters);
			if(window.chooseSeats){
				chooseSeats.highlight("num", model.seats);
				// Only relevant for proportional systems.
				var sys = votingSystems.filter(function(s){ return s.name==model.system; })[0];
				chooseSeats.dom.style.display = (sys && sys.proportional) ? "" : "none";
			}
		};
		selectUI();


		//////////////////////////
		//////// RESET... ////////
		//////////////////////////

		// CREATE A RESET BUTTON
		var resetDOM = document.createElement("div");
		resetDOM.id = "reset";
		resetDOM.innerHTML = "reset";
		resetDOM.style.top = "340px";
		resetDOM.style.left = "350px";
		resetDOM.onclick = function(){
			
			config = JSON.parse(JSON.stringify(initialConfig)); // RESTORE IT!

			// Reset manually, coz update LATER.
			model.reset(true);
			model.onInit();
			setInPosition();
			
			// Back to ol' UI
			selectUI();

		};
		document.body.appendChild(resetDOM);



		///////////////////////////
		////// SAVE POSITION //////
		///////////////////////////

		window.save = function(log){

			// Candidate positions
			var positions = [];
			for(var i=0; i<model.candidates.length; i++){
				var candidate = model.candidates[i];
				positions.push([
					Math.round(candidate.x),
					Math.round(candidate.y)
				]);
			}
			if(log) console.log("candidatePositions: "+JSON.stringify(positions));
			var candidatePositions = positions;

			// Voter positions
			positions = [];
			for(var i=0; i<model.voters.length; i++){
				var voter = model.voters[i];
				positions.push([
					Math.round(voter.x),
					Math.round(voter.y)
				]);
			}
			if(log) console.log("voterPositions: "+JSON.stringify(positions));
			var voterPositions = positions;

			// positions!
			return {
				candidatePositions: candidatePositions,
				voterPositions: voterPositions
			};

		};



		//////////////////////////////////
		/////// SAVE & SHARE, YO! ////////
		//////////////////////////////////

		var descText, linkText;
		if(initialConfig.features>=4){ // SAVE & SHARE as feature.

			// Create a description up top
			var descDOM = document.createElement("div");
			descDOM.id = "description_container";
			var refNode = document.getElementById("left");
			document.body.insertBefore(descDOM, refNode);
			descText = document.createElement("textarea");
			descText.id = "description_text";
			descDOM.appendChild(descText);

			// yay.
			descText.value = initialConfig.description;

			// Move that reset button (below the taller button column)
			resetDOM.style.top = "560px";
			resetDOM.style.left = "0px";

			// Create a "save" button
			var saveDOM = document.createElement("div");
			saveDOM.id = "save";
			saveDOM.innerHTML = "save:";
			saveDOM.onclick = function(){
				_saveModel();
			};

			// The share link textbox
			linkText = document.createElement("input");
			linkText.id = "savelink";
			linkText.placeholder = "[when you save your model, a link you can copy will show up here]";
			linkText.setAttribute("readonly", true);
			linkText.onclick = function(){
				linkText.select();
			};

			// Flow reset + save + link in a row BELOW the button column,
			// so they never overlap (the column height varies by method).
			var controlsRow = document.createElement("div");
			controlsRow.id = "controls_row";
			controlsRow.appendChild(resetDOM);
			controlsRow.appendChild(saveDOM);
			controlsRow.appendChild(linkText);
			document.body.appendChild(controlsRow);

		}
		

	};

	Loader.load([
		"img/voter_face.png",
		"img/square.png",
		"img/triangle.png",
		"img/hexagon.png",
		"img/pentagon.png",
		"img/bob.png"
	]);

	// SAVE & PARSE
	// ?m={s:[system], v:[voterPositions], c:[candidatePositions], d:[description]}
	var _saveModel = function(){

		// Data!
		var data = {};

		// System?
		data.s = config.system;
		data.k = config.seats; // seats (for proportional methods)
		console.log("voting system: "+data.s);

		// Positions...
		var positions = save(true);
		data.v = positions.voterPositions;
		data.c = positions.candidatePositions;

		// Description
		var description = document.getElementById("description_text");
		data.d = description.value;
		console.log("description: "+data.d);

		// URI ENCODE!
		var uri = encodeURIComponent(JSON.stringify(data));

		// ALSO TURN IT INTO INITIAL CONFIG. _parseModel
		initialConfig = {
			features: 4,
			system: data.s,
			seats: data.k || 3,
			candidates: data.c.length,
			candidatePositions: data.c,
			voters: data.v.length,
			voterPositions: data.v
		};

		// Put it in the save link box!
		var link = "https://betterballot.uk/sandbox?m="+uri;
		var savelink = document.getElementById("savelink");
		savelink.value = "saving...";
		setTimeout(function(){
			savelink.value = link;
		},750);

	};

	// FUNNY HACK.
	setInterval(function(){
		var ohno = document.getElementById("ohno");
		if(!ohno) return;
		var x = Math.round(Math.random()*10-5);
		var y = Math.round(Math.random()*10)+10;
		ohno.style.top = y+"px";
		ohno.style.left = x+"px";
	},10);

};
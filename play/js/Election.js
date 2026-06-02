/****************************

SINGLETON CLASS on how to COUNT UP THE BALLOTS
and RENDER IT INTO THE CAPTION

*****************************/

var Election = {};

var _candidateIds = function(model){
	var ids = [];
	for(var i=0; i<model.candidates.length; i++){
		ids.push(model.candidates[i].id);
	}
	return ids;
};

Election.score = function(model, options){

	// Tally the approvals & get winner!
	var result = ElectionCore.score(_candidateIds(model), model.getBallots());
	var tally = result.tally;
	var winner = result.winner;
	var color = _colorWinner(model, winner);

	// NO WINNER?! OR TIE?!?!
	if(!winner){

		var text = "<b>NOBODY WINS</b>";
		model.caption.innerHTML = text;

	}else{

		// Caption
		var text = "";
		text += "<span class='small'>";
		text += "<b>highest average score wins</b><br>";
		for(var i=0; i<model.candidates.length; i++){
			var c = model.candidates[i].id;
			text += _icon(c)+"'s score: "+(tally[c].toFixed(2))+" out of 5.00<br>";
		}
		text += "<br>";
		text += _icon(winner)+" has the highest score, so...<br>";
		text += "</span>";
		text += "<br>";
		text += "<b style='color:"+color+"'>"+winner.toUpperCase()+"</b> WINS";
		model.caption.innerHTML = text;

	}

};

Election.approval = function(model, options){

	// Tally the approvals & get winner!
	var result = ElectionCore.approval(_candidateIds(model), model.getBallots());
	var tally = result.tally;
	var winner = result.winner;
	var color = _colorWinner(model, winner);

	// NO WINNER?! OR TIE?!?!
	if(!winner){

		var text = "<b>NOBODY WINS</b>";
		model.caption.innerHTML = text;

	}else{

		// Caption
		var text = "";
		text += "<span class='small'>";
		text += "<b>most approvals wins</b><br>";
		for(var i=0; i<model.candidates.length; i++){
			var c = model.candidates[i].id;
			text += _icon(c)+" got "+tally[c]+" approvals<br>";
		}
		text += "<br>";
		text += _icon(winner)+" is most approved, so...<br>";
		text += "</span>";
		text += "<br>";
		text += "<b style='color:"+color+"'>"+winner.toUpperCase()+"</b> WINS";
		model.caption.innerHTML = text;

	}

};

Election.condorcet = function(model, options){

	var text = "";
	text += "<span class='small'>";
	text += "<b>who wins each one-on-one?</b><br>";

	var result = ElectionCore.condorcet(_candidateIds(model), model.getBallots());
	for(var i=0; i<result.contests.length; i++){
		var contest = result.contests[i];
		text += _icon(contest.a)+" vs "+_icon(contest.b)+": "+_icon(contest.winner)+" wins by "+contest.by+" to "+contest.to+"<br>";
	}

	var topWinner = result.winner;

	// Winner... or NOT!!!!
	text += "<br>";
	if(topWinner){
		var color = _colorWinner(model, topWinner);
		text += _icon(topWinner)+" beats all other candidates in one-on-one races.<br>";
		text += "</span>";
		text += "<br>";
		text += "<b style='color:"+color+"'>"+topWinner.toUpperCase()+"</b> WINS";
	}else{
		model.canvas.style.borderColor = "#000"; // BLACK.
		text += "NOBODY beats everyone else in one-on-one races.<br>";
		text += "</span>";
		text += "<br>";
		text += "THERE'S NO WINNER.<br>";
		text += "<b id='ohno'>OH NO.</b>";
	}

	// what's the loop?

	model.caption.innerHTML = text;

};

Election.borda = function(model, options){

	// Tally the approvals & get winner!
	var result = ElectionCore.borda(_candidateIds(model), model.getBallots());
	var tally = result.tally;
	var winner = result.winner; // LOWER score is best!
	var color = _colorWinner(model, winner);

	// NO WINNER?! OR TIE?!?!
	if(!winner){

		var text = "<b>NOBODY WINS</b>";
		model.caption.innerHTML = text;

	}else{

		// Caption
		var text = "";
		text += "<span class='small'>";
		text += "<b>lower score is better</b><br>";
		for(var i=0; i<model.candidates.length; i++){
			var c = model.candidates[i].id;
			text += _icon(c)+"'s total score: "+tally[c]+"<br>";
		}
		text += "<br>";
		text += _icon(winner)+" has the <i>lowest</i> score, so...<br>";
		text += "</span>";
		text += "<br>";
		text += "<b style='color:"+color+"'>"+winner.toUpperCase()+"</b> WINS";
		model.caption.innerHTML = text;

	}

};

Election.irv = function(model, options){

	var text = "";
	text += "<span class='small'>";

	var result = ElectionCore.irv(_candidateIds(model), model.getBallots());
	var finalWinner = result.winner;
	for(var r=0; r<result.rounds.length; r++){
		var round = result.rounds[r];
		var candidates = Object.keys(round.tally);

		text += "<b>round "+round.round+":</b><br>";
		text += "who's voters' #1 choice?<br>";

		// Say 'em...
		for(var i=0; i<candidates.length; i++){
			var c = candidates[i];
			text += _icon(c)+":"+round.tally[c];
			if(i<candidates.length-1) text+=", ";
		}
		text += "<br>";

		if(round.winner){
			text += _icon(round.winner)+" has more than 50%<br>";
			break;
		}

		text += "nobody's more than 50%. ";
		text += "eliminate loser, "+_icon(round.eliminated)+". next round!<br><br>";
	}

	// END!
	var color = _colorWinner(model, finalWinner);
	text += "</span>";
	text += "<br>";
	text += "<b style='color:"+color+"'>"+finalWinner.toUpperCase()+"</b> WINS";
	model.caption.innerHTML = text;


};

Election.plurality = function(model, options){

	options = options || {};

	// Tally the approvals & get winner!
	var result = ElectionCore.plurality(_candidateIds(model), model.getBallots());
	var tally = result.tally;
	var winner = result.winner;
	var color = _colorWinner(model, winner);

	// Caption
	var text = "";
	text += "<span class='small'>";
	if(options.sidebar){
		text += "<b>most votes wins</b><br>";
	}
	for(var i=0; i<model.candidates.length; i++){
		var c = model.candidates[i].id;
		if(options.sidebar){
			text += _icon(c)+" got "+tally[c]+" votes<br>";
		}else{
			text += c+": "+tally[c];
			if(options.verbose) text+=" votes";
			if(i<model.candidates.length-1) text+=", ";
		}
	}
	if(options.sidebar){
		text += "<br>";
		text += _icon(winner)+" has most votes, so...<br>";
	}
	text += "</span>";
	text += "<br>";
	text += "<b style='color:"+color+"'>"+winner.toUpperCase()+"</b> WINS";
	model.caption.innerHTML = text;

};

var _tally = function(model, tallyFunc){

	// Create the tally
	var tally = {};
	for(var candidateID in model.candidatesById) tally[candidateID] = 0;

	// Count 'em up
	var ballots = model.getBallots();
	for(var i=0; i<ballots.length; i++){
		tallyFunc(tally, ballots[i]);
	}
	
	// Return it.
	return tally;

}

var _countWinner = function(tally){
	return ElectionCore.chooseHighest(tally);

}

var _countLoser = function(tally){
	return ElectionCore.chooseLowest(tally);

}

var _colorWinner = function(model, winner){
	var color = (winner) ? Candidate.graphics[winner].fill : "";
	model.canvas.style.borderColor = color;
	return color;
}


/****************************

PROPORTIONAL (MULTI-WINNER) METHODS

These elect SEVERAL representatives at once, so a parliament's makeup
roughly matches how everyone voted. They re-use the same ballots as the
single-winner methods:
- Party List re-uses Plurality ballots  ({ vote: id })   -- each shape is a "party"
- SPAV       re-uses Approval ballots   ({ approved: [] })
- STV        re-uses Ranked ballots     ({ rank: [] })

*****************************/

// How many seats are we filling? (set per-sim; default 5)
var _seats = function(model, options){
	options = options || {};
	return options.seats || model.seats || 5;
};

// A coloured row of little icons showing who got the seats.
var _seatRow = function(seatWinners){
	var row = "<div class='seats'>";
	for(var i=0; i<seatWinners.length; i++){
		row += _icon(seatWinners[i]);
	}
	row += "</div>";
	return row;
};

// Multi-winner elections don't have one winner, so paint the border neutral.
var _neutralBorder = function(model){
	model.canvas.style.borderColor = "#999";
};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// PARTY LIST (closed list, Sainte-Laguë)
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Election.partylist = function(model, options){

	var seats = _seats(model, options);
	_neutralBorder(model);

	var result = ElectionCore.partyList(_candidateIds(model), model.getBallots(), seats);
	var tally = result.tally;
	var seatsWon = result.seatsWon;
	var seatWinners = result.seatWinners;

	// Caption
	var text = "";
	text += "<span class='small'>";
	text += "<b>seats shared out in proportion to votes</b><br>";
	text += "("+seats+" seats)<br><br>";
	for(var i=0; i<model.candidates.length; i++){
		var c = model.candidates[i].id;
		text += _icon(c)+" "+tally[c]+" votes &rarr; <b>"+seatsWon[c]+"</b> seat"+(seatsWon[c]==1?"":"s")+"<br>";
	}
	text += "</span>";
	text += _seatRow(seatWinners);
	model.caption.innerHTML = text;

};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// SPAV - Sequential Proportional Approval Voting
// (a.k.a. Reweighted Approval Voting / RAV)
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Election.spav = function(model, options){

	var seats = _seats(model, options);
	_neutralBorder(model);

	var result = ElectionCore.spav(_candidateIds(model), model.getBallots(), seats);
	var elected = result.elected;
	var text = "<span class='small'>";

	for(var s=0; s<result.rounds.length; s++){
		var round = result.rounds[s];
		text += "seat "+round.seat+": "+_icon(round.winner)+" (score "+round.score.toFixed(1)+")<br>";
	}

	text += "</span>";
	text += _seatRow(elected);
	model.caption.innerHTML = text;

};

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// STV - Single Transferable Vote
// (Droop quota + fractional Gregory surplus transfer)
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Election.stv = function(model, options){

	var seats = _seats(model, options);
	_neutralBorder(model);

	var result = ElectionCore.stv(_candidateIds(model), model.getBallots(), seats);
	var quota = result.quota;
	var elected = result.elected;

	var text = "<span class='small'>";
	text += "<b>quota to win a seat: "+quota+"</b><br><br>";

	for(var i=0; i<result.rounds.length; i++){
		var round = result.rounds[i];
		if(round.action=="last-seats"){
			for(var j=0; j<round.candidates.length; j++){
				text += _icon(round.candidates[j])+" elected (last seats)<br>";
			}
		}else if(round.action=="elected"){
			text += _icon(round.candidate)+" reaches quota &rarr; elected ("+round.votes.toFixed(0)+")<br>";
		}else{
			text += _icon(round.candidate)+" eliminated, votes transfer<br>";
		}
	}

	text += "</span>";
	text += _seatRow(elected);
	model.caption.innerHTML = text;

};

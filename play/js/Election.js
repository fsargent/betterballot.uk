/****************************

SINGLETON CLASS on how to COUNT UP THE BALLOTS
and RENDER IT INTO THE CAPTION

*****************************/

var Election = {};

Election.score = function(model, options){

	// Tally the approvals & get winner!
	var tally = _tally(model, function(tally, ballot){
		for(var candidate in ballot){
			tally[candidate] += ballot[candidate];
		}
	});
	for(var candidate in tally){
		tally[candidate] /= model.getTotalVoters();
	}
	var winner = _countWinner(tally);
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
	var tally = _tally(model, function(tally, ballot){
		var approved = ballot.approved;
		for(var i=0; i<approved.length; i++) tally[approved[i]]++;
	});
	var winner = _countWinner(tally);
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

	var ballots = model.getBallots();

	// Create the WIN tally
	var tally = {};
	for(var candidateID in model.candidatesById) tally[candidateID] = 0;

	// For each combination... who's the better ranking?
	for(var i=0; i<model.candidates.length-1; i++){
		var a = model.candidates[i];
		for(var j=i+1; j<model.candidates.length; j++){
			var b = model.candidates[j];

			// Actually figure out who won.
			var aWins = 0;
			var bWins = 0;
			for(var k=0; k<ballots.length; k++){
				var rank = ballots[k].rank;
				if(rank.indexOf(a.id)<rank.indexOf(b.id)){
					aWins++; // a wins!
				}else{
					bWins++; // b wins!
				}
			}

			// WINNER?
			var winner = (aWins>bWins) ? a : b;
			tally[winner.id]++;

			// Text.
			var by,to;
			if(winner==a){
				by = aWins;
				to = bWins;
			}else{
				by = bWins;
				to = aWins;
			}
			text += _icon(a.id)+" vs "+_icon(b.id)+": "+_icon(winner.id)+" wins by "+by+" to "+to+"<br>";

		}
	}

	// Was there one who won all????
	var topWinner = null;
	for(var id in tally){
		if(tally[id]==model.candidates.length-1){
			topWinner = id;
		}
	}

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
	var tally = _tally(model, function(tally, ballot){
		for(var i=0; i<ballot.rank.length; i++){
			var candidate = ballot.rank[i];
			tally[candidate] += i; // the rank!
		}
	});
	var winner = _countLoser(tally); // LOWER score is best!
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

	var finalWinner = null;
	var roundNum = 1;

	var candidates = [];
	for(var i=0; i<model.candidates.length; i++){
		candidates.push(model.candidates[i].id);
	}

	while(!finalWinner){

		text += "<b>round "+roundNum+":</b><br>";
		text += "who's voters' #1 choice?<br>";

		// Tally the approvals & get winner!
		var pre_tally = _tally(model, function(tally, ballot){
			var first = ballot.rank[0]; // just count #1
			tally[first]++;
		});

		// ONLY tally the remaining candidates...
		var tally = {};
		for(var i=0; i<candidates.length; i++){
			var cID = candidates[i];
			tally[cID] = pre_tally[cID];
		}

		// Say 'em...
		for(var i=0; i<candidates.length; i++){
			var c = candidates[i];
			text += _icon(c)+":"+tally[c];
			if(i<candidates.length-1) text+=", ";
		}
		text += "<br>";

		// Do they have more than 50%?
		var winner = _countWinner(tally);
		var ratio = tally[winner]/model.getTotalVoters();
		if(ratio>=0.5){
			finalWinner = winner;
			text += _icon(winner)+" has more than 50%<br>";
			break;
		}

		// Otherwise... runoff...
		var loser = _countLoser(tally);
		text += "nobody's more than 50%. ";
		text += "eliminate loser, "+_icon(loser)+". next round!<br><br>";

		// ACTUALLY ELIMINATE
		candidates.splice(candidates.indexOf(loser), 1); // remove from candidates...
		var ballots = model.getBallots();
		for(var i=0; i<ballots.length; i++){
			var rank = ballots[i].rank;
			rank.splice(rank.indexOf(loser), 1); // REMOVE THE LOSER
		}

		// And repeat!
		roundNum++;
	
	}

	// END!
	var color = _colorWinner(model, finalWinner);
	text += "</span>";
	text += "<br>";
	text += "<b style='color:"+color+"'>"+winner.toUpperCase()+"</b> WINS";
	model.caption.innerHTML = text;


};

Election.plurality = function(model, options){

	options = options || {};

	// Tally the approvals & get winner!
	var tally = _tally(model, function(tally, ballot){
		tally[ballot.vote]++;
	});
	var winner = _countWinner(tally);
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

	// TO DO: TIES as an array?!?!

	var highScore = -1;
	var winner = null;

	for(var candidate in tally){
		var score = tally[candidate];
		if(score>highScore){
			highScore = score;
			winner = candidate;
		}
	}

	return winner;

}

var _countLoser = function(tally){

	// TO DO: TIES as an array?!?!

	var lowScore = Infinity;
	var winner = null;

	for(var candidate in tally){
		var score = tally[candidate];
		if(score<lowScore){
			lowScore = score;
			winner = candidate;
		}
	}

	return winner;

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
// PARTY LIST (closed list, D'Hondt / Jefferson)
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Election.partylist = function(model, options){

	var seats = _seats(model, options);
	_neutralBorder(model);

	// Each candidate-shape is a "party". Count first-choice (nearest) votes.
	var tally = _tally(model, function(tally, ballot){
		tally[ballot.vote]++;
	});

	// Share out seats one at a time, each going to whichever party is most
	// "owed" a seat for the votes it has. (Sainte-Laguë divisors: 1, 3, 5, ...)
	var seatsWon = {};
	for(var id in tally) seatsWon[id] = 0;
	var seatWinners = [];
	for(var s=0; s<seats; s++){
		var bestId = null, bestQuotient = -1;
		for(var id in tally){
			var quotient = tally[id] / (2*seatsWon[id] + 1);
			if(quotient > bestQuotient){
				bestQuotient = quotient;
				bestId = id;
			}
		}
		seatsWon[bestId]++;
		seatWinners.push(bestId);
	}

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

	// Give every ballot a weight. Each time a ballot helps elect someone,
	// its weight shrinks to 1/(1+wins), so a group can't keep winning seats forever.
	var rawBallots = model.getBallots();
	var ballots = [];
	for(var i=0; i<rawBallots.length; i++){
		ballots.push({ approved: rawBallots[i].approved, wins: 0 });
	}

	var elected = [];
	var text = "<span class='small'>";

	for(var s=0; s<seats; s++){

		// Weighted approval score for each not-yet-elected candidate.
		var score = {};
		for(var c in model.candidatesById){
			if(elected.indexOf(c)>=0) continue;
			score[c] = 0;
		}
		for(var i=0; i<ballots.length; i++){
			var b = ballots[i];
			var weight = 1/(1+b.wins);
			for(var j=0; j<b.approved.length; j++){
				var a = b.approved[j];
				if(score[a]!==undefined) score[a] += weight;
			}
		}

		// Elect the highest-scoring remaining candidate.
		var winner = _countWinner(score);
		if(winner===null) break; // nobody left with any support
		elected.push(winner);
		text += "seat "+(s+1)+": "+_icon(winner)+" (score "+score[winner].toFixed(1)+")<br>";

		// Reweight: anyone who approved this winner counts for less next time.
		for(var i=0; i<ballots.length; i++){
			if(ballots[i].approved.indexOf(winner)>=0) ballots[i].wins++;
		}

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

	// Each ballot carries a fractional weight that gets passed along.
	var rawBallots = model.getBallots();
	var ballots = [];
	for(var i=0; i<rawBallots.length; i++){
		ballots.push({ rank: rawBallots[i].rank, weight: 1 });
	}
	var total = ballots.length;

	// Droop quota: the votes needed to guarantee a seat.
	var quota = Math.floor(total/(seats+1)) + 1;

	// Who's still in the running?
	var continuing = {};
	for(var id in model.candidatesById) continuing[id] = true;
	var elected = [];

	// A ballot's current home = its top-ranked candidate still continuing.
	var topContinuing = function(ballot){
		for(var i=0; i<ballot.rank.length; i++){
			if(continuing[ballot.rank[i]]) return ballot.rank[i];
		}
		return null;
	};

	// Re-tally from scratch each round (transfers fall out for free).
	var roundTally = function(){
		var t = {};
		for(var id in continuing) t[id] = 0;
		for(var i=0; i<ballots.length; i++){
			var home = topContinuing(ballots[i]);
			if(home!==null) t[home] += ballots[i].weight;
		}
		return t;
	};

	var text = "<span class='small'>";
	text += "<b>quota to win a seat: "+quota+"</b><br><br>";

	var guard = 0;
	while(elected.length<seats && guard<200){
		guard++;

		var t = roundTally();

		// How many seats still to fill, and who's left?
		var remainingSeats = seats - elected.length;
		var continuingIds = [];
		for(var id in continuing) if(continuing[id]) continuingIds.push(id);

		// If there are exactly as many hopefuls as seats left, they all get in.
		if(continuingIds.length <= remainingSeats){
			continuingIds.sort(function(a,b){ return t[b]-t[a]; });
			for(var i=0; i<continuingIds.length; i++){
				elected.push(continuingIds[i]);
				text += _icon(continuingIds[i])+" elected (last seats)<br>";
			}
			break;
		}

		// Anyone over quota? Elect the strongest and pass on their surplus.
		var topId = null, topVotes = -1;
		for(var i=0; i<continuingIds.length; i++){
			if(t[continuingIds[i]]>topVotes){ topVotes = t[continuingIds[i]]; topId = continuingIds[i]; }
		}

		if(topVotes>=quota){
			var surplus = topVotes - quota;
			var transferValue = surplus/topVotes; // Gregory: shrink every ballot here
			for(var i=0; i<ballots.length; i++){
				if(topContinuing(ballots[i])===topId) ballots[i].weight *= transferValue;
			}
			continuing[topId] = false; // elected -> no longer receiving
			elected.push(topId);
			text += _icon(topId)+" reaches quota &rarr; elected ("+topVotes.toFixed(0)+")<br>";
		}else{
			// Nobody's over quota: knock out the weakest, their votes flow on.
			var lowId = null, lowVotes = Infinity;
			for(var i=0; i<continuingIds.length; i++){
				if(t[continuingIds[i]]<lowVotes){ lowVotes = t[continuingIds[i]]; lowId = continuingIds[i]; }
			}
			continuing[lowId] = false;
			text += _icon(lowId)+" eliminated, votes transfer<br>";
		}
	}

	text += "</span>";
	text += _seatRow(elected);
	model.caption.innerHTML = text;

};
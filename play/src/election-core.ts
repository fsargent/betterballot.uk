export type CandidateId = string;

export type ScoreBallot = Record<CandidateId, number>;
export type ApprovalBallot = { approved: CandidateId[] };
export type RankedBallot = { rank: CandidateId[] };
export type PluralityBallot = { vote: CandidateId };

export type Tally = Record<CandidateId, number>;

export type RankedChoiceRound = {
	round: number;
	tally: Tally;
	eliminated?: CandidateId;
	winner?: CandidateId;
};

export type SeatResult = {
	tally: Tally;
	seatsWon: Tally;
	seatWinners: CandidateId[];
};

export type SpavRound = {
	seat: number;
	winner: CandidateId;
	score: number;
	scores: Tally;
};

export type StvRound =
	| { action: "elected"; candidate: CandidateId; votes: number; transferValue: number }
	| { action: "eliminated"; candidate: CandidateId; votes: number }
	| { action: "last-seats"; candidates: CandidateId[] };

export type StvResult = {
	quota: number;
	elected: CandidateId[];
	rounds: StvRound[];
};

export const createTally = (candidateIds: CandidateId[], value = 0): Tally => {
	const tally: Tally = {};
	for (const id of candidateIds) {
		tally[id] = value;
	}
	return tally;
};

export const chooseHighest = (tally: Tally): CandidateId | null => {
	let highScore = -Infinity;
	let winner: CandidateId | null = null;
	for (const candidate of Object.keys(tally)) {
		const score = tally[candidate];
		if (score > highScore) {
			highScore = score;
			winner = candidate;
		}
	}
	return winner;
};

export const chooseLowest = (tally: Tally): CandidateId | null => {
	let lowScore = Infinity;
	let loser: CandidateId | null = null;
	for (const candidate of Object.keys(tally)) {
		const score = tally[candidate];
		if (score < lowScore) {
			lowScore = score;
			loser = candidate;
		}
	}
	return loser;
};

export const plurality = (
	candidateIds: CandidateId[],
	ballots: PluralityBallot[],
): { tally: Tally; winner: CandidateId | null } => {
	const tally = createTally(candidateIds);
	for (const ballot of ballots) {
		if (tally[ballot.vote] !== undefined) {
			tally[ballot.vote]++;
		}
	}
	return { tally, winner: chooseHighest(tally) };
};

export const approval = (
	candidateIds: CandidateId[],
	ballots: ApprovalBallot[],
): { tally: Tally; winner: CandidateId | null } => {
	const tally = createTally(candidateIds);
	for (const ballot of ballots) {
		for (const candidate of ballot.approved) {
			if (tally[candidate] !== undefined) {
				tally[candidate]++;
			}
		}
	}
	return { tally, winner: chooseHighest(tally) };
};

export const score = (
	candidateIds: CandidateId[],
	ballots: ScoreBallot[],
): { tally: Tally; winner: CandidateId | null } => {
	const tally = createTally(candidateIds);
	for (const ballot of ballots) {
		for (const candidate of candidateIds) {
			tally[candidate] += ballot[candidate] || 0;
		}
	}
	const total = ballots.length;
	if (total > 0) {
		for (const candidate of candidateIds) {
			tally[candidate] /= total;
		}
	}
	return { tally, winner: chooseHighest(tally) };
};

export const borda = (
	candidateIds: CandidateId[],
	ballots: RankedBallot[],
): { tally: Tally; winner: CandidateId | null } => {
	const tally = createTally(candidateIds);
	for (const ballot of ballots) {
		for (let i = 0; i < ballot.rank.length; i++) {
			const candidate = ballot.rank[i];
			if (tally[candidate] !== undefined) {
				tally[candidate] += i;
			}
		}
	}
	return { tally, winner: chooseLowest(tally) };
};

export const condorcet = (
	candidateIds: CandidateId[],
	ballots: RankedBallot[],
): { tally: Tally; winner: CandidateId | null; contests: Array<{ a: CandidateId; b: CandidateId; winner: CandidateId; by: number; to: number }> } => {
	const tally = createTally(candidateIds);
	const contests = [];
	for (let i = 0; i < candidateIds.length - 1; i++) {
		const a = candidateIds[i];
		for (let j = i + 1; j < candidateIds.length; j++) {
			const b = candidateIds[j];
			let aWins = 0;
			let bWins = 0;
			for (const ballot of ballots) {
				if (ballot.rank.indexOf(a) < ballot.rank.indexOf(b)) {
					aWins++;
				} else {
					bWins++;
				}
			}
			const winner = aWins > bWins ? a : b;
			tally[winner]++;
			contests.push({
				a,
				b,
				winner,
				by: winner === a ? aWins : bWins,
				to: winner === a ? bWins : aWins,
			});
		}
	}
	const winner =
		Object.keys(tally).find((id) => tally[id] === candidateIds.length - 1) ||
		null;
	return { tally, winner, contests };
};

export const irv = (
	candidateIds: CandidateId[],
	ballots: RankedBallot[],
): { winner: CandidateId | null; rounds: RankedChoiceRound[] } => {
	const continuing = candidateIds.slice();
	const rankings = ballots.map((ballot) => ballot.rank.slice());
	const rounds: RankedChoiceRound[] = [];
	let round = 1;

	while (continuing.length > 0) {
		const tally = createTally(continuing);
		for (const rank of rankings) {
			const first = rank.find((candidate) => continuing.indexOf(candidate) >= 0);
			if (first && tally[first] !== undefined) {
				tally[first]++;
			}
		}

		const winner = chooseHighest(tally);
		if (winner === null) {
			return { winner: null, rounds };
		}

		if (tally[winner] / ballots.length >= 0.5 || continuing.length === 1) {
			rounds.push({ round, tally, winner });
			return { winner, rounds };
		}

		const eliminated = chooseLowest(tally);
		if (eliminated === null) {
			return { winner: null, rounds };
		}

		rounds.push({ round, tally, eliminated });
		continuing.splice(continuing.indexOf(eliminated), 1);
		round++;
	}

	return { winner: null, rounds };
};

export const partyList = (
	candidateIds: CandidateId[],
	ballots: PluralityBallot[],
	seats: number,
): SeatResult => {
	const { tally } = plurality(candidateIds, ballots);
	const seatsWon = createTally(candidateIds);
	const seatWinners: CandidateId[] = [];
	for (let seat = 0; seat < seats; seat++) {
		let bestId: CandidateId | null = null;
		let bestQuotient = -Infinity;
		for (const id of candidateIds) {
			const quotient = tally[id] / (2 * seatsWon[id] + 1);
			if (quotient > bestQuotient) {
				bestQuotient = quotient;
				bestId = id;
			}
		}
		if (bestId === null) break;
		seatsWon[bestId]++;
		seatWinners.push(bestId);
	}
	return { tally, seatsWon, seatWinners };
};

export const spav = (
	candidateIds: CandidateId[],
	ballots: ApprovalBallot[],
	seats: number,
): { elected: CandidateId[]; rounds: SpavRound[] } => {
	const weightedBallots = ballots.map((ballot) => ({
		approved: ballot.approved.slice(),
		wins: 0,
	}));
	const elected: CandidateId[] = [];
	const rounds: SpavRound[] = [];

	for (let seat = 0; seat < seats; seat++) {
		const scores = createTally(
			candidateIds.filter((candidate) => elected.indexOf(candidate) < 0),
		);

		for (const ballot of weightedBallots) {
			const weight = 1 / (1 + ballot.wins);
			for (const approved of ballot.approved) {
				if (scores[approved] !== undefined) {
					scores[approved] += weight;
				}
			}
		}

		const winner = chooseHighest(scores);
		if (winner === null || scores[winner] <= 0) break;
		elected.push(winner);
		rounds.push({ seat: seat + 1, winner, score: scores[winner], scores });

		for (const ballot of weightedBallots) {
			if (ballot.approved.indexOf(winner) >= 0) {
				ballot.wins++;
			}
		}
	}

	return { elected, rounds };
};

export const stv = (
	candidateIds: CandidateId[],
	ballots: RankedBallot[],
	seats: number,
): StvResult => {
	const weightedBallots = ballots.map((ballot) => ({
		rank: ballot.rank.slice(),
		weight: 1,
	}));
	const quota = Math.floor(weightedBallots.length / (seats + 1)) + 1;
	const continuing = createTally(candidateIds, 1);
	const elected: CandidateId[] = [];
	const rounds: StvRound[] = [];

	const topContinuing = (ballot: { rank: CandidateId[] }): CandidateId | null => {
		for (const candidate of ballot.rank) {
			if (continuing[candidate]) return candidate;
		}
		return null;
	};

	const roundTally = (): Tally => {
		const tally = createTally(Object.keys(continuing));
		for (const ballot of weightedBallots) {
			const home = topContinuing(ballot);
			if (home !== null) {
				tally[home] += ballot.weight;
			}
		}
		return tally;
	};

	let guard = 0;
	while (elected.length < seats && guard < 200) {
		guard++;
		const tally = roundTally();
		const remainingSeats = seats - elected.length;
		const continuingIds = Object.keys(continuing).filter((id) => continuing[id]);

		if (continuingIds.length <= remainingSeats) {
			continuingIds.sort((a, b) => tally[b] - tally[a]);
			for (const candidate of continuingIds) {
				elected.push(candidate);
			}
			rounds.push({ action: "last-seats", candidates: continuingIds });
			break;
		}

		const topId = chooseHighest(
			Object.fromEntries(continuingIds.map((id) => [id, tally[id]])),
		);
		if (topId === null) break;
		const topVotes = tally[topId];

		if (topVotes >= quota) {
			const surplus = topVotes - quota;
			const transferValue = surplus / topVotes;
			for (const ballot of weightedBallots) {
				if (topContinuing(ballot) === topId) {
					ballot.weight *= transferValue;
				}
			}
			continuing[topId] = 0;
			elected.push(topId);
			rounds.push({ action: "elected", candidate: topId, votes: topVotes, transferValue });
		} else {
			const lowId = chooseLowest(
				Object.fromEntries(continuingIds.map((id) => [id, tally[id]])),
			);
			if (lowId === null) break;
			continuing[lowId] = 0;
			rounds.push({ action: "eliminated", candidate: lowId, votes: tally[lowId] });
		}
	}

	return { quota, elected, rounds };
};

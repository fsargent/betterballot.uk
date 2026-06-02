(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, {
        get: all[name],
        enumerable: true,
        configurable: true,
        set: (newValue) => all[name] = () => newValue
      });
  };

  // play/src/election-core.ts
  var exports_election_core = {};
  __export(exports_election_core, {
    stv: () => stv,
    spav: () => spav,
    score: () => score,
    plurality: () => plurality,
    partyList: () => partyList,
    irv: () => irv,
    createTally: () => createTally,
    condorcet: () => condorcet,
    chooseLowest: () => chooseLowest,
    chooseHighest: () => chooseHighest,
    borda: () => borda,
    approval: () => approval
  });
  var createTally = (candidateIds, value = 0) => {
    const tally = {};
    for (const id of candidateIds) {
      tally[id] = value;
    }
    return tally;
  };
  var chooseHighest = (tally) => {
    let highScore = -Infinity;
    let winner = null;
    for (const candidate of Object.keys(tally)) {
      const score = tally[candidate];
      if (score > highScore) {
        highScore = score;
        winner = candidate;
      }
    }
    return winner;
  };
  var chooseLowest = (tally) => {
    let lowScore = Infinity;
    let loser = null;
    for (const candidate of Object.keys(tally)) {
      const score = tally[candidate];
      if (score < lowScore) {
        lowScore = score;
        loser = candidate;
      }
    }
    return loser;
  };
  var plurality = (candidateIds, ballots) => {
    const tally = createTally(candidateIds);
    for (const ballot of ballots) {
      if (tally[ballot.vote] !== undefined) {
        tally[ballot.vote]++;
      }
    }
    return { tally, winner: chooseHighest(tally) };
  };
  var approval = (candidateIds, ballots) => {
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
  var score = (candidateIds, ballots) => {
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
  var borda = (candidateIds, ballots) => {
    const tally = createTally(candidateIds);
    for (const ballot of ballots) {
      for (let i = 0;i < ballot.rank.length; i++) {
        const candidate = ballot.rank[i];
        if (tally[candidate] !== undefined) {
          tally[candidate] += i;
        }
      }
    }
    return { tally, winner: chooseLowest(tally) };
  };
  var condorcet = (candidateIds, ballots) => {
    const tally = createTally(candidateIds);
    const contests = [];
    for (let i = 0;i < candidateIds.length - 1; i++) {
      const a = candidateIds[i];
      for (let j = i + 1;j < candidateIds.length; j++) {
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
        const winner2 = aWins > bWins ? a : b;
        tally[winner2]++;
        contests.push({
          a,
          b,
          winner: winner2,
          by: winner2 === a ? aWins : bWins,
          to: winner2 === a ? bWins : aWins
        });
      }
    }
    const winner = Object.keys(tally).find((id) => tally[id] === candidateIds.length - 1) || null;
    return { tally, winner, contests };
  };
  var irv = (candidateIds, ballots) => {
    const continuing = candidateIds.slice();
    const rankings = ballots.map((ballot) => ballot.rank.slice());
    const rounds = [];
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
  var partyList = (candidateIds, ballots, seats) => {
    const { tally } = plurality(candidateIds, ballots);
    const seatsWon = createTally(candidateIds);
    const seatWinners = [];
    for (let seat = 0;seat < seats; seat++) {
      let bestId = null;
      let bestQuotient = -Infinity;
      for (const id of candidateIds) {
        const quotient = tally[id] / (2 * seatsWon[id] + 1);
        if (quotient > bestQuotient) {
          bestQuotient = quotient;
          bestId = id;
        }
      }
      if (bestId === null)
        break;
      seatsWon[bestId]++;
      seatWinners.push(bestId);
    }
    return { tally, seatsWon, seatWinners };
  };
  var spav = (candidateIds, ballots, seats) => {
    const weightedBallots = ballots.map((ballot) => ({
      approved: ballot.approved.slice(),
      wins: 0
    }));
    const elected = [];
    const rounds = [];
    for (let seat = 0;seat < seats; seat++) {
      const scores = createTally(candidateIds.filter((candidate) => elected.indexOf(candidate) < 0));
      for (const ballot of weightedBallots) {
        const weight = 1 / (1 + ballot.wins);
        for (const approved of ballot.approved) {
          if (scores[approved] !== undefined) {
            scores[approved] += weight;
          }
        }
      }
      const winner = chooseHighest(scores);
      if (winner === null || scores[winner] <= 0)
        break;
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
  var stv = (candidateIds, ballots, seats) => {
    const weightedBallots = ballots.map((ballot) => ({
      rank: ballot.rank.slice(),
      weight: 1
    }));
    const quota = Math.floor(weightedBallots.length / (seats + 1)) + 1;
    const continuing = createTally(candidateIds, 1);
    const elected = [];
    const rounds = [];
    const topContinuing = (ballot) => {
      for (const candidate of ballot.rank) {
        if (continuing[candidate])
          return candidate;
      }
      return null;
    };
    const roundTally = () => {
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
      const topId = chooseHighest(Object.fromEntries(continuingIds.map((id) => [id, tally[id]])));
      if (topId === null)
        break;
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
        const lowId = chooseLowest(Object.fromEntries(continuingIds.map((id) => [id, tally[id]])));
        if (lowId === null)
          break;
        continuing[lowId] = 0;
        rounds.push({ action: "eliminated", candidate: lowId, votes: tally[lowId] });
      }
    }
    return { quota, elected, rounds };
  };

  // play/src/election-core-browser.ts
  globalThis.ElectionCore = exports_election_core;
})();

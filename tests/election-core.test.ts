import { describe, expect, test } from "bun:test";

import {
  approval,
  borda,
  chooseHighest,
  chooseLowest,
  condorcet,
  irv,
  partyList,
  plurality,
  score,
  spav,
  stv,
} from "../play/src/election-core.ts";

describe("election core", () => {
  test("plurality counts votes and chooses the highest tally", () => {
    const result = plurality(
      ["a", "b", "c"],
      [{ vote: "a" }, { vote: "b" }, { vote: "b" }],
    );

    expect(result.tally).toEqual({ a: 1, b: 2, c: 0 });
    expect(result.winner).toBe("b");
  });

  test("approval counts every approved candidate", () => {
    const result = approval(
      ["a", "b", "c"],
      [{ approved: ["a", "b"] }, { approved: ["b"] }, { approved: [] }],
    );

    expect(result.tally).toEqual({ a: 1, b: 2, c: 0 });
    expect(result.winner).toBe("b");
  });

  test("score averages candidate scores", () => {
    const result = score(
      ["a", "b"],
      [
        { a: 5, b: 1 },
        { a: 3, b: 5 },
      ],
    );

    expect(result.tally).toEqual({ a: 4, b: 3 });
    expect(result.winner).toBe("a");
  });

  test("borda chooses the lowest total rank score", () => {
    const result = borda(
      ["a", "b", "c"],
      [
        { rank: ["a", "b", "c"] },
        { rank: ["b", "a", "c"] },
        { rank: ["b", "c", "a"] },
      ],
    );

    expect(result.tally).toEqual({ a: 3, b: 1, c: 5 });
    expect(result.winner).toBe("b");
  });

  test("condorcet identifies the candidate who beats every opponent", () => {
    const result = condorcet(
      ["a", "b", "c"],
      [
        { rank: ["a", "b", "c"] },
        { rank: ["a", "c", "b"] },
        { rank: ["b", "a", "c"] },
      ],
    );

    expect(result.winner).toBe("a");
    expect(result.contests.length).toBe(3);
  });

  test("irv transfers votes without mutating input rankings", () => {
    const ballots = [
      { rank: ["a", "b", "c"] },
      { rank: ["a", "b", "c"] },
      { rank: ["b", "c", "a"] },
      { rank: ["c", "b", "a"] },
      { rank: ["c", "b", "a"] },
    ];
    const original = structuredClone(ballots);

    const result = irv(["a", "b", "c"], ballots);

    expect(result.winner).toBe("c");
    expect(
      result.rounds.map((round) => round.eliminated).filter(Boolean),
    ).toEqual(["b"]);
    expect(ballots).toEqual(original);
  });

  test("party list uses Sainte-Laguë divisors to allocate seats", () => {
    const result = partyList(
      ["a", "b", "c"],
      [
        { vote: "a" },
        { vote: "a" },
        { vote: "a" },
        { vote: "a" },
        { vote: "b" },
        { vote: "b" },
        { vote: "c" },
      ],
      5,
    );

    expect(result.seatWinners).toEqual(["a", "b", "a", "c", "a"]);
    expect(result.seatsWon).toEqual({ a: 3, b: 1, c: 1 });
    expect(result.tally).toEqual({ a: 4, b: 2, c: 1 });
  });

  test("spav reweights ballots after each elected approved candidate", () => {
    const result = spav(
      ["a", "b", "c"],
      [
        { approved: ["a", "b"] },
        { approved: ["a", "b"] },
        { approved: ["c"] },
        { approved: ["c"] },
      ],
      2,
    );

    expect(result.elected).toEqual(["a", "c"]);
    expect(result.rounds[1].score).toBe(2);
  });

  test("stv elects by quota and fills remaining seats", () => {
    const result = stv(
      ["a", "b", "c"],
      [
        { rank: ["a", "b", "c"] },
        { rank: ["a", "b", "c"] },
        { rank: ["b", "a", "c"] },
        { rank: ["c", "b", "a"] },
      ],
      2,
    );

    expect(result.quota).toBe(2);
    expect(result.elected).toEqual(["a", "c"]);
    expect(result.rounds.map((round) => round.action)).toEqual([
      "elected",
      "eliminated",
      "last-seats",
    ]);
    expect(result.flows).toEqual([
      {
        action: "elected",
        from: "a",
        votes: 2,
        transfers: [{ to: "elected", value: 2 }],
      },
      {
        action: "eliminated",
        from: "b",
        votes: 1,
        transfers: [{ to: "c", value: 1 }],
      },
    ]);
  });

  test("stv records surplus transfers for flow diagrams", () => {
    const result = stv(
      ["a", "b", "c"],
      [
        { rank: ["a", "b", "c"] },
        { rank: ["a", "b", "c"] },
        { rank: ["a", "c", "b"] },
        { rank: ["b", "c", "a"] },
        { rank: ["c", "b", "a"] },
      ],
      2,
    );

    expect(result.quota).toBe(2);
    expect(result.flows[0]).toEqual({
      action: "elected",
      from: "a",
      votes: 3,
      transfers: [
        { to: "elected", value: 2 },
        { to: "b", value: 2 / 3 },
        { to: "c", value: 1 / 3 },
      ],
    });
  });

  test("tie policy is deterministic by candidate insertion order", () => {
    expect(chooseHighest({ a: 1, b: 1 })).toBe("a");
    expect(chooseLowest({ a: 0, b: 0 })).toBe("a");
  });
});

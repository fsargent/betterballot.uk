export type BuildEntry = {
  entrypoint: string;
  outfile: string;
};

export const buildEntries: BuildEntry[] = [
  { entrypoint: "play/src/browser/helpers.ts", outfile: "play/js/helpers.js" },
  { entrypoint: "play/src/browser/Loader.ts", outfile: "play/js/Loader.js" },
  { entrypoint: "play/src/browser/Mouse.ts", outfile: "play/js/Mouse.js" },
  {
    entrypoint: "play/src/browser/Draggable.ts",
    outfile: "play/js/Draggable.js",
  },
  { entrypoint: "play/src/browser/Model.ts", outfile: "play/js/Model.js" },
  {
    entrypoint: "play/src/browser/Candidate.ts",
    outfile: "play/js/Candidate.js",
  },
  { entrypoint: "play/src/browser/Voters.ts", outfile: "play/js/Voters.js" },
  {
    entrypoint: "play/src/election-core-browser.ts",
    outfile: "play/js/election-core.js",
  },
  {
    entrypoint: "play/src/browser/Election.ts",
    outfile: "play/js/Election.js",
  },
  { entrypoint: "play/src/browser/Buttons.ts", outfile: "play/js/Buttons.js" },
  { entrypoint: "play/src/browser/Ballot.ts", outfile: "play/js/Ballot.js" },
  {
    entrypoint: "play/src/browser/main_ballot.ts",
    outfile: "play/js/main_ballot.js",
  },
  { entrypoint: "play/src/browser/main_pr.ts", outfile: "play/js/main_pr.js" },
  {
    entrypoint: "play/src/browser/main_sandbox.ts",
    outfile: "play/js/main_sandbox.js",
  },
  { entrypoint: "src/index.ts", outfile: "js/index.js" },
  { entrypoint: "splash/src/splash.ts", outfile: "splash/splash.js" },
];

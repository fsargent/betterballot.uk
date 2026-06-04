import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { buildEntries } from "./build-entries";

const hashFile = async (path: string) => {
  const bytes = await readFile(path);
  return createHash("sha256").update(bytes).digest("hex");
};

const before = new Map<string, string>();
for (const entry of buildEntries) {
  before.set(entry.outfile, await hashFile(entry.outfile));
}

const build = Bun.spawn(["bun", "tools/build-play-js.ts"], {
  stdout: "inherit",
  stderr: "inherit",
});
const exitCode = await build.exited;
if (exitCode !== 0) {
  process.exit(exitCode);
}

const changed: string[] = [];
for (const entry of buildEntries) {
  const after = await hashFile(entry.outfile);
  if (after !== before.get(entry.outfile)) {
    changed.push(entry.outfile);
  }
}

if (changed.length > 0) {
  console.error(
    "Generated output is stale. Re-run `npm run build` and commit:",
  );
  for (const path of changed) {
    console.error(`  ${path}`);
  }
  process.exit(1);
}

console.log("Generated output is up to date.");

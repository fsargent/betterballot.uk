import * as Core from "./election-core";

declare global {
  var ElectionCore: typeof Core;
}

globalThis.ElectionCore = Core;

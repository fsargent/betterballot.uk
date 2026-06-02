import * as ElectionCore from "./election-core";

declare global {
	var ElectionCore: typeof ElectionCore;
}

globalThis.ElectionCore = ElectionCore;

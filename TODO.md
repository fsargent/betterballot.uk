# TODO

## Port a proper STV demonstration from smartvotesim

The current Single Transferable Vote sim computes a correct result, but it
doesn't really _show how STV works or why it's fair_ — there's no visible
quota-filling, surplus transfer, or vote-flow animation.

Take the STV implementation/visualisation from the sibling project
[`../smarvotesim/`](https://howtofixtheelection.com/ballot/stv/) (also a remix of
Nicky Case's original, MIT/public-domain) — in particular its round-by-round
transfer view / sankey — and adapt it into `play/` so the STV section actually
demonstrates the mechanism, not just the outcome.

Files likely involved: `smarvotesim/play/js/Election.js` (the `Election.stv`
round history + sankey rendering), `play/js/main_pr.js`, `play/pr_stv.html`.

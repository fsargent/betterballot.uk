# To Build a Better Ballot — UK

**an interactive guide to fairer voting & proportional representation in the UK**

A British remix of [Nicky Case's public-domain "To Build a Better Ballot"](https://ncase.me/ballot/) (2016).
It keeps the original's playful, draggable simulations and adds **proportional representation** —
Party List, the Single Transferable Vote, and Proportional Choose Many (proportional approval) —
framed around UK examples (Westminster First Past the Post, the 2011 Alternative Vote referendum,
the Senedd's 2026 switch to proportional representation, and the Single Transferable Vote in
Northern Ireland & Scotland).

The proportional methods were inspired by [the Smart Voting Simulator](https://smartvotesim.com/) by Paretoman,
another remix of Nicky's original.

## Running it

It's a static site — no build step. **Serve it over HTTP** (opening the files directly with
`file://` won't load the iframes). Any static server works:

```
npx serve .            # or:  python3 -m http.server
```

then open the printed URL.

## Deploying (Cloudflare Workers)

The site is hosted on Cloudflare Workers using **Static Assets** (an assets-only Worker —
no server code). Config is in `wrangler.toml`; `.assetsignore` keeps tooling/docs out of the upload.

```
npx wrangler login      # one-time, opens a browser to authorise
npx wrangler deploy     # uploads the site and wires up betterballot.uk
```

`npx wrangler dev` serves it locally at <http://localhost:8787> exactly as Cloudflare will.

The custom domain (`betterballot.uk`) is configured via the `routes` block in `wrangler.toml`.
If the first deploy errors on the domain, comment that block out, deploy once, then add the
domain in the dashboard: **Workers & Pages → betterballot-uk → Domains & Routes**.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the architecture, the repo layout, and the difference
between the legacy engine (`play/js/`) and the embedded `voter/` project.

## Licence

Public domain — zero rights reserved ([CC0](https://creativecommons.org/publicdomain/zero/1.0/)),
just like the original. Use it, copy it, remix it.

Enormous thanks to **Nicky Case**.

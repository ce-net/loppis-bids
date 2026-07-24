# loppis-bids

The bidding backend of **loppis** (secondhand marketplace as decoupled CE apps). Provides the
typed mesh service `loppis.bids/1` (place/highest/listForListing + `placed` event) AND is a
typed CONSUMER of `loppis.listings/1` — it validates every bid against the listings service
over the mesh (unknown/closed/self-bid/too-low all surface as typed `CallError` codes). One
process, both directions typed: that is the all-ways shape.

Contract: `src/iface.ts`, public as `@loppis/bids/iface`. Siblings:
github.com/ce-net/loppis-listings, github.com/ce-net/loppis-web.

## Run (the ce-native way — one command)

```
ce app install ./loppis-bids         # installs + supervises the daemon (needs ce start + loppis-listings)
```
Committed `app.mjs` is the entry — no npm for operators. Deploy/configure/start/stop visually
with loppis-deploy (github.com/ce-net/loppis-deploy). Ability gate `loppis:bid:place`: closed
mode refuses until a verifier is wired; open mode (config.json/env) is dev-only.

## Development

```
npm install && npm run bundle        # rebuild app.mjs (commit it)
npm run smoke                        # LIVE smoke over the real mesh (both daemons up)
```

## Why CE (for web developers)

This service has no login system, no session store, and no websocket infra — callers are
authenticated peers, authorization is an ability IN the API schema, and the events it emits
reach every subscriber live. The full argument and the demo walkthrough:
github.com/ce-net/loppis-web and docs/why-web-developers.md in github.com/ce-net/ce.

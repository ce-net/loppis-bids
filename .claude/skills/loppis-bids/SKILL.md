---
name: loppis-bids
description: The loppis bidding backend ce app — provides loppis.bids/1, typed consumer of loppis.listings/1. Read before using or editing.
---
# loppis-bids
Provider of loppis.bids/1 + typed consumer of loppis.listings/1 (contract imported from the
github dep "@loppis/listings"). Bid rules live in the place() handler; every refusal is a
typed CallError code (unknown-listing/listing-closed/self-bid/too-low) — tests and UIs match
on codes, never message strings. Live gate: `npm run smoke` against a real node with both
daemons (single-node runs assert the typed self-bid refusal path). Auth seam as in
loppis-listings (open mode is dev-only).
Run: `ce app install ./loppis-bids`. npm is INTERNAL tooling (`npm run bundle` regenerates
the committed app.mjs; `npm run smoke` is the live gate) — never the operator surface, and
NEVER `npm start`/`node dist/main.js` alongside the installed ceapp: duplicate providers on
one topic race replies and diverge in state. Check `ps ax | grep dist/main.js` first.
The single-node smoke cannot exercise an ACCEPTED bid (caller == seller == the node, so the
self-bid rule fires). To verify the happy path, create the listing from a SECOND node so the
seller differs — e.g. POST /mesh/request on another node with topic loppis.listings/1 and
payload {"m":"create","i":{...}} hex-encoded — then bid from this one.

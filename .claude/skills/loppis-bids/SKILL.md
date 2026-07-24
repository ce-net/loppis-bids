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
loppis-listings (LOPPIS_OPEN=1 dev-only).

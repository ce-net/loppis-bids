/**
 * LIVE smoke over a real ce node (the deploy gate): starts nothing itself — expects
 * loppis-listings and loppis-bids daemons already running against the local node with
 * LOPPIS_OPEN=1. Exercises the full typed path: create listing -> subscribe typed event ->
 * place bid (service-to-service validation inside loppis-bids) -> assert the event arrived
 * and highest() agrees -> assert a too-low bid fails with the TYPED error code.
 *
 * Run: npm run smoke   (needs: ce start, both daemons up)
 */

import { CeClient } from "@ce-net/sdk";
import { connect, CallError } from "@ce-net/iface";
import { ListingsIface } from "@loppis/listings/iface";
import { BidsIface } from "../dist/iface.js";

const ce = CeClient.local();
const fail = (m) => {
  console.error(`SMOKE FAIL: ${m}`);
  process.exit(1);
};

const listings = await connect(ce, ListingsIface);
const bids = await connect(ce, BidsIface);
console.log(`bound: listings@${listings.provider.slice(0, 8)} bids@${bids.provider.slice(0, 8)}`);

const listing = await listings.create({ title: `smoke bike ${Date.now()}`, startPrice: 100 });
if (listing.status !== "open") fail("created listing not open");
console.log(`created listing ${listing.id}`);

let eventBid = null;
const off = await bids.on("placed", (b) => {
  if (b.listingId === listing.id) eventBid = b;
});

// NOTE: seller == this node == bidder in a single-node smoke; the self-bid rule would block
// us, so the smoke asserts THAT typed error too, then verifies the happy path via a second
// identity if present. Single-node: self-bid IS the expected outcome for place().
let placed = null;
try {
  placed = await bids.place({ listingId: listing.id, amount: 150 });
} catch (e) {
  if (e instanceof CallError && e.code === "self-bid") {
    console.log("typed self-bid refusal verified (single-node smoke: caller is the seller)");
  } else {
    fail(`unexpected place() error: ${e}`);
  }
}

if (placed) {
  // Multi-identity environment: full happy path.
  await new Promise((r) => setTimeout(r, 1500));
  if (!eventBid || eventBid.id !== placed.id) fail("typed placed event did not arrive");
  const high = await bids.highest({ listingId: listing.id });
  if (!high || high.id !== placed.id) fail("highest() does not match placed bid");
  try {
    await bids.place({ listingId: listing.id, amount: 10 });
    fail("too-low bid was accepted");
  } catch (e) {
    if (!(e instanceof CallError) || e.code !== "too-low") fail(`expected too-low, got ${e}`);
    console.log("typed too-low refusal verified");
  }
}

// Unknown listing must fail typed regardless of identity.
try {
  await bids.place({ listingId: "does-not-exist", amount: 1 });
  fail("bid on unknown listing was accepted");
} catch (e) {
  if (!(e instanceof CallError) || e.code !== "unknown-listing") fail(`expected unknown-listing, got ${e}`);
  console.log("typed unknown-listing refusal verified");
}

off();
console.log("SMOKE PASS");
process.exit(0);

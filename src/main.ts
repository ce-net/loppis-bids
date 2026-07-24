/**
 * loppis-bids — the bidding backend as a ce app. Fully decoupled from loppis-listings: it
 * knows only the TYPED CONTRACT (imported from the provider repo) and discovers a live
 * instance over the mesh. This service is simultaneously a typed PROVIDER (loppis.bids/1)
 * and a typed CONSUMER (loppis.listings/1) — the all-ways shape.
 */

import { CeClient } from "@ce-net/sdk";
import { allowAll, connect, provide, CallError, type Authorizer, type Client } from "@ce-net/iface";
import { ListingsIface } from "@loppis/listings/iface";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { BidsIface, type Bid } from "./iface.js";

const DATA = process.env.LOPPIS_DATA ?? join(process.cwd(), "data", "bids.json");

function load(): Map<string, Bid[]> {
  try {
    return new Map(Object.entries(JSON.parse(readFileSync(DATA, "utf8")) as Record<string, Bid[]>));
  } catch {
    return new Map();
  }
}
function persist(m: Map<string, Bid[]>): void {
  mkdirSync(dirname(DATA), { recursive: true });
  writeFileSync(DATA, JSON.stringify(Object.fromEntries(m), null, 2));
}

function isOpen(): boolean {
  if (process.env.LOPPIS_OPEN === "1") return true;
  try {
    return (JSON.parse(readFileSync(join(dirname(DATA), "config.json"), "utf8")) as { open?: boolean }).open === true;
  } catch {
    return false;
  }
}
function authorizer(): Authorizer {
  if (isOpen()) return allowAll();
  return ({ ability }) => {
    console.warn(`[loppis-bids] denying ability-gated call (${ability}): closed mode, no verifier wired`);
    return false;
  };
}

const byListing = load();
const highestOf = (listingId: string): Bid | null => byListing.get(listingId)?.[0] ?? null;

const ce = CeClient.local();
const ac = new AbortController();
process.on("SIGINT", () => ac.abort());
process.on("SIGTERM", () => ac.abort());

// Typed consumer side: find the listings service on the mesh.
const listings: Client<typeof ListingsIface> = await connect(ce, ListingsIface, {
  onWarn: (m, d) => console.warn(`[loppis-bids<-listings] ${m}`, d ?? ""),
});
console.log(`loppis-bids bound to listings provider ${listings.provider.slice(0, 12)}…`);

const svc = provide(
  ce,
  BidsIface,
  {
    async place(input, ctx) {
      const listing = await listings.get({ id: input.listingId });
      if (!listing) throw new CallError("unknown-listing", input.listingId);
      if (listing.status !== "open") throw new CallError("listing-closed", input.listingId);
      if (listing.seller === ctx.from) throw new CallError("self-bid", "sellers cannot bid on their own listing");
      const floor = highestOf(input.listingId)?.amount ?? listing.startPrice - 1;
      if (input.amount <= floor) {
        throw new CallError("too-low", `bid must exceed ${floor}`);
      }
      const bid: Bid = {
        id: randomUUID(),
        listingId: input.listingId,
        bidder: ctx.from,
        amount: input.amount,
        placedAt: Date.now(),
      };
      const list = byListing.get(input.listingId) ?? [];
      list.unshift(bid);
      list.sort((a, b) => b.amount - a.amount);
      byListing.set(input.listingId, list);
      persist(byListing);
      await svc.emit("placed", bid);
      return bid;
    },
    async highest(input) {
      return highestOf(input.listingId);
    },
    async listForListing(input) {
      return byListing.get(input.listingId) ?? [];
    },
  },
  authorizer(),
  { signal: ac.signal, onWarn: (m, d) => console.warn(`[loppis-bids] ${m}`, d ?? "") },
);

console.log("loppis-bids serving loppis.bids/1 on the mesh");
await svc.done;

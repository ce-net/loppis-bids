/** The bidding CONTRACT — public API of the bids service. */

import { defineInterface, t, type Infer } from "@ce-net/iface";

export const Bid = t.object({
  id: t.string(),
  listingId: t.string(),
  /** Bidder NodeId (hex) — the authenticated mesh sender. */
  bidder: t.string(),
  amount: t.number(),
  placedAt: t.number(),
});
export type Bid = Infer<typeof Bid>;

export const BidsIface = defineInterface({
  name: "loppis.bids",
  version: 1,
  doc: "Bidding on loppis listings. Validates the listing against loppis.listings/1 over the mesh (typed service-to-service).",
  methods: {
    place: {
      input: t.object({ listingId: t.string(), amount: t.number() }),
      output: Bid,
      requires: "loppis:bid:place",
      doc: "Place a bid; must exceed the current highest (or meet startPrice) and the listing must be open. Errors: unknown-listing, listing-closed, too-low, self-bid.",
    },
    highest: {
      input: t.object({ listingId: t.string() }),
      output: t.union(Bid, t.nul()),
    },
    listForListing: {
      input: t.object({ listingId: t.string() }),
      output: t.array(Bid),
      doc: "Highest first.",
    },
  },
  events: {
    /** Live auction feed: every accepted bid, typed. */
    placed: Bid,
  },
});

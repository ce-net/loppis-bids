# loppis-bids

The bidding backend of **loppis** (secondhand marketplace as decoupled CE apps). Provides the
typed mesh service `loppis.bids/1` (place/highest/listForListing + `placed` event) AND is a
typed CONSUMER of `loppis.listings/1` — it validates every bid against the listings service
over the mesh (unknown/closed/self-bid/too-low all surface as typed `CallError` codes). One
process, both directions typed: that is the all-ways shape.

Contract: `src/iface.ts`, public as `@loppis/bids/iface`. Siblings:
github.com/ce-net/loppis-listings, github.com/ce-net/loppis-web.

## Run

```
npm install && npm run build
LOPPIS_OPEN=1 npm start          # needs ce start + a running loppis-listings
npm run smoke                    # LIVE smoke over the real mesh (both daemons up)
```
Ability gate `loppis:bid:place`: same Authorizer seam rules as loppis-listings.

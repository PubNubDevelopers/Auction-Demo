# Auction-Demo

A real-time auction and marketplace app built with PubNub and plain JavaScript, with no back-end server. Sellers list items in a category, and everyone watching sees each new bid the moment it's placed.

Follow the tutorial to build it yourself: https://www.pubnub.com/tutorials/real-time-auction-marketplace-bidding-app-tutorial-javascript/

## How it uses PubNub

| Concern | PubNub feature |
|---|---|
| Item listings | Messages on one channel per category (`Woodwind`, `Brass`, `Stringed`, `Percussion`), loaded with Message Persistence |
| Bids | One bidding channel per item; the current bid is the channel's last message |
| Your bids and your auctions | The channels `<your User ID>` and `<your User ID>_auctions` |
| Online bidders | Presence on the category channel |

Bids are checked in the browser. Before you go to production, check them on the server, for example with a Before Publish Function that rejects a bid lower than the current one.

## Keys

Replace `YOUR_PUBLISH_KEY` and `YOUR_SUBSCRIBE_KEY` in `config.js` with keys from a keyset that has:

- **Message Persistence** on (it's on by default). Items and bids are read from history.
- **Presence** tracking events on all channels, or a Presence Management rule for the four category channels. New keysets track presence on selected channels only, so without a rule the online count stays at 1.

Each browser gets its own User ID, stored in `localStorage`. Two tabs in the same browser are the same bidder; use a second browser or a private window to bid against yourself.

## Run

Serve the folder with any static web server, for example `npx serve` or `python3 -m http.server 8000`, and open `index.html`.

`demo-config.js` and `demo-tracking.js` only run on the hosted demo at https://pubnubdevelopers.github.io/Auction-Demo/. On your own copy they do nothing.

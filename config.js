// Set your PubNub keys here (step 2 of the tutorial).
// Each browser keeps one User ID in localStorage, so you stay the same bidder across reloads.
// Two tabs in the same browser are the same bidder; use a second browser or a private window to bid against yourself.
let userId = localStorage.getItem('auction-user-id')
if (!userId) {
  userId = 'bidder-' + self.crypto.getRandomValues(new Uint32Array(1))[0]
  localStorage.setItem('auction-user-id', userId)
}

const pubnub = new PubNub({
  publishKey: 'YOUR_PUBLISH_KEY',
  subscribeKey: 'YOUR_SUBSCRIBE_KEY',
  userId: userId
})

// Only for the hosted demo at pubnubdevelopers.github.io/Auction-Demo/. Not part of the tutorial:
// on your own copy this file does nothing and config.js uses your keys and your own User ID.
// The hosted demo runs on PubNub's demo keyset, which has Access Manager on. Its token server only grants
// the channels of one shared demo user, so before config.js creates the client, this file swaps in the
// demo keys and that user, and gets a token for it, the way the demo worked before the 2026 refresh.
;(function () {
  if (window.location.hostname !== 'pubnubdevelopers.github.io' && sessionStorage.getItem('auction-demo-keys') !== 'on') return

  const DEMO_PUBLISH_KEY = 'pub-c-1d61c6ac-e949-437e-bdc1-8a3e324b6dc9'
  const DEMO_SUBSCRIBE_KEY = 'sub-c-0a9e48a8-f4a8-4d62-bbf0-242c60f5a522'
  const DEMO_USER_ID = 'auth0|633708320565b1f8a9d62333'
  const TOKEN_SERVER = 'https://devrel-demos-access-manager.netlify.app/.netlify/functions/api/auctions/grant'
  const SDK = window.PubNub

  // config.js calls new PubNub(...): create the client with the demo keys and user, and give it a token.
  function DemoPubNub (configuration) {
    const pubnub = new SDK({ ...configuration, publishKey: DEMO_PUBLISH_KEY, subscribeKey: DEMO_SUBSCRIBE_KEY, userId: DEMO_USER_ID })
    try {
      // Synchronous on purpose: bidding.js starts right after config.js, and its first requests need the token.
      const request = new XMLHttpRequest()
      request.open('POST', TOKEN_SERVER, false)
      request.setRequestHeader('Content-Type', 'application/json')
      request.send(JSON.stringify({ UUID: DEMO_USER_ID }))
      const token = JSON.parse(request.responseText).body.token
      if (token) pubnub.setToken(token)
    } catch (error) {
      console.log('Demo token request failed:', error)
    }
    return pubnub
  }
  Object.setPrototypeOf(DemoPubNub, SDK) // Keep the SDK's static members.
  window.PubNub = DemoPubNub
})()

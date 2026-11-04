// Feature tracking for the interactive demo framework on pubnub.com. Not part of the tutorial.
// Only on the hosted demo (same condition as demo-config.js). It loads the framework and reports the
// features listed in features.json when the visitor uses them; bidding.js doesn't know about it.
;(function () {
  if (window.location.hostname !== 'pubnubdevelopers.github.io' && sessionStorage.getItem('auction-demo-keys') !== 'on') return

  // login.js stores the page the visitor started from; the framework reports to it.
  const cookie = document.cookie.split('; ').find(c => c.startsWith('orgwindowlocation='))
  const windowLocation = cookie ? decodeURIComponent(cookie.substring('orgwindowlocation='.length)) : undefined

  const script = document.createElement('script')
  script.src = 'https://darryncampbell-pubnub.github.io/pubnub-demo-utils/js/interactive-demo-interface/v1/demo-interface.js'
  document.head.appendChild(script)

  function track (action) {
    if (typeof window.actionCompleted === 'function') window.actionCompleted({ action, windowLocation })
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('a, button')
    if (!target) return
    if (target.id === 'auctions') track('View Your Auctions')
    else if (['Woodwind', 'Brass', 'Stringed', 'Percussion'].includes(target.id)) track('Change Category')
    else if (target.id === 'newPublish') track('Create An Auction')
    else if (target.matches('[data-bidding-channel]')) track('Place A Bid')
  })
})()

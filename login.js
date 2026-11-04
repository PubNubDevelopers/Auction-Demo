window.onload = () => {
  document.cookie = "orgwindowlocation=" + window.location.href; // For the interactive demo framework on pubnub.com (demo-tracking.js).
}

const login = () => {
  window.location.href = "./bidding.html" + window.location.search
}

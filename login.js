//let auth0 = null

window.onload = async () => {
  //await configureClient()
  document.cookie = "orgwindowlocation="+window.location.href;
}

const configureClient = async () => {
  //auth0 = await createAuth0Client({
  //  domain: "authclone.auth0.com",
  //  client_id: "SLdXBBCNTZTa99Zio4Pe8eJ5hxjPrOS5",
  //})
}

const login = async () => {
  window.location.href="./bidding.html" + window.location.search
  //await auth0.loginWithRedirect({
  //  redirect_uri: "https://pubnubdevelopers.github.io/Auction-Demo/bidding.html",
  //})
}



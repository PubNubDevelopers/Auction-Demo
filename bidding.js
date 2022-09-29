let auth0 = null;
let sub = null;
let pubnub = null;
let first_result = null;
let current_channel = null;
let itemsArea = null;

window.onload = async () => {
    await configureClient()
    await processLoginState()
    updateUI();
    itemsArea = document.getElementById('items-area');
}

const configureClient = async () => {
    auth0 = await createAuth0Client({
        domain: "authclone.auth0.com",
        client_id: "SLdXBBCNTZTa99Zio4Pe8eJ5hxjPrOS5",
    })
}

const processLoginState = async () => {
    // Check code and state parameters
    const query = window.location.search
    if (query.includes("code=") && query.includes("state=")) {
        // Process the login state
        await auth0.handleRedirectCallback()
        // Use replaceState to redirect the user away and remove the querystring parameters
        window.history.replaceState({}, document.title, window.location.pathname)
    }
}

const logout = () => {
    auth0.logout({
        returnTo: "https://pubnubdevelopers.github.io/Auction-Demo/",
    })
}

function makeRandom(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

class auctionItemControl { // Formats messages and scrolls into view.
    displayItem(uuid, msg_uuid, msg, timetoken) {
        if (!itemsArea.innerHTML.includes(msg.bidding_channel)) {
            itemsArea.innerHTML = this.msg(uuid, msg_uuid, msg, 'center', 'dark', timetoken) + itemsArea.innerHTML
        }
    }
    msg(uuid, msg_uuid, msg, side, style, timetoken) {
        var date = new Date(Math.trunc((timetoken / 10000), 16));
        var timedisplay = date.toLocaleString();
        var new_msg = {};
        new_msg.description = msg.description;
        new_msg.name = msg.name;
        new_msg.end_time = msg.end_time;
        new_msg.bidding_channel = msg.bidding_channel;
        new_msg.image = msg.image;
        new_msg.shipping = msg.shipping;
        new_msg.collect_details = msg.collect_details;

        if (new_msg.description == undefined) {
            new_msg.description = "This is a rare item. Bid on this item as you will never find it ever again. I only have one.";
        }
        if (new_msg.name == undefined) {
            new_msg.name = "Test Item Name";
        }
        if (new_msg.end_time == undefined) {
            new_msg.end_time = new Date().getTime()
        }
        if (new_msg.bidding_channel == undefined) {
            new_msg.bidding_channel = "TestItemName" + new Date().getTime() + 3650000;
        }
        if (new_msg.image == undefined) {
            new_msg.image = "https://pubnubdevelopers.github.io/Auction-Demo/images/lamp.png";
        }
        if (new_msg.shipping == undefined) {
            new_msg.shipping = "Yes";
        }
        if (new_msg.collect_details == undefined) {
            new_msg.collect_details = "Please contact chandler@pubnub.com for payment and shipping. Thank you for buying (:";
        }

        // Countdown
        var x = setInterval(function () {
            if (document.getElementById("countdown-" + new_msg.bidding_channel) != null) {
                // Get today's date and time
                var now = new Date().getTime();
                // Find the distance between now and the count down date
                var distance = new_msg.end_time - now;
                // Time calculations for days, hours, minutes and seconds
                var days = Math.floor(distance / (1000 * 60 * 60 * 24));
                var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                var seconds = Math.floor((distance % (1000 * 60)) / 1000);
                // Display the result in the element with id="demo"
                document.getElementById("countdown-" + new_msg.bidding_channel).innerHTML = days + "d " + hours + "h "
                    + minutes + "m " + seconds + "s ";
                // If the count down is finished, write some text
                if (distance < 0) {
                    clearInterval(x);
                    document.getElementById("countdown-" + new_msg.bidding_channel).innerHTML = "Auction Has Ended";
                    document.getElementsByClassName(new_msg.bidding_channel + "-accordionBid")[0].style.visibility = 'hidden';
                    // Get last Bid
                    pubnub.fetchMessages(
                        {
                            channels: [new_msg.bidding_channel],
                            count: 1
                        },
                        function (status, response) {
                            if (response.channels[encodeURIComponent(new_msg.bidding_channel)] && encodeURIComponent(new_msg.bidding_channel) in response.channels) {
                                response.channels[encodeURIComponent(new_msg.bidding_channel)].forEach((message) => {
                                    if (message.uuid == pubnub.getUUID()) { // you won the bid!!
                                        document.getElementById('win-' + new_msg.bidding_channel).style.visibility = 'visible';
                                    }
                                });
                            }
                        });
                }
            } else {
                clearInterval(x);
            }
        }, 1000);

        pubnub.subscribe({ // Subscribe to wait for messages
            channels: [new_msg.bidding_channel],
            withPresence: false
        });

        // Get last Bid
        pubnub.fetchMessages(
            {
                channels: [new_msg.bidding_channel],
                count: 1
            },
            function (status, response) {
                if (response.channels[encodeURIComponent(new_msg.bidding_channel)] && encodeURIComponent(new_msg.bidding_channel) in response.channels) {
                    response.channels[encodeURIComponent(new_msg.bidding_channel)].forEach((message) => {
                        document.getElementById('current-bid-' + new_msg.bidding_channel).innerHTML = formatter.format(message.message);
                    });
                }
            });

        // Delete the next line to fix images
        new_msg.image = "https://pubnubdevelopers.github.io/Auction-Demo/images/lamp.png";
        var new_vote = "x"+makeRandom(5);
        var msgTemp = `
            <div class="card text-white bg-${style}">
                <div class="card-body">
                    <h2 class="card-subtitle mb-2 text-${side}"> <span class="display-${uuid}">${new_msg.name}<span></h2>
                    <div class="text-center">
                        <img src="${new_msg.image}" class="rounded" alt="Image of item for sale">
                    </div>
                    <br>
                    <h3 class="card-subtitle mb-2 text-${side}"><small>Time Left: <span data-endtime="${new_msg.end_time}" data-biddingchannel="${new_msg.bidding_channel}" class="countdowns" id="countdown-${new_msg.bidding_channel}"><span></small></h3>
                    <h3 class="card-subtitle mb-2 text-${side}"><small>Current Bid: <span id="current-bid-${new_msg.bidding_channel}">No Bids Yet<span></small></h3>
                    <h6 class="card-subtitle mb-2 text-${side}"><small>Posted on: ${timedisplay}</small></h6>
                    <h6 class="card-subtitle mb-2 text-${side}"><small>Offers Shipping: ${new_msg.shipping}</small></h6>
                    <p class="card-text text-${side}">${new_msg.description}</p>
                    <div class="alert alert-warning" id="win-${new_msg.bidding_channel}" style="visibility: hidden;" role="alert">
                        <h2 class="card-subtitle mb-2 text-${side}">You won this item!</h2>
                        <h4 class="card-subtitle mb-2 text-${side}"><small>Collection Details: ${new_msg.collect_details}</small></h6>
                    </div>

                    <div class="col text-center">
                        <div class="accordion accordion-flush ${new_msg.bidding_channel}-accordionBid" id="${new_vote}accordionBid">
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="headingPlaceBid">
                                <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${new_vote}collapseOne" aria-expanded="true" aria-controls="${new_vote}collapseOne">
                                    Place Bid
                                </button>
                                </h2>
                                <div id="${new_vote}collapseOne" class="accordion-collapse collapse" aria-labelledby="headingPlaceBid" data-bs-parent="#${new_vote}accordionBid">
                                    <div class="accordion-body text-dark">
                                        <strong>Read Carefully:</strong> By placing a bid you are making an agreement with the seller to pay for your item. You must work with the seller directly to pay for the item and arrange for shipping or pickup. You will get contact details if you place the winning bid. 
                                        <br>
                                        <br>
                                        <form>
                                            <div class="mb-3">
                                                <h5><label for="submitBid" class="form-label">Your Bid:</label></h5>
                                                <input id="${new_msg.bidding_channel}-bid-input" type="number" min="0.01" step="0.01"  class="form-control" id="submitBid">
                                            </div>
                                            <button type="button" id="${new_msg.bidding_channel}-bid" onclick="placeBid('${new_msg.bidding_channel}', '${new_msg.name}','${new_msg.description}', '${new_msg.image}', '${new_msg.collect_details}', '${new_msg.shipping}', '${new_msg.end_time}')" class="btn btn-primary">Place Bid</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `;
        return msgTemp;
    }
}

var formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

var auction_item = new auctionItemControl();

function placeBid(new_msg_bidding_channel, new_msg_name, new_msg_description, new_msg_image, new_msg_collect_details, new_msg_shipping, new_msg_end_time) {
    // Get last Bid
    pubnub.fetchMessages(
        {
            channels: [new_msg_bidding_channel],
            count: 1
        },
        function (status, response) {
            if (response.channels[encodeURIComponent(new_msg_bidding_channel)] && encodeURIComponent(new_msg_bidding_channel) in response.channels) {
                response.channels[encodeURIComponent(new_msg_bidding_channel)].forEach((message) => {
                    var last_bid = message.message;
                    var new_bid = document.getElementById(new_msg_bidding_channel + '-bid-input').value;
                    if (parseInt(new_bid) > parseInt(last_bid)) {
                        pubnub.publish({
                            message: new_bid,
                            channel: new_msg_bidding_channel,
                        }, (status, response) => {
                            // handle status, response
                            //console.log(response);
                        });
                        // Add to your-bids
                        let new_auction_item = {
                            name: new_msg_name,
                            description: new_msg_description,
                            image: new_msg_image,
                            collect_details: new_msg_collect_details,
                            shipping: new_msg_shipping,
                            end_time: new_msg_end_time,
                            bidding_channel: new_msg_bidding_channel
                        }
                        pubnub.publish({
                            message: new_auction_item,
                            channel: sub,
                        }, (status, response) => {
                            // handle status, response
                            // console.log(response);
                        });
                        alert("Your bid has been placed.")
                    } else {
                        alert("Your new bid must be higher than the previous bids.")
                    }
                });
            }
        });
}

function loadMore() {
    document.getElementById('page-buttons').style.visibility = 'hidden';
    pubnub.fetchMessages( // Get the last 10 items
        {
            channels: [current_channel],
            count: 11,
            reverse: false,
            start: first_result
        },
        function (status, response) {
            let message_count = 0;
            if (response.channels[encodeURIComponent(current_channel)] && encodeURIComponent(current_channel) in response.channels) {
                response.channels[encodeURIComponent(current_channel)].forEach((message) => {
                    message_count = message_count + 1;
                    if (message_count == 2) {
                        first_result = message.timetoken;
                    }
                    if (message_count > 10) {
                        document.getElementById('page-buttons').style.visibility = 'visible';
                    }
                    auction_item.displayItem(pubnub.getUUID(), message.uuid, message, message.timetoken);
                });
            }
        }
    );
    return false;
}

function setActive(e) {
    var elems = document.querySelector(".active");
    if (elems !== null) {
        elems.classList.remove("active");
    }
    const target = e.target;
    if (!target || !target.matches(selector)) {
        return;
    }
    e.target.classList.add('active');
}

function newItem() {
    let new_end_time = new Date();
    if (document.getElementById("time_select").value == 1) {
        new_end_time = new Date(new_end_time.getTime() + 3600000);
    } else if (document.getElementById("time_select").value == 2) {
        new_end_time = new Date(new_end_time.getTime() + 43200000);
    } else if (document.getElementById("time_select").value == 3) {
        new_end_time = new Date(new_end_time.getTime() + 86400000);
    }
    let set_end_time = new_end_time.getTime().toString();
    let will_ship = "No";
    if (document.getElementById('shipCheckChecked').checked) {
        will_ship = "Yes";
    }
    let new_bidding_channel = makeRandom(15) + "_" + set_end_time;
    let new_auction_item = {
        name: document.getElementById('nameInput').value,
        description: document.getElementById('desInput').value,
        //image: document.getElementById('imageInput').value,
        image: "https://pubnubdevelopers.github.io/Auction-Demo/images/lamp.png",
        collect_details: document.getElementById('contactInput').value,
        shipping: will_ship,
        end_time: set_end_time,
        bidding_channel: new_bidding_channel
    }
    pubnub.publish({
        message: new_auction_item,
        channel: current_channel,
    }, (status, response) => {
        // handle status, response
        console.log(response);
    });
    pubnub.publish({
        message: new_auction_item,
        channel: sub + "_auctions",
    }, (status, response) => {
        // console.log(response);
        // handle status, response
    });
    pubnub.publish({
        message: "0",
        channel: new_bidding_channel,
    }, (status, response) => {
        // handle status, response
        //console.log(response);
    });
    alert("New auction has been posted.");
    document.getElementById('contactInput').value = "";
    document.getElementById('nameInput').value = "";
    document.getElementById('imageInput').value = "";
    document.getElementById('desInput').value = "";
    loadBidding(current_channel); // Reload view
}

function loadBidding(channel) {
    itemsArea.innerHTML = "";
    pubnub.unsubscribeAll();
    current_channel = channel;
    if (channel == "your-bids") {
        current_channel = sub;
        setActive("your-bids");
        document.getElementById('cat-label-head').innerHTML = "Your Recent Bids";
        document.getElementById('create_new').style.visibility = 'hidden';
        document.getElementById('online-users-label').style.visibility = 'hidden';
    } else if (channel == "auctions") { // If loading your bids or auctions then hide the create new auction button
        setActive("auctions");
        current_channel = sub + "_auctions";
        document.getElementById('cat-label-head').innerHTML = "Your Auctions";
        document.getElementById('create_new').style.visibility = 'hidden';
        document.getElementById('online-users-label').style.visibility = 'hidden';
    } else {
        setActive(channel);
        document.getElementById('cat-label-head').innerHTML = channel;
        document.getElementById('create_new').style.visibility = 'visible';
        document.getElementById('online-users-label').style.visibility = 'visible';
        pubnub.hereNow({ // Update the number of online members.
            channels: [channel],
        }).then((response) => {
            if (response.totalOccupancy == 0) {
                document.getElementById("online-users-count").innerHTML = "1";
            } else {
                document.getElementById("online-users-count").innerHTML = response.totalOccupancy;
            }
        }).catch((error) => {
            // console.log(error)
        });
        pubnub.subscribe({ // Subscribe to wait for messages
            channels: [channel],
            withPresence: true
        });
    }

    pubnub.addListener({ // Get new messages.
        presence: (presenceEvent) => { // Update the number of online members.
            if (presenceEvent.occupancy == 0) {
                document.getElementById("online-users-count").innerHTML = "1";
            } else {
                document.getElementById("online-users-count").innerHTML = presenceEvent.occupancy;
            }
        },
        message: function (msg) {
            // console.log(msg);
            document.getElementById("current-bid-" + msg.channel).innerHTML = formatter.format(msg.message);
        }
    });

    document.getElementById('page-buttons').style.visibility = 'hidden';
    pubnub.fetchMessages( // Get the last 10 items
        {
            channels: [current_channel],
            count: 11,
            reverse: false,
        },
        function (status, response) {
            let message_count = 0;
            if (response.channels[encodeURIComponent(current_channel)] && encodeURIComponent(current_channel) in response.channels) {
                response.channels[encodeURIComponent(current_channel)].forEach((message) => {
                    message_count = message_count + 1;
                    if (message_count == 2) {
                        first_result = message.timetoken;
                    }
                    if (message_count > 10) {
                        document.getElementById('page-buttons').style.visibility = 'visible';
                    }
                    auction_item.displayItem(pubnub.getUUID(), message.uuid, message.message, message.timetoken);
                });
            }
        }
    );
}

const updateUI = async () => {
    const isAuthenticated = await auth0.isAuthenticated()
    if (!isAuthenticated) {
        window.location.replace("https://pubnubdevelopers.github.io/Auction-Demo/");
    } else {
        const userdetails = await auth0.getUser();
        // console.log("User ID: " + userdetails.sub);
        pubnub = new PubNub({ // Set your PubNub keys here 
            publishKey: 'pub-c-9c98cd2a-92ee-4951-a92c-3796ee1b739d',
            subscribeKey: 'sub-c-06995b2a-b1f3-4079-929a-056e9d243775',
            uuid: userdetails.sub
        });
        sub = userdetails.sub;
        loadBidding("your-bids");
    }
}
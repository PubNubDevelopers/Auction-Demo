// The PubNub client and your User ID come from config.js.
let sub = null; // Your User ID: your bids go to the channel <User ID>, your auctions to <User ID>_auctions.
let first_result = null;
let current_channel = null;
let itemsArea = document.getElementById('items-area');

window.onload = () => {
    sub = pubnub.getUserId();
    itemsArea = document.getElementById('items-area');
    loadBidding("your-bids");
}

const logout = () => {
    window.location.href = "./index.html" + window.location.search
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

let viewSubscriptions = []; // The current view's subscriptions: its category channel and the items' bidding channels.
const displayedItems = new Map(); // Bidding channel → item, for the items on screen.

// A bid must be a positive number higher than the current bid. Amounts are strings with cents, like "10.50".
function isHigherBid(newBid, lastBid) {
    const bid = Number(newBid);
    return String(newBid).trim() !== '' && Number.isFinite(bid) && bid > 0 && bid > Number(lastBid);
}

// You won if the last message on the bidding channel is a real bid (not the "0" that opens the auction) and you sent it.
function isWinner(lastMessage, userId) {
    return !!lastMessage && Number(lastMessage.message) > 0 && lastMessage.uuid === userId;
}

// Item text comes from other users, so escape it before putting it into the page's HTML.
function escapeHtml(text) {
    return String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function showCurrentBid(biddingChannel, bid) {
    const element = document.getElementById('current-bid-' + biddingChannel);
    if (element) element.textContent = formatter.format(Number(bid));
}

class auctionItemControl { // Formats messages and scrolls into view.
    displayItem(uuid, msg_uuid, msg, timetoken) {
        if (msg && msg.bidding_channel && !displayedItems.has(msg.bidding_channel)) {
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
            new_msg.collect_details = "Please contact devrel@pubnub.com for payment and shipping. Thank you for buying (:";
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
                            const lastMessage = response?.channels?.[new_msg.bidding_channel]?.[0];
                            if (isWinner(lastMessage, pubnub.getUserId())) { // you won the bid!!
                                document.getElementById('win-' + new_msg.bidding_channel).style.visibility = 'visible';
                            }
                        });
                }
            } else {
                clearInterval(x);
            }
        }, 1000);

        // Subscribe to the item's bidding channel: every new bid updates the current bid.
        const subscription = pubnub.channel(new_msg.bidding_channel).subscription();
        let liveBidSeen = false;
        subscription.onMessage = (event) => {
            liveBidSeen = true;
            showCurrentBid(event.channel, event.message);
        };
        subscription.subscribe();
        viewSubscriptions.push(subscription);
        displayedItems.set(new_msg.bidding_channel, new_msg);

        // Get last Bid
        pubnub.fetchMessages(
            {
                channels: [new_msg.bidding_channel],
                count: 1
            },
            function (status, response) {
                const lastMessage = response?.channels?.[new_msg.bidding_channel]?.[0];
                if (lastMessage && !liveBidSeen) showCurrentBid(new_msg.bidding_channel, lastMessage.message); // A live bid is newer.
            });

        // Delete the next line to fix images
        new_msg.image = "./images/lamp.png";
        var new_vote = "x"+makeRandom(5);
        var item = {}; // The item's fields, escaped for HTML.
        for (const key of Object.keys(new_msg)) item[key] = escapeHtml(new_msg[key]);
        var msgTemp = `
            <div class="card text-white bg-${style}">
                <div class="card-body">
                    <h2 class="card-subtitle mb-2 text-${side}"> <span class="display-${uuid}">${item.name}<span></h2>
                    <div class="text-center">
                        <img src="${item.image}" class="rounded" alt="Image of item for sale">
                    </div>
                    <br>
                    <h3 class="card-subtitle mb-2 text-${side}"><small>Time Left: <span data-endtime="${item.end_time}" data-biddingchannel="${item.bidding_channel}" class="countdowns" id="countdown-${item.bidding_channel}"><span></small></h3>
                    <h3 class="card-subtitle mb-2 text-${side}"><small>Current Bid: <span id="current-bid-${item.bidding_channel}">No Bids Yet<span></small></h3>
                    <h6 class="card-subtitle mb-2 text-${side}"><small>Posted on: ${timedisplay}</small></h6>
                    <h6 class="card-subtitle mb-2 text-${side}"><small>Offers Shipping: ${item.shipping}</small></h6>
                    <p class="card-text text-${side}">${item.description}</p>
                    <div class="alert alert-warning" id="win-${item.bidding_channel}" style="visibility: hidden;" role="alert">
                        <h2 class="card-subtitle mb-2 text-${side}">You won this item!</h2>
                        <h4 class="card-subtitle mb-2 text-${side}"><small>Collection Details: ${item.collect_details}</small></h6>
                    </div>

                    <div class="col text-center">
                        <div class="accordion accordion-flush ${item.bidding_channel}-accordionBid" id="${new_vote}accordionBid">
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
                                                <input id="${item.bidding_channel}-bid-input" type="number" min="0.01" step="0.01"  class="form-control" id="submitBid">
                                            </div>
                                            <button type="button" id="${item.bidding_channel}-bid" data-bidding-channel="${item.bidding_channel}" class="btn btn-primary">Place Bid</button>
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

// The Place Bid buttons carry their item's bidding channel.
document.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-bidding-channel]');
    if (button) placeBid(button.dataset.biddingChannel);
});

function placeBid(biddingChannel) {
    const item = displayedItems.get(biddingChannel);
    // Get last Bid
    pubnub.fetchMessages(
        {
            channels: [biddingChannel],
            count: 1
        },
        function (status, response) {
            const lastMessage = response?.channels?.[biddingChannel]?.[0];
            const last_bid = lastMessage ? lastMessage.message : "0";
            const new_bid = document.getElementById(biddingChannel + '-bid-input').value;
            if (isHigherBid(new_bid, last_bid)) {
                pubnub.publish({
                    message: new_bid,
                    channel: biddingChannel,
                }, (status, response) => {
                    // handle status, response
                    //console.log(response);
                });
                // Add to your-bids
                let new_auction_item = {
                    name: item.name,
                    description: item.description,
                    image: item.image,
                    collect_details: item.collect_details,
                    shipping: item.shipping,
                    end_time: item.end_time,
                    bidding_channel: biddingChannel
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

function loadMore() {
    document.getElementById('page-buttons').style.visibility = 'hidden';
    pubnub.fetchMessages( // Get the latest items
        {
            channels: [current_channel],
            count: 11,
            reverse: false,
            start: first_result
        },
        function (status, response) {
            let message_count = 0;
            const messages = response?.channels?.[current_channel];
            if (messages) {
                messages.forEach((message) => {
                    message_count = message_count + 1;
                    if (message_count == 2) {
                        first_result = message.timetoken;
                    }
                    if (message_count > 10) {
                        document.getElementById('page-buttons').style.visibility = 'visible';
                    }
                    auction_item.displayItem(pubnub.getUserId(), message.uuid, message.message, message.timetoken);
                });
            }
            if (document.getElementById('items-area').childNodes.length === 0) {
                document.getElementById('items-area').innerHTML = "<div class='card text-white bg-dark'><div class='card-body'>There are no auction listings to show. Select a category from the menu and then create a new auction. Auctions you create can be viewed in the 'Your Auctions' section. When you place a bid on an auction item it can be viewed in the 'Your Bids' section.</div></div>"
            } 
        }
    );
    return false;
}

// You are on the page too, so show at least 1.
function showOnlineCount(occupancy) {
    document.getElementById("online-users-count").textContent = occupancy > 0 ? occupancy : 1;
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
        image: "./images/lamp.png",
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
    document.getElementById('desInput').value = "";
    loadBidding(current_channel); // Reload view
}

function loadBidding(channel) {
    if (itemsArea != null) 
    
    itemsArea.innerHTML = "";
    viewSubscriptions.forEach((subscription) => subscription.unsubscribe()); // Leave the previous view's channels.
    viewSubscriptions = [];
    displayedItems.clear();
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
        // Subscribe to the category channel with Presence: join and leave events update the number of online members.
        const subscription = pubnub.channel(channel).subscription({ receivePresenceEvents: true });
        let presenceEventSeen = false;
        subscription.onPresence = (presenceEvent) => {
            presenceEventSeen = true;
            showOnlineCount(presenceEvent.occupancy);
        };
        pubnub.hereNow({ // Update the number of online members.
            channels: [channel],
        }).then((response) => {
            // A Presence event that arrived first is newer; so is another view the user switched to meanwhile.
            if (!presenceEventSeen && viewSubscriptions.includes(subscription)) showOnlineCount(response.totalOccupancy);
        }).catch((error) => {
            // console.log(error)
        });
        subscription.subscribe();
        viewSubscriptions.push(subscription);
    }

    document.getElementById('page-buttons').style.visibility = 'hidden';
    pubnub.fetchMessages( // Get the latest items
        {
            channels: [current_channel],
            count: 11,
            reverse: false,
        },
        function (status, response) {
            let message_count = 0;
            const messages = response?.channels?.[current_channel];
            if (messages) {
                messages.forEach((message) => {
                    message_count = message_count + 1;
                    if (message_count == 2) {
                        first_result = message.timetoken;
                    }
                    if (message_count > 10) {
                        document.getElementById('page-buttons').style.visibility = 'visible';
                    }
                    auction_item.displayItem(pubnub.getUserId(), message.uuid, message.message, message.timetoken);
                });
            }
            if (document.getElementById('items-area').childNodes.length === 0) {
                document.getElementById('items-area').innerHTML = "<div class='card text-white bg-dark'><div class='card-body'>There are no auction listings to show. Select a category from the menu and then create a new auction. Auctions you create can be viewed in the 'Your Auctions' section. When you place a bid on an auction item it can be viewed in the 'Your Bids' section.</div></div>"
            } 
        }
    );
}

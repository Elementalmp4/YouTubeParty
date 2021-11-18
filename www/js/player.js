const GatewayServerURL = (location.protocol == "https:" ? "wss://" : "ws://") + location.host + "/gateway";
var Gateway = new WebSocket(GatewayServerURL);

var Globals = {
    USER_PROPERTIES: undefined,
    TOKEN: undefined,
    PLAYER: undefined,
    CURRENT_VIDEO_ID: undefined,
    ROOM_ID: undefined,
    LAST_MESSAGE_AUTHOR: undefined,
    CAN_CONTROL_PLAYER: undefined,
    ROOM_COLOUR: undefined,
    TYPING_COUNT: 0,
    TYPING: false,
    PLAYER_READY: false
}

const YOUTUBE_URL = "https://youtube.com/watch?v=";

function showTypingMessage() {
    document.getElementById("typing-message").style.display = "block";
}

function hideTypingMessage() {
    document.getElementById("typing-message").style.display = "none";
}

function updateTyping(data) {
    if (data.user == Globals.USER_PROPERTIES.username) return;
    if (data.mode == "start") Globals.TYPING_COUNT = Globals.TYPING_COUNT + 1;
    else Globals.TYPING_COUNT = Globals.TYPING_COUNT - 1;

    if (Globals.TYPING_COUNT > 0) showTypingMessage();
    else hideTypingMessage();
};

function sendGatewayMessage(message) {
    Gateway.send(JSON.stringify(message));
}

function addChatMessage(data) {
    let author = data.author;
    let colour = data.colour;
    let content = data.content;
    let modifiers = data.modifiers !== "" ? `class="${data.modifiers}"` : "";

    let newMessage = `<div class="chat-message">`;
    if (Globals.LAST_MESSAGE_AUTHOR !== author) newMessage += `<p class="msg-nickname" style="color:${colour}">${author}</p><br>`;
    newMessage += `<p ${modifiers}>${content}</p></div>`;
    if (Globals.LAST_MESSAGE_AUTHOR !== author) newMessage += "<br>";

    Globals.LAST_MESSAGE_AUTHOR = author;

    $("#chat-history").prepend(newMessage);
    $('#chat-history').scrollTop($('#chat-history')[0].scrollHeight);
}

function displayLocalMessage(message) {
    addChatMessage({ "author": "System", "colour": Globals.ROOM_COLOUR, "content": message, "modifiers": "system" });
}

function sendPlayingMessage() {
    let time = Globals.PLAYER.getCurrentTime();
    sendGatewayMessage({ "type": "party-playvideo", "data": { "token": Globals.TOKEN, "roomID": Globals.ROOM_ID, "timestamp": time } });
    displayLocalMessage("Video playing at " + new Date(time * 1000).toISOString().substr(11, 8));
}

function sendPausedMessage() {
    sendGatewayMessage({ "type": "party-pausevideo", "data": { "token": Globals.TOKEN, "roomID": Globals.ROOM_ID } });
    displayLocalMessage("Video paused");
}

function sendVideoEndedMessage() {
    sendGatewayMessage({ "type": "party-videoend", "data": { "token": Globals.TOKEN, "roomID": Globals.ROOM_ID } });
    displayLocalMessage("Video ended!");
}

function onYouTubeIframeAPIReady() {
    Globals.PLAYER = new YT.Player('player', {
        height: '100%',
        width: '80%',
        playerVars: { 'controls': Globals.CAN_CONTROL_PLAYER ? 1 : 0 },
        videoId: Globals.CURRENT_VIDEO_ID,
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady() {
    Globals.PLAYER_READY = true;
}

function onPlayerStateChange(event) {
    let playerState = event.data;
    switch (playerState) {
        case 0:
            sendVideoEndedMessage();
            break;
        case 1:
            sendPlayingMessage();
            break;
        case 2:
            sendPausedMessage();
            break;
    }
}

function loadVideo(youTubeVideoID) {
    Globals.CURRENT_VIDEO_ID = youTubeVideoID;
    if (Globals.PLAYER_READY) Globals.PLAYER.loadVideoById(youTubeVideoID, 0);
}

function startVideo(data) {
    if (Globals.PLAYER.getPlayerState() !== YT.PlayerState.PLAYING) {
        Globals.PLAYER.seekTo(data.time, true);
        Globals.PLAYER.playVideo();
    }
}

function pauseVideo() {
    if (Globals.PLAYER.getPlayerState() !== YT.PlayerState.PAUSED) {
        Globals.PLAYER.pauseVideo();
    }
}

function convertVideoList(videos) {
    if (videos.length == 0) return "No videos queued!";
    else {
        let videosFormatted = [];
        videos.forEach(video => {
            videosFormatted.push("<a href='" + YOUTUBE_URL + video + "'>" + video + "</a>");
        });
        return videosFormatted.join("<br>");
    }
}

function handleChatMessage(data) {
    addChatMessage(data);
}

function showQueueInChat(videos) {
    displayLocalMessage("Queued Videos:<br><br>" + convertVideoList(videos));
}

function refreshModalQueueData(videos) {
    let message = convertVideoList(videos);
    document.getElementById("queue-items").innerHTML = message + "<br><br>";
    document.getElementById("queue-title").innerHTML = "Queued Items (" + videos.length + ")";
}

function handleSystemMessage(response) {
    switch (response.type) {
        case "playvideo":
            startVideo(response.data);
            break;
        case "pausevideo":
            pauseVideo();
            break;
        case "changevideo":
            loadVideo(response.data.video);
            break;
        case "typingupdate":
            updateTyping(response.data);
            break;
        case "getqueue":
            if (response.data.display == "chat") showQueueInChat(response.data.videos);
            else refreshModalQueueData(response.data.videos);

    }
}

function initialiseParty(response) {
    let options = JSON.parse(response);
    loadVideo(options.video);
    Globals.CAN_CONTROL_PLAYER = options.canControl;
    Globals.ROOM_COLOUR = options.theme;

    var chatInput = document.getElementById("chat-input");
    chatInput.addEventListener("focus", function() {
        this.style.borderBottom = "2px solid " + Globals.ROOM_COLOUR;
    });

    chatInput.addEventListener("blur", function() {
        this.style.borderBottom = "2px solid grey";
    });

    displayLocalMessage("Use /help to see some chat commands! Use ctrl + m to open the player menu!");
}

Gateway.onopen = function() {
    console.log("Connected To Gateway");
}

Gateway.onclose = function() {
    console.log("Connection Lost");
}

Gateway.onmessage = function(message) {
    const packet = JSON.parse(message.data);
    console.log(packet);

    if (!packet.success) {
        switch (packet.response) {
            case "An invalid token was provided":
                window.location.href = location.protocol + "//" + location.host + "/login.html?redirect=" + location.pathname + location.search;
                break;
            case "An invalid room ID was provided":
                displayLocalMessage("This room does not exist! Check the room ID and try again!");
                break;
            case "You do not have permission to do that!":
                displayLocalMessage(packet.response);
        }
    }

    switch (packet.origin) {
        case "party-joinparty":
            initialiseParty(packet.response);
            break;
        case "user-getprofile":
            Globals.USER_PROPERTIES = JSON.parse(packet.response);
            break;
        case "party-chatmessage":
            if (!packet.success) displayLocalMessage(packet.response);
            break;

    }

    switch (packet.type) {
        case "party-chatmessage":
            handleChatMessage(packet.data);
            break;
        case "party-systemmessage":
            handleSystemMessage(packet.data);
            break;
    }
}

function getToken() {
    let token = window.localStorage.getItem("token");
    if (token == null) window.location.href = location.protocol + "//" + location.host + "/login.html?redirect=" + location.pathname + location.search;
    else return token;
}

function embedPlayer() {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

Gateway.onopen = function() {
    hideTypingMessage();
    const selfURL = new URL(location.href);
    Globals.TOKEN = getToken();

    if (!selfURL.searchParams.get("roomID")) {
        window.location.href = location.protocol + "//" + location.host + "/home.html";
    } else {
        Globals.ROOM_ID = selfURL.searchParams.get("roomID");
        embedPlayer();
        console.log("Ready");
        sendGatewayMessage({ "type": "party-joinparty", "data": { "token": Globals.TOKEN, "roomID": Globals.ROOM_ID } });
        sendGatewayMessage({ "type": "user-getprofile", "data": { "token": Globals.TOKEN } });
    }
}

Gateway.onclose = function() {
    displayLocalMessage("You lost connection to the server! Use /r to reconnect");
}

function handleSetVideoCommand(video) {
    let videoURL = new URL(video);
    let videoID = videoURL.searchParams.get("v");
    if (videoID) sendGatewayMessage({ "type": "party-changevideo", "data": { "token": Globals.TOKEN, "roomID": Globals.ROOM_ID, "video": Globals.videoID } });
}

function skipVideo() {
    sendGatewayMessage({ "type": "party-skipvideo", "data": { "token": Globals.TOKEN, "roomID": Globals.ROOM_ID } });
    sendGatewayMessage({ "type": "party-getqueue", "data": { "token": Globals.TOKEN, "roomID": Globals.ROOM_ID, "display": "modal" } });
}

function clearQueue() {
    sendGatewayMessage({ "type": "party-clearqueue", "data": { "token": Globals.TOKEN, "roomID": Globals.ROOM_ID } });
    sendGatewayMessage({ "type": "party-getqueue", "data": { "token": Globals.TOKEN, "roomID": Globals.ROOM_ID, "display": "modal" } });
}

function handleQueueCommand(args) {
    if (args.length == 0) sendGatewayMessage({ "type": "party-getqueue", "data": { "token": Globals.TOKEN, "roomID": Globals.ROOM_ID, "display": "chat" } });
    else {
        let videoURL = new URL(args[0]);
        let videoID = videoURL.searchParams.get("v");
        if (videoID) sendGatewayMessage({ "type": "party-queuevideo", "data": { "token": Globals.TOKEN, "roomID": Globals.ROOM_ID, "video": videoID } });
    }
}

function handleHelpCommand() {
    displayLocalMessage(`
    ~ ~ YTParty Help ~ ~<br>
    /help - shows this message<br><br>
    /setvideo [video URL] - changes the currently playing video<br><br>
    /i [message] - changes your message to italics<br><br>
    /u [message] - changes your message to underline<br><br>
    /b [message] - makes your message bold<br><br>
    /s [message] - changes your message to strikethrough<br><br>
    /c [message] - changes your message to cursive<br><br>
    /cc [message] - cHaNgEs YoUr TeXt LiKe ThIs<br><br>
    /big [message] - makes your message big<br><br>
    /r - reloads your session<br>
    `);
}

function toCrazyCase(body) {
    let toUpper = Math.round(Math.random()) == 1 ? true : false;
    let messageLetters = body.split("");
    let final = "";

    for (var i = 0; i < messageLetters.length; i++) {
        if (messageLetters[i].replace(/[A-Za-z]+/g, " ") !== "") {
            if (toUpper) final += messageLetters[i].toLowerCase();
            else final += messageLetters[i].toUpperCase();
            toUpper = !toUpper;
        } else final += messageLetters[i];
    }
    return final;
}

function sendTypingStop() {
    if (Globals.TYPING) {
        Globals.TYPING = false;
        sendGatewayMessage({ "type": "party-typingupdate", "data": { "token": Globals.TOKEN, "roomID": Globals.ROOM_ID, "mode": "stop", "user": Globals.USER_PROPERTIES.username } });
    }
}

function sendTypingStart() {
    if (!Globals.TYPING) {
        Globals.TYPING = true;
        sendGatewayMessage({ "type": "party-typingupdate", "data": { "token": Globals.TOKEN, "roomID": Globals.ROOM_ID, "mode": "start", "user": Globals.USER_PROPERTIES.username } });
    }
}

document.getElementById("chat-input").addEventListener("keyup", function(event) {
    if (event.key == "Enter") {
        sendTypingStop();
        event.preventDefault();
        let message = document.getElementById("chat-input").value.trim();
        if (message == "") return;
        if (message.length > 800) {
            displayLocalMessage("Your message is too long! Messages cannot be longer than 800 characters.");
            return;
        }

        let sendChatMessage = true;
        let modifiers = "";

        if (message.startsWith("/")) {
            const args = message.slice(1).split(/ +/);
            const command = args.shift().toLowerCase();

            switch (command) {
                case "help":
                    handleHelpCommand();
                    sendChatMessage = false;
                    break;
                case "id":
                    displayLocalMessage("This Party's Room ID is " + Globals.ROOM_ID);
                    sendChatMessage = false;
                    break;
                case "setvideo":
                    sendChatMessage = false;
                    handleSetVideoCommand(args[0]);
                    break;
                case "cc":
                    message = toCrazyCase(message);
                case "i":
                    modifiers = "italic";
                    message = args.join(" ");
                    break;
                case "u":
                    modifiers = "underline";
                    message = args.join(" ");
                    break;
                case "b":
                    modifiers = "bold";
                    message = args.join(" ");
                    break;
                case "s":
                    modifiers = "strikethrough";
                    message = args.join(" ");
                    break;
                case "c":
                    modifiers = "cursive";
                    message = args.join(" ");
                    break;
                case "big":
                    modifiers = "big";
                    message = args.join(" ");
                    break;
                case "r":
                    sendChatMessage = false;
                    location.reload();
                    break;
                case "queue":
                    sendChatMessage = false;
                    handleQueueCommand(args);
                    break;
                case "skip":
                    sendChatMessage = false;
                    skipVideo();
                    break;
                case "clear":
                    sendChatMessage = false;
                    clearQueue();
                    break;

            }
        }
        if (sendChatMessage) {
            sendGatewayMessage({
                "type": "party-chatmessage",
                "data": {
                    "token": Globals.TOKEN,
                    "roomID": Globals.ROOM_ID,
                    "content": message,
                    "colour": Globals.USER_PROPERTIES.colour,
                    "author": Globals.USER_PROPERTIES.effectiveName,
                    "modifiers": modifiers
                }
            });
        }
        document.getElementById("chat-input").value = "";
    } else {
        let message = document.getElementById("chat-input").value.trim();
        if (message == "") sendTypingStop();
        else sendTypingStart();
    }
});

window.addEventListener("keydown", function(event) {
    if (event.code == "KeyM" && event.ctrlKey) {
        sendGatewayMessage({ "type": "party-getqueue", "data": { "token": Globals.TOKEN, "roomID": Globals.ROOM_ID, "display": "modal" } });
        showModalMenu();
    }
});

document.getElementById("current-video-input").addEventListener("keyup", function(event) {
    if (event.key == "Enter") {
        event.preventDefault();
        let videoURL = document.getElementById("current-video-input").value.trim();
        document.getElementById("current-video-input").value = "";
        if (videoURL == "") return;
        handleSetVideoCommand(videoURL);
    }
});

document.getElementById("queue-input").addEventListener("keyup", function(event) {
    if (event.key == "Enter") {
        event.preventDefault();
        let videoURL = document.getElementById("queue-input").value.trim();
        document.getElementById("queue-input").value = "";
        if (videoURL == "") return;
        let videoURLClass = new URL(videoURL);
        let videoID = videoURLClass.searchParams.get("v");
        if (videoID) {
            sendGatewayMessage({ "type": "party-queuevideo", "data": { "token": Globals.TOKEN, "roomID": Globals.ROOM_ID, "video": videoID } });
            sendGatewayMessage({ "type": "party-getqueue", "data": { "token": Globals.TOKEN, "roomID": Globals.ROOM_ID, "display": "modal" } });
        }
    }
});
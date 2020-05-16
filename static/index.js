document.addEventListener("DOMContentLoaded", () => {

    var socket = io.connect(location.protocol + "//" + document.domain + ":" + location.port);

    const channelTemplate = Handlebars.compile(document.querySelector("#channel-template").innerHTML);
    const messageTemplate = Handlebars.compile(document.querySelector("#message-template").innerHTML);
    const signIn = document.querySelector("#sign-in");
    const addButton = document.querySelector("#add-channel");
    const sendMsg = document.querySelector("#send-message");
    const channels = document.querySelector("#channels");
    var user = document.querySelector("#user");
    const storage = window.localStorage;

    sendMsg.disabled = true;

    // storage.clear();

    if(storage.getItem("userName") !== null) {
        user.innerHTML = "User: " + storage.getItem("userName");
    }
    else{
        addButton.disabled = true;
    }

    if(storage.getItem("chosenChannel") !== null) {
        document.querySelector("#chosenChannel").innerHTML = "Channel: " + storage.getItem("chosenChannel");
        getMessages(storage.getItem("chosenChannel"));
        if(storage.getItem("userName") !== null) {
            sendMsg.disabled = false;   
        }
    }

    for(var key in storage) {
        if(storage.getItem(key) === "channel") {
            channels.innerHTML += channelTemplate({"channel": key});
        }
    }

    signIn.onclick = () => {
        var userName = document.querySelector("#username").value;
        if(userName.length > 0) {
            storage.setItem("userName", userName);
            user.innerHTML = "User: " + userName; 
            addButton.disabled = false;   
        }
        else{
            user.innerHTML = "You need to sign in by a username";
        }
    }

    addButton.onclick = () => {
        var channel = document.querySelector("#channel").value;
        if(channel.length > 0) {
            const request = new XMLHttpRequest();
            request.open("POST","/add-channel");
            request.onload = () => {
                const data = JSON.parse(request.responseText);
                if(data !== "") {
                    channels.innerHTML += channelTemplate({"channel": channel + " (created by " + storage.getItem("userName") + ")"});
                    storage.setItem(channel + " (created by " + storage.getItem("userName") + ")", "channel")
                }
            }

            var sendData = new FormData();
            sendData.append("channel", channel);
            request.send(sendData);
        }
    }

    channels.onchange = () => {
        if(storage.getItem("userName") !== null) {
            sendMsg.disabled = false;
        }
        storage.setItem("chosenChannel", channels.value);
        document.querySelector("#chosenChannel").innerHTML = "Channel: " + storage.getItem("chosenChannel");
        getMessages(channels.value);
    }

    function getMessages(channel) {
        const request = new XMLHttpRequest();
        var messagesContainer = document.createElement("div");
        request.open("POST", "/view-messages");
        request.onload = () => {
            const messages = JSON.parse(request.responseText);
            console.log(messages);
            for (let message in messages) {
                let username = messages[message][0];
                let time = messages[message][1];
                let displayMessage = message + " (sent by "+username+" at "+time + ")";
                messagesContainer.innerHTML += messageTemplate({"message": displayMessage});
            }
            document.querySelector("#messages").innerHTML = messagesContainer.innerHTML;
        }
        var sendData = new FormData();
        sendData.append("channel", channel);
        request.send(sendData);
    }
    
    socket.on("connect", () => {
        sendMsg.onclick = () => {
            var message = document.querySelector("#message").value;
            if(message !== 0){
                document.querySelector("#message").value = "";
                var channel = storage.getItem("chosenChannel");
                var username = storage.getItem("userName")
                const request = new XMLHttpRequest();
                request.open("POST", "/add-message");
                var sendData = new FormData();
                sendData.append("message", message);
                sendData.append("channel", channel);
                sendData.append("username", username);
                request.send(sendData);
                console.log(message);
                socket.emit("send message", {"message" : message, "channel" : channel, "username" : username});
            }
        }
    })

    socket.on("view message", data => {
        let displayMessage = data.message + " (sent by "+data.username+" at "+data.time + ")";
        document.querySelector("#messages").innerHTML += messageTemplate({"message": displayMessage});
    })
})
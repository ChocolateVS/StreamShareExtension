/* Tab Start Stream Pressed
    Start Stream is sent to server, stream object is returned
*/

function id(id) { return document.getElementById(id); }

let stream = {
    streaming: false,
    stream_code: null,
    id: null
};

let url = "https://share.rowansserver.com/";

async function start() {
    stream.id = await new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            resolve(tabs[0].id);
        });
    });

    requestStreamDetails();
}

async function requestStreamDetails() {

    console.log("Getting Stream Details", stream.id);

    stream = await sendMessage("streamStatus", stream.id);

    console.log("Stream Details", stream)

    // If not streaming, show 
    if (!stream.streaming) {
        console.log("Not Streaming")
        streamStoppedUI();
    }
    else {
        console.log("Stream Already Started")
        streamStartedUI();
    }
}

id("streamBtn").addEventListener("click", async function () {
    if (!stream.streaming) {
        console.log("Starting Stream");
        console.log("Stream", stream)
        startStream();

    }
    else {
        console.log("Stopping Stream");
        stopStream();

    }
});

//If Share button is pressed, send message to background.js to start streaming
async function startStream() {
    stream = await sendMessage("startStreaming");
    streamStartedUI();
}

//If End Stream button is pressed, send message to background.js to stop streaming
async function stopStream() {
    stream = await sendMessage("stopStreaming");
    streamStoppedUI();
}

function streamStartedUI() {
    id("streamBtn").value = "End Stream";
    id("end_stream").style.display = "flex";
    id("stream_code").innerHTML = "Stream Code: " + stream.stream_code;
    id("stream_link").setAttribute("href", url + stream.stream_code)
    id("body").height = "";
}

function streamStoppedUI() {
    id("streamBtn").value = "Share";
    id("end_stream").style.display = "none";
    id("body").height = "100px";
}

async function sendMessage(action, id) {
    return await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: action, id: stream.id }, function (response) {
            resolve(response);
        });
    });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

    console.log("Message Received", request);

    if (request.action == "details") {
        console.log(request.data);
    }
});

start();

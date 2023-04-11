let url = "https://share.rowansserver.com/";

let active_tabs = [];

// On Message from a tab
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {

    // Start Streaming
    if (request.action == "startStreaming") {
        console.log("Starting Stream", request)

        if (!active_tabs[request.id]) {
            let stream_code = await getStreamCode();
            active_tabs[request.id] = {
                id: request.id,
                stream_code: JSON.parse(stream_code).code,
                streaming: true
            }
        }
        else {
            active_tabs[request.id].streaming = true;
        }

        active_tabs[request.id].streaming = true;
        stream(active_tabs[request.id]);
        sendResponse(active_tabs[request.id]);

    }

    // Stop Streaming
    else if (request.action == "stopStreaming") {
        console.log("Stopping Stream", request)
        active_tabs[request.id].streaming = false;
        sendResponse(active_tabs[request.id]);
    }

    else if (request.action == "streamStatus") {
        console.log("Getting Stream Status", request);

        if (active_tabs[request.id]) {
            console.log("Found Stream", active_tabs[request.id]);
            sendResponse(active_tabs[request.id]);
        }
        else {

            console.log("Stream Doesn't Exist");
            sendResponse({
                streaming: false,
                stream_code: null,
                id: request.id
            });
        }
    }
});

async function getStreamCode() {
    let data = await xhrRequest("GET", url + "stream/start")
    return data;
}

async function getVideoData(id) {
    return {
        currentTime: await getValue('document.querySelector("video").currentTime', id),
        playbackRate: await getValue('document.querySelector("video").playbackRate', id),
        videoPaused: await getValue('document.querySelector("video").paused', id),
        videoChannel: await getValue('document.querySelector(".style-scope .ytd-channel-name .complex-string").textContent', id),
        videoName: await getValue('document.querySelector("#title h1").textContent', id)
    }
}

async function getValue(code, id) {
    return await new Promise((resolve) => {
        chrome.tabs.executeScript(
            id,
            { code: code },
            function (result) {
                resolve(result[0])
            }
        );
    });
}

async function stream(_stream) {
    // If this tab is not streaming, stop the function
    if (!_stream.streaming) return;

    // Get video details
    let data = await getVideoData(_stream.id);
    let tab = await getTabById(_stream.id);

    data.url = tab.url;
    data.thumbnail_url = getVideoId(tab.url);

    sendMessage(_stream.id, "details", data);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url + 'api/' + _stream.stream_code + "/details", false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(data));

    if (xhr.status === 200) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        stream(_stream);
    } else console.error('POST request failed');
}

async function xhrRequest(method, url, data) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(data);

    if (xhr.status === 200) {
        return xhr.responseText;
    } else {
        console.error('POST request failed');
    }
}

async function sendMessage(id, action, data) {
    chrome.tabs.sendMessage(id, { action: action, data: data });
}

async function getTabById(id) {
    return await new Promise((resolve) => {
        chrome.tabs.get(id, function (tab) {
            resolve(tab);
        });
    });
}

function getVideoId(url) {
    let video_id = url.split('v=')[1];
    let ampersandPosition = video_id.indexOf('&');
    if (ampersandPosition != -1) {
        video_id = video_id.substring(0, ampersandPosition);
    }
    return "https://img.youtube.com/vi/" + video_id + "/sddefault.jpg";
}
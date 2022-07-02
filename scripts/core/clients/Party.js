/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import RTCPeer from '/scripts/core/clients/RTCPeer.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';

const CONSTRAINTS = { audio: true, video: false };

class Party {
    constructor() {
        //this._id = uuidv4();
        this._peers = {};
        this._userAudio = createAudioElement();
        this._userAudio.defaultMuted = true;
        this._userAudio.muted = true;
    }

    host(roomId, successCallback, errorCallback) {
        if(this._socket) this.disconnect();
        this._isHost = true;
        this._roomId = roomId;
        this._successCallback = successCallback;
        this._errorCallback = errorCallback;
        if(this._userAudio.srcObject) {
            this._setupWebSocket();
        } else {
            this._setupUserMedia();
        }
    }

    join(roomId, successCallback, errorCallback) {
        if(this._socket) this.disconnect();
        this._roomId = roomId;
        this._successCallback = successCallback;
        this._errorCallback = errorCallback;
        if(this._userAudio.srcObject) {
            this._setupWebSocket();
        } else {
            this._setupUserMedia();
        }
    }

    disconnect() {
        if(this._socket) this._socket.close();
        this._socket = null;
        this._isHost = false;
        for(let peerId in this._peers) {
            this._peers[peerId].close();
        }
        this._peers = {};
        if(this._onDisconnect) this._onDisconnect();
    }

    setOnSetupPeer(f) {
        this._onSetupPeer = f;
    }

    setOnDisconnect(f) {
        this._onDisconnect = f;
    }

    _setupUserMedia() {
        navigator.mediaDevices.getUserMedia(CONSTRAINTS).then((stream) => {
            this._userAudio.srcObject = stream;
            this._setupWebSocket();
        }).catch((error) => {
            this._userAudio.srcObject = new MediaStream();
            this._setupWebSocket();
        });
    }

    _setupWebSocket() {
        this._socket = new WebSocket(global.partyUrl);
        this._socket.onopen = (e) => { this._onSocketOpen(e); };
        this._socket.onclose = (e) => { this._onSocketClose(e); };
        this._socket.onmessage = (e) => { this._onSocketMessage(e); };
        this._socket.onerror = (e) => { this._onSocketError(e); };
    }

    _onSocketOpen(e) {
        this._socket.send(JSON.stringify({
            topic: "identify",
            //id: this._id,
            roomId: this._roomId,
            isHost: this._isHost,
        }));
    }

    _onSocketClose(e) {
        console.log("TODO: _onSocketClose()");
        console.log(e);
    }

    _onSocketMessage(e) {
        let message = JSON.parse(e.data);
        let topic = message.topic;
        if(topic == "initiate") {
            this._setupRTCPeer(message);
        } else if(topic == "candidate") {
            this._peers[message.from].handleCandidate(message);
        } else if(topic == "description") {
            this._peers[message.from].handleDescription(message);
        } else if(topic == "hosting") {
            if(this._successCallback) this._successCallback();
        } else {
            this.disconnect();
            if(this._errorCallback) this._errorCallback(message);
        }
    }

    _onSocketError(e) {
        console.log("TODO: _onSocketError()");
        console.log(e);
        this.disconnect();
        if(this._errorCallback) this._errorCallback(e);
    }

    _setupRTCPeer(message) {
        let peerId = message.peerId;
        let polite = message.polite;
        this._peers[peerId] = new RTCPeer(message.peerId, polite, this._socket);
        this._userAudio.srcObject.getTracks().forEach((track) => {
            this._peers[peerId].addAudioTrack(track, this._userAudio.srcObject);
        });
        if(this._onSetupPeer) this._onSetupPeer(this._peers[peerId]);
    }
}

function createAudioElement() {
    let audioElement = document.createElement('audio');
    audioElement.autoplay = true;
    document.body.appendChild(audioElement);
    return audioElement;
}

let party = new Party();
export default party;

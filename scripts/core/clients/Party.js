/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import RTCPeer from '/scripts/core/clients/RTCPeer.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';

const CONSTRAINTS = { audio: true, video: false };
const NINE_MINUTES = 60000 * 9;
const FIFTY_MINUTES = 60000 * 50;

class Party {
    constructor() {
        this._id = uuidv4();
        this._peers = {};
        this._userAudio = createAudioElement();
        this._userAudio.defaultMuted = true;
        this._userAudio.muted = true;
        this._pingIntervalId = null;
        this._authIntervalId = null;
    }

    host(roomId, successCallback, errorCallback) {
        this._fetchAuthToken(() => {
            this.connect(true, roomId, successCallback, errorCallback);
        }, errorCallback);
    }

    join(roomId, successCallback, errorCallback) {
        this._fetchAuthToken(() => {
            this.connect(false, roomId, successCallback, errorCallback);
        }, errorCallback);
    }

    connect(isHost, roomId, successCallback, errorCallback) {
        if(this._socket) this.disconnect();
        this._isHost = isHost;
        this._roomId = window.location.pathname + '_' + roomId;
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
        if(this._replacementSocket) this._replacementSocket.close();
        if(this._pingIntervalId) {
            clearInterval(this._pingIntervalId);
            this._pingIntervalId = null;
        }
        if(this._authIntervalId) {
            clearInterval(this._authIntervalId);
            this._authIntervalId = null;
        }
        this._socket = null;
        this._isHost = false;
        for(let peerId in this._peers) {
            this._peers[peerId].close();
        }
        this._peers = {};
        if(this._onDisconnect) this._onDisconnect();
    }

    bootPeer(peerId) {
        this._socket.send({
            topic: "boot-peer",
            peerId: peerId,
        });
    }

    designateHost(peerId) {
        this._socket.send({
            topic: "designate-host",
            peerId: peerId,
        });
    }

    setOnPeerIdUpdate(f) {
        this._onPeerIdUpdate = f;
    }

    setOnSetupPeer(f) {
        this._onSetupPeer = f;
    }

    setOnDisconnect(f) {
        this._onDisconnect = f;
    }

    _fetchAuthToken(successCallback, errorCallback) {
        fetch(global.authUrl, { cache: "no-store" })
            .then((response) => response.json())
            .then((body) => {
                if(!body.authToken) {
                    this.disconnect();
                    if(errorCallback) errorCallback({ topic: 'bad-auth' });
                    return;
                }
                this._authToken = body.authToken;
                if(successCallback) successCallback();
            })
            .catch(() => {
                this.disconnect();
                if(errorCallback) errorCallback({ topic: 'bad-auth' });
            });
    }

    _initiateUpdateSocket() {
        this._socket.send({
            topic: "update-connection",
            initiate: true,
        });
    }

    _updateSocket(code) {
        this._replacementSocket.send({
            topic: "update-connection",
            code: code,
        });
    }

    _updateSocketSuccess() {
        let oldSocket = this._socket;
        this._socket = this._replacementSocket;
        this._socket.send = (body) => {
            body['authToken'] = this._authToken;
            this._socket._send(JSON.stringify(body));
        };
        oldSocket.onclose = () => {};
        oldSocket.close();
        this._replacementSocket = null;
    }

    _replacePeerId(oldPeerId, newPeerId) {
        this._peers[oldPeerId].setPeerId(newPeerId);
        this._peers[newPeerId] = this._peers[oldPeerId];
        delete this._peers[oldPeerId];
        if(this._onPeerIdUpdate) this._onPeerIdUpdate(oldPeerId, newPeerId);
    }

    _setupUserMedia() {
        navigator.mediaDevices.getUserMedia(CONSTRAINTS).then((stream) => {
            this._userAudio.srcObject = stream;
            this._setupWebSocket();
        }).catch(() => {
            this._userAudio.srcObject = new MediaStream();
            this._setupWebSocket();
        });
    }

    _setupWebSocket() {
        this._socket = new WebSocket(global.socketUrl);
        this._socket.onopen = (_e) => { this._onSocketOpen(); };
        this._socket.onclose = (_e) => { this._onSocketClose(); };
        this._socket.onmessage = (e) => { this._onSocketMessage(e); };
        this._socket.onerror = (e) => { this._onSocketError(e); };
        this._socket._send = this._socket.send;
        this._socket.send = (body) => {
            body['authToken'] = this._authToken;
            this._socket._send(JSON.stringify(body));
        };
    }

    _setupReplacementSocket() {
        this._replacementSocket = new WebSocket(global.socketUrl);
        this._replacementSocket.onopen = () => { this._initiateUpdateSocket();};
        this._replacementSocket.onclose = this._socket.onclose;
        this._replacementSocket.onmessage = this._socket.onmessage;
        this._replacementSocket.onerror = this._socket.onerror;
        this._replacementSocket._send = this._replacementSocket.send;
        this._replacementSocket.send = (body) => {
            body['authToken'] = this._authToken;
            this._replacementSocket._send(JSON.stringify(body));
        };
    }

    _onSocketOpen() {
        this._socket.send({
            topic: "identify",
            //id: this._id,
            roomId: this._roomId,
            isHost: this._isHost,
        });
        this._pingIntervalId = setInterval(() => {
            this._socket.send({ topic: "ping" });
        }, NINE_MINUTES);
        this._authIntervalId = setInterval(() => {
            this._fetchAuthToken(() => { this._setupReplacementSocket(); },
                () => {
                    PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                        text: 'Could not authenticate with Server',
                    });
                });
        }, FIFTY_MINUTES);
    }

    _onSocketClose() {
        if(this._socket) this.disconnect();
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
        } else if(topic == "update-connection-ready") {
            this._updateSocket(message.code);
        } else if(topic == "update-connection-success") {
            this._updateSocketSuccess();
        } else if(topic == "replace-connection") {
            this._replacePeerId(message.oldPeerId, message.newPeerId);
        } else if(topic == "designate-host") {
            PubSub.publish(this._id, PubSubTopics.BECOME_PARTY_HOST);
        } else if(topic == "boot-peer") {
            PubSub.publish(this._id, PubSubTopics.BOOT_PEER, message.peerId);
        } else if(topic == "disconnect") {
            this.disconnect();
        } else if(topic == "error" && message.requestTopic == "boot-peer") {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: "Error: Couldn't kick out user",
            });
        } else if(topic == "error" && message.requestTopic == "designate-host"){
            PubSub.publish(this._id, PubSubTopics.BECOME_PARTY_HOST);
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: "Error: Couldn't make user host",
            });
        } else if(topic =="error" && message.requestTopic=="update-connection"){
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: 'Could not reinitiate connection with Server',
            });
            this.disconnect();
        } else {
            this.disconnect();
            if(this._errorCallback) this._errorCallback(message);
        }
    }

    _onSocketError(e) {
        this.disconnect();
        if(this._errorCallback) this._errorCallback(e);
    }

    _onRTCTimeout() {
        if(this._socket) this._onSocketError({ topic: "rtc-timeout" });
    }

    _setupRTCPeer(message) {
        let peerId = message.peerId;
        let polite = message.polite;
        this._peers[peerId] = new RTCPeer(message.peerId, polite, this._socket,
            this._userAudio.srcObject.clone(), () => this._onRTCTimeout());
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

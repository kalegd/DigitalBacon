/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Queue } from '/scripts/core/helpers/utils.module.js';

const ICE_SERVER_URLS = [
    'stun:stun1.l.google.com:19302',
    'stun:stun2.l.google.com:19302',
    'stun:stun3.l.google.com:19302',
    'stun:stun4.l.google.com:19302'
];
const CONFIGURATION = { iceServers: [{ urls: ICE_SERVER_URLS }] };
const SIXTY_FOUR_KB = 1024 * 64;
const TIMEOUT = 20000; //20 Seconds

export default class RTCPeer {
    constructor(peerId, polite, socket, onTimeout) {
        this._peerId = peerId;
        this._polite = polite;
        this._socket = socket;
        this._onTimeout = onTimeout;
        this._myAudioTrack;
        this._peerAudioTrack;
        this._connection = new RTCPeerConnection(CONFIGURATION);
        this._audio = createAudioElement();
        this._makingOffer = false;
        this._ignoreOffer = false;
        this._isSettingRemoteAnswerPending = false;
        this._hasConnected = false;
        this._dataChannel = null;
        if(!polite) this._timeoutId = setTimeout(() => this._timeout(),TIMEOUT);
        this._setupConnection();
        this._sendDataQueue = new Queue();
    }

    _setupConnection() {
        this._connection.ontrack = (e) => {
            this._peerAudioTrack = e.track;
            e.track.onunmute = () => {
                if(this._audio.srcObject) return;
                this._audio.srcObject = e.streams[0];
            };
        };
        this._connection.onicecandidate = (e) => {
            this._socket.send({
                topic: "candidate",
                to: this._peerId,
                candidate: e.candidate,
            });
        };
        this._connection.onnegotiationneeded = async () => {
            try {
                this._makingOffer = true;
                await this._connection.setLocalDescription();
                this._socket.send({
                    topic: "description",
                    to: this._peerId,
                    description: this._connection.localDescription,
                });
            } catch(error) {
                console.error(error);
            } finally {
                this._makingOffer = false;
            }
        }
        this._connection.ondatachannel = (e) => {
            if(this._polite) return;
            this._dataChannel = e.channel;
            this._dataChannel.bufferedAmountLowThreshold = SIXTY_FOUR_KB;
            this._dataChannel.onopen = (e) => {
                if(this._onSendDataChannelOpen) this._onSendDataChannelOpen(e);
            }
            this._dataChannel.onclose = (e) => {
                if(this._onSendDataChannelClose) this._onSendDataChannelClose(e);
            }
            this._dataChannel.onmessage = (message) => {
                if(this._onMessage) this._onMessage(message.data);
            }
        }
        this._connection.onconnectionstatechange = (e) => {
            let state = this._connection.connectionState;
            if(state == "connected" && !this._hasConnected) {
                this._hasConnected = true;
                if(this._polite) this._setupDataChannel();
                if(!this._polite) clearTimeout(this._timeoutId);
            } else if(state == "disconnected" || state == "failed") {
                if(!this._polite) clearTimeout(this._timeoutId);
                if(this._onDisconnect) this._onDisconnect();
            }
        }
    }

    _setupDataChannel() {
        this._dataChannel = this._connection.createDataChannel(
            this._peerId);
        this._dataChannel.bufferedAmountLowThreshold = SIXTY_FOUR_KB;
        this._dataChannel.onopen = (e) => {
            if(this._onSendDataChannelOpen) this._onSendDataChannelOpen(e);
        }
        this._dataChannel.onclose = (e) => {
            if(this._onSendDataChannelClose) this._onSendDataChannelClose(e);
        }
        this._dataChannel.onmessage = (message) => {
            if(this._onMessage) this._onMessage(message.data);
        }
    }

    _timeout() {
        if(this._onTimeout) this._onTimeout();
    }

    toggleMyselfMuted(muted) {
        this._myAudioTrack.enabled = !muted;
    }

    togglePeerMuted(muted) {
        this._peerAudioTrack.enabled = !muted;
    }

    addAudioTrack(track, srcObject) {
        this._myAudioTrack = track;
        this._connection.addTrack(track, srcObject);
    }

    close() {
        this._connection.close();
        this._audio.srcObject = null;
        if(this._audio.parentNode) document.body.removeChild(this._audio);
        if(this._onDisconnect) this._onDisconnect();
    }

    getPeerId() {
        return this._peerId;
    }

    handleCandidate(message) {
        try {
            this._connection.addIceCandidate(message.candidate);
        } catch(error) {
            if(!this._ignoreOffer) console.error(error);
        }
    }

    async handleDescription(message) {
        let description = message.description;
        try {
            let readyForOffer = !this._makingOffer
                && (this._connection.signalingState == "stable"
                    || this._isSettingRemoteAnswerPending);
            let offerCollision = description.type == "offer" && !readyForOffer;
            this._ignoreOffer = !this._polite && offerCollision;
            if(this._ignoreOffer) return;

            this._isSettingRemoteAnswerPending = description.type == "answer";
            await this._connection.setRemoteDescription(description);
            this._isSettingRemoteAnswerPending = false;
            if(description.type == "offer") {
                await this._connection.setLocalDescription();
                this._socket.send({
                    topic: "description",
                    to: this._peerId,
                    description: this._connection.localDescription,
                });
            }
        } catch(error) {
            console.error(error);
        }
    }

    isConnected() {
        return this._hasConnected;
    }

    sendData(data) {
        this._sendDataQueue.enqueue(data);
        if(this._dataChannel.onbufferedamountlow) return;
        if(this._sendDataQueue.length == 1) this._sendData();
    }

    _sendData() {
        let channel = this._dataChannel;
        while(channel.bufferedAmount <= channel.bufferedAmountLowThreshold) {
            channel.send(this._sendDataQueue.dequeue());
            if(this._sendDataQueue.length == 0) return;
        }
        channel.onbufferedamountlow = () => {
            channel.onbufferedamountlow = null;
            this._sendData();
        }
    }

    setOnDisconnect(f) {
        this._onDisconnect = f;
    }

    setOnMessage(f) {
        this._onMessage = f;
    }

    setOnSendDataChannelOpen(f) {
        this._onSendDataChannelOpen = f;
    }

    setOnSendDataChannelClose(f) {
        this._onSendDataChannelClose = f;
    }
}

function createAudioElement() {
    let audioElement = document.createElement('audio');
    audioElement.autoplay = true;
    document.body.appendChild(audioElement);
    return audioElement;
}

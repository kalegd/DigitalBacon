/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';

const CONSTRAINTS = { audio: true, video: false };
const ICE_SERVER_URLS = [
    'stun:stun1.l.google.com:19302',
    'stun:stun2.l.google.com:19302',
    'stun:stun3.l.google.com:19302',
    'stun:stun4.l.google.com:19302'
];
const CONFIGURATION = { iceServers: [{ urls: ICE_SERVER_URLS }] };

class Party {
    constructor() {
        //this._id = uuidv4();
        this._peerData = {};
        this._userAudio = this._createAudioElement();
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
        for(let peerId in this._peerData) {
            let data = this._peerData[peerId];
            data.connection.close();
            data.audio.srcObject = null;
            document.body.removeChild(data.audio);
        }
        this._peerData = {};
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
        console.log("TODO: _onSocketOpen()");
        console.log(e);
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
        console.log("TODO: _onSocketMessage()");
        console.log(e);
        let message = JSON.parse(e.data);
        let topic = message.topic;
        if(topic == "initiate") {
            this._setupRTC(message);
        } else if(topic == "candidate") {
            this._handleCandidate(message);
        } else if(topic == "description") {
            this._handleDescription(message);
        }
    }

    _onSocketError(e) {
        console.log("TODO: _onSocketError()");
        console.log(e);
    }

    _setupRTC(message) {
        let peerId = message.peerId;
        let peerConnection = new RTCPeerConnection(CONFIGURATION);
        let peerAudio = this._createAudioElement();
        peerConnection.ontrack = (e) => {
            e.track.onunmute = () => {
                if(peerAudio.srcObject) return;
                peerAudio.srcObject = e.streams[0];
            };
        };
        this._peerData[peerId] = {
            connection: peerConnection,
            audio: peerAudio,
            makingOffer: false,
            ignoreOffer: false,
            hasConnected: false,
            isSettingRemoteAnswerPending: false,
            polite: message.polite,
        };
        peerConnection.onicecandidate = (e) => {
            this._socket.send(JSON.stringify({
                topic: "candidate",
                to: peerId,
                //from: this._id,
                candidate: e.candidate,
            }));
        };
        peerConnection.onnegotiationneeded = async () => {
            try {
                this._peerData[peerId].makingOffer = true;
                await peerConnection.setLocalDescription();
                this._socket.send(JSON.stringify({
                    topic: "description",
                    to: peerId,
                    //from: this._id,
                    description: peerConnection.localDescription,
                }));
            } catch(error) {
                console.error(error);
            } finally {
                this._peerData[peerId].makingOffer = false;
            }
        }
        //peerConnection.onconnectionstatechange = (e) => {
        //    let state = peerConnection.connectionState;
        //    if(state == "connected" && !this._peerData[peerId].hasConnected) {
        //        this._peerData[peerId].hasConnected = true;
        //        //Do I need to do anything here?
        //    } else if(state == "disconnected" || state == "failed") {
        //        //TODO: handle disconnect
        //    }
        //}
        this._userAudio.srcObject.getTracks().forEach((track) => {
            peerConnection.addTrack(track, this._userAudio.srcObject);
        });
    }

    _handleCandidate(message) {
        let peerId = message.from;
        let peerConnection = this._peerData[peerId].connection;
        try {
            peerConnection.addIceCandidate(message.candidate);
        } catch(error) {
            if(!this._peerData[peerId].ignoreOffer) console.error(error);
        }
    }

    async _handleDescription(message) {
        let peerId = message.from;
        let peerData = this._peerData[peerId];
        let peerConnection = peerData.connection;
        let description = message.description;
        try {
            let readyForOffer = !peerData.makingOffer
                && (peerConnection.signalingState == "stable"
                    || peerData.isSettingRemoteAnswerPending);
            let offerCollision = description.type == "offer" && !readyForOffer;
            peerData.ignoreOffer = !peerData.polite && offerCollision;
            if(peerData.ignoreOffer) return;

            peerData.isSettingRemoteAnswerPending = description.type =="answer";
            await peerConnection.setRemoteDescription(description);
            peerData.isSettingRemoteAnswerPending = false;
            if(description.type == "offer") {
                await peerConnection.setLocalDescription();
                this._socket.send(JSON.stringify({
                    topic: "description",
                    to: peerId,
                    //from: this._id,
                    description: peerConnection.localDescription,
                }));
            }
        } catch(error) {
            console.error(error);
        }
    }

    _createAudioElement() {
        let audioElement = document.createElement('audio');
        audioElement.autoplay = true;
        document.body.appendChild(audioElement);
        return audioElement;
    }
}

let party = new Party();
export default party;

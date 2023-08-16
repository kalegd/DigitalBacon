/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PeerController from '/scripts/core/assets/PeerController.js';
import Party from '/scripts/core/clients/Party.js';
import Handedness from '/scripts/core/enums/Handedness.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import PartyMessageHelper from '/scripts/core/helpers/PartyMessageHelper.js';
import { concatenateArrayBuffers, Queue } from '/scripts/core/helpers/utils.module.js';

const SIXTEEN_KB = 1024 * 16;
const TWO_BYTE_MOD = 2 ** 16;
const JITTER_DELAY = 50;

class PartyHandler {
    constructor() {
        this._peers = {};
        this._partyActive = false;
        this._displayingUsernames = false;
        this._username = generateRandomUsername();
        this._messageHandlers = {
            project: (p, m) => { this._handleProject(p, m); },
        };
        PartyMessageHelper.init(this);
        Party.setOnPeerIdUpdate((o, n) => { this._updatePeerId(o, n); });
        Party.setOnSetupPeer((rtc) => { this._registerPeer(rtc); });
        Party.setOnDisconnect(() => { this._onDisconnect(); });
    }

    _onDisconnect() {
        this._partyActive = false;
        PartyMessageHelper.removeSubscriptions();
        for(let peerId in this._peers) {
            let peer = this._peers[peerId];
            if(peer.rtc) peer.rtc.close();
            if(peer.controller) {
                ProjectHandler.deleteAsset(peer.controller, true, true);
                for(let device of peer.controller.getXRDevices()) {
                    ProjectHandler.deleteAsset(device, true, true);
                }
            }
        }
        this._peers = {};
        PartyMessageHelper.handlePartyEnded();
    }

    _registerPeer(rtc) {
        let peer = { id: rtc.getPeerId(), jitterBuffer: new Queue() };
        this._peers[peer.id] = peer;
        rtc.setOnSendDataChannelOpen(() => {
            if(this._successCallback) this._successCallback();
            peer.rtc = rtc;
            this._sendUserInfo(rtc);
            PartyMessageHelper.handlePeerConnected(peer);
            if(this._isHost) {
                let zip = (global.isEditor)
                    ? ProjectHandler.exportProject(true)
                    : ProjectHandler.exportDiff();
                this._sendProjectZip(zip, [rtc]);
            }
        });
        rtc.setOnSendDataChannelClose(() => {
            delete peer['rtc'];
        });
        rtc.setOnDisconnect(() => {
            if(peer.controller) {
                ProjectHandler.deleteAsset(peer.controller, true, true);
                for(let device of peer.controller.getXRDevices()) {
                    ProjectHandler.deleteAsset(device, true, true);
                }
            }
            if(peer.id in this._peers) {
                delete this._peers[peer.id];
                PartyMessageHelper.handlePeerDisconnected(peer);
            }
        });
        rtc.setOnFailedImpoliteConnect(() => {
            if(this._errorCallback)
                this._errorCallback({ topic: 'could-not-connect' });
            Party.disconnect();
        });
        rtc.setOnMessage((message) => {
            if(typeof message == "string") {
                this._handleJSON(peer, JSON.parse(message));
            } else {
                this._handleArrayBuffer(peer, message);
            }
        });
    }

    _sendUserInfo(rtc) {
        rtc.sendData(JSON.stringify({
            "topic": "user_controller",
            "url": global.userController.getAvatarUrl(),
            "controllerParams": global.userController.exportParams(),
            "isXR": global.deviceType == "XR",
        }));
        for(let hand in Handedness) {
            let xrController = global.userController.getController(hand);
            if(xrController) {
                rtc.sendData(JSON.stringify({
                    "topic": "instance_added",
                    "asset": xrController.exportParams(),
                    "assetType": xrController.constructor.assetType,
                }));
            }
        }
        rtc.sendData(JSON.stringify({
            topic: 'user_scale',
            scale: SettingsHandler.getUserScale(),
        }));
    }

    _updatePeerId(oldPeerId, newPeerId) {
        this._peers[oldPeerId].id = newPeerId;
        this._peers[newPeerId] = this._peers[oldPeerId];
        delete this._peers[oldPeerId];
    }

    _handleJSON(peer, message) {
        if(message.topic in this._messageHandlers)
            this._messageHandlers[message.topic](peer, message);
    }

    _handleArrayBuffer(peer, message) {
        if(peer.handleEventArrayBuffer) {
            peer.handleEventArrayBuffer(peer, message);
            return;
        }
        peer.jitterBuffer.enqueue(message);
    }

    _getNextJitterBufferMessage(jitterBuffer, timestamp) {
        let message = jitterBuffer.peek();
        if(!message) return null;
        let messageTimestamp = this._getMessageTimestamp(message);
        let timestampDiff = timestamp - messageTimestamp;
        timestampDiff = ((timestampDiff % TWO_BYTE_MOD) + TWO_BYTE_MOD)
            % TWO_BYTE_MOD;
        if(timestampDiff <= JITTER_DELAY) return null;
        let nextMessage;
        do {
            message = jitterBuffer.dequeue();
            nextMessage = jitterBuffer.peek();
            if(!nextMessage) return message;
            messageTimestamp = this._getMessageTimestamp(nextMessage);
            timestampDiff = timestamp - messageTimestamp;
            timestampDiff = ((timestampDiff % TWO_BYTE_MOD) + TWO_BYTE_MOD)
                % TWO_BYTE_MOD;
        } while(timestampDiff > JITTER_DELAY)
        return message;
    }

    _getMessageTimestamp(message) {
        let uint16array = new Uint16Array(message, 0, 1);
        return uint16array[0];
    }

    _sendProjectZip(zip, rtcs) {
        zip.generateAsync({ type: 'arraybuffer' }).then((buffer) => {
            let parts = [];
            let n = Math.ceil(buffer.byteLength / SIXTEEN_KB);
            for(let i = 0; i < n; i++) {
                let chunkStart = i * SIXTEEN_KB;
                let chunkEnd = (i + 1) * SIXTEEN_KB;
                parts.push(buffer.slice(chunkStart, chunkEnd));
            }
            this._sendProjectParts(rtcs, parts);
        });
    }

    _sendProjectParts(rtcs, parts) {
        rtcs.forEach((rtc) => rtc.sendData(JSON.stringify({
            "topic": "project",
            "parts": parts.length,
        })));
        for(let part of parts) {
            rtcs.forEach((rtc) => rtc.sendData(part));
        }
    }

    _handleProject(peer, message) {
        let partsLength = message.parts;
        let parts = [];
        peer.handleEventArrayBuffer = (peer, message) => {
            parts.push(message);
            if(parts.length == partsLength) {
                peer.handleEventArrayBuffer = null;
                let buffer = concatenateArrayBuffers(parts);
                let zip = new JSZip();
                zip.loadAsync(buffer).then((zip) => {
                    if(global.isEditor) {
                        ProjectHandler.loadZip(zip, () => {
                            this.sendToAllPeers(JSON.stringify({
                                topic: 'loaded_diff',
                            }));
                        }, () => {
                            Party.disconnect();
                            PartyMessageHelper.notifyDiffError();
                        });
                    } else {
                        ProjectHandler.loadDiffZip(zip, () => {
                            this.sendToAllPeers(JSON.stringify({
                                topic: 'loaded_diff',
                            }));
                        }, () => {
                            Party.disconnect();
                            PartyMessageHelper.notifyDiffError();
                        });
                    }
                });
            }
        }
    }

    addMessageHandler(topic, messageHandler) {
        this._messageHandlers[topic] = messageHandler;
    }

    addMessageHandlers(messageHandlers) {
        for(let key in messageHandlers) {
            this._messageHandlers[key] = messageHandlers[key];
        }
    }

    bootPeer(peerId) {
        let peer = this._peers[peerId];
        if(peer && peer.rtc) {
            peer.rtc.close();
        } else {
            console.warn("Warn: couldn't boot peer because peer's rtc connection does not exist. Likely a race condition where the peer disconnecting from their end already closed the connection");
        }
    }

    getDisplayingUsernames() {
        return this._displayingUsernames;
    }

    getPeer(peerId) {
        return this._peers[peerId];
    }

    getPeers() {
        return this._peers;
    }

    sendProject() {
        let rtcs = [];
        for(let peerId in this._peers) {
            if(this._peers[peerId].rtc) rtcs.push(this._peers[peerId].rtc);
        }
        let zip = ProjectHandler.exportProject(true);
        this._sendProjectZip(zip, rtcs);
    }

    setDisplayingUsernames(displayingUsernames) {
        if(this._displayingUsernames == displayingUsernames) return;
        this._displayingUsernames = !this._displayingUsernames;
        for(let peerId in this._peers) {
            let controller = this._peers[peerId].controller;
            if(controller)
                controller.setDisplayingUsername(this._displayingUsernames);
        }
    }

    setIsHost(isHost) {
        this._isHost = isHost;
    }

    setUsername(username) {
        this._username = username;
        this.sendToAllPeers(JSON.stringify({
            topic: 'username',
            username: username,
        }));
    }

    isHost() {
        return this._isHost;
    }

    isPartyActive() {
        return this._partyActive;
    }

    host(roomId, successCallback, errorCallback) {
        this._isHost = true;
        this._successCallback = successCallback;
        this._errorCallback = errorCallback;
        Party.host(roomId, successCallback, errorCallback);
        PartyMessageHelper.addSubscriptions();
        this._partyActive = true;
        PartyMessageHelper.handlePartyStarted();
    }

    join(roomId, successCallback, errorCallback) {
        this._isHost = false;
        this._successCallback = successCallback;
        this._errorCallback = errorCallback;
        Party.join(roomId, successCallback, errorCallback);
        PartyMessageHelper.addSubscriptions();
        this._partyActive = true;
        PartyMessageHelper.handlePartyStarted();
    }

    sendToAllPeers(data) {
        for(let peerId in this._peers) {
            let rtc = this._peers[peerId].rtc;
            if(rtc) rtc.sendData(data);
        }
    }

    setEventBufferHandler(peer, handler) {
        peer.handleEventArrayBuffer = handler;
    }

    update(timeDelta) {
        if(!this._partyActive) return;
        let timestamp = new Date().getTime() % TWO_BYTE_MOD;
        let buffer = new Uint16Array([timestamp]).buffer;
        buffer = concatenateArrayBuffers(
            [buffer, ...global.userController.getDataForRTC()]);
        for(let peerId in this._peers) {
            let peer = this._peers[peerId];
            if(peer.controller) {
                let message = this._getNextJitterBufferMessage(
                    peer.jitterBuffer, timestamp);
                if(message) peer.controller.processMessage(message);
                peer.controller.update(timeDelta);
            }
            if(peer.rtc) peer.rtc.sendData(buffer);
        }
        PartyMessageHelper.update();
    }
}

function generateRandomUsername() {
    return String.fromCharCode(97+Math.floor(Math.random() * 26))
            + Math.floor(Math.random() * 100);
}

let partyHandler = new PartyHandler();
export default partyHandler;

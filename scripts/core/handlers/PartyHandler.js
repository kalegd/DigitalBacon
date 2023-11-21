/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Party from '/scripts/core/clients/Party.js';
import Handedness from '/scripts/core/enums/Handedness.js';
import InternalMessageIds from '/scripts/core/enums/InternalMessageIds.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import PartyMessageHelper from '/scripts/core/helpers/PartyMessageHelper.js';
import { concatenateArrayBuffers, concatenateArrayBuffersFromList, uuidv4, uuidFromBytes, Queue } from '/scripts/core/helpers/utils.module.js';

const SIXTEEN_KB = 1024 * 16;
const TWO_BYTE_MOD = 2 ** 16;
const JITTER_DELAY = 50;
const USER_HEADER = new Uint8Array([0]);

class PartyHandler {
    constructor() {
        this._peers = {};
        this._partyActive = false;
        this._displayingUsernames = false;
        this._username = generateRandomUsername();
        this._handleLocks = new Set();
        this._handleQueue = new Queue();
        this._publishQueue = new Queue();
        this._messageHandlers = {};
        this._bufferMessageHandlers = {};
        this.addInternalMessageHandler('project',
            (p, m) => this._handleProject(p, m), true);
        this.addInternalBufferMessageHandler(InternalMessageIds.PROJECT_PART,
            (p, m) => this._handleProjectPart(p, m), true);
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
                let avatar = peer.controller.getAvatar();
                if(avatar) ProjectHandler.deleteAsset(avatar, true, true);
                for(let device of peer.controller.getXRDevices()) {
                    ProjectHandler.deleteAsset(device, true, true);
                }
            }
        }
        this._peers = {};
        PartyMessageHelper.handlePartyEnded();
    }

    _registerPeer(rtc) {
        let peer = {
            id: rtc.getPeerId(),
            jitterBuffer: new Queue(),
            messageBacklog: [],
            readyForUpdates: false,
        };
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
                this._sendProjectZip(zip, peer);
            }
        });
        rtc.setOnSendDataChannelClose(() => {
            delete peer['rtc'];
        });
        rtc.setOnDisconnect(() => {
            if(peer.controller) {
                ProjectHandler.deleteAsset(peer.controller, true, true);
                let avatar = peer.controller.getAvatar();
                if(avatar) ProjectHandler.deleteAsset(avatar, true, true);
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
            id: 'Iuser_controller',
            body: {
                "controllerParams": global.userController.exportParams(),
                "isXR": global.deviceType == "XR",
            }
        }));
        let avatar = global.userController.getAvatar();
        rtc.sendData(JSON.stringify({
            id: 'Iinstance_added',
            body: {
                "asset": avatar.exportParams(),
                "assetType": avatar.constructor.assetType,
            }
        }));
        for(let hand in Handedness) {
            let xrController = global.userController.getController(hand);
            let xrHand = global.userController.getHand(hand);
            for(let controller of [xrController, xrHand]) {
                if(controller && controller.isInScene()) {
                    rtc.sendData(JSON.stringify({
                        id: 'Iinstance_added',
                        body: {
                            "asset": controller.exportParams(),
                            "assetType": controller.constructor.assetType,
                        }
                    }));
                }
            }
        }
    }

    _updatePeerId(oldPeerId, newPeerId) {
        this._peers[oldPeerId].id = newPeerId;
        this._peers[newPeerId] = this._peers[oldPeerId];
        delete this._peers[oldPeerId];
    }

    _handleJSON(peer, message) {
        if(message.id in this._messageHandlers)
            this._messageHandlers[message.id](peer, message.body);
    }

    _handleArrayBuffer(peer, message) {
        if(peer.handleEventArrayBuffer) {
            peer.handleEventArrayBuffer(peer, message);
            return;
        }
        let id, prefix;
        let type = new Uint8Array(message, 0, 1)[0];
        if(type == 0) {
            peer.jitterBuffer.enqueue(message.slice(1));
            return;
        } else if(type % 2 == 0) {
            id = new Uint8Array(message, 1, 1)[0];
            message = message.slice(2);
        } else {
            id = uuidFromBytes(new Uint8Array(message, 1, 16));
            message = message.slice(17);
        }
        id = (type < 3 ? 'I' : 'U') + id;
        if(id in this._bufferMessageHandlers)
            this._bufferMessageHandlers[id](peer, message);
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

    _sendProjectZip(zip, ...peerList) {
        zip.generateAsync({ type: 'arraybuffer' }).then((buffer) => {
            let parts = [];
            let n = Math.ceil(buffer.byteLength / SIXTEEN_KB);
            for(let i = 0; i < n; i++) {
                let chunkStart = i * SIXTEEN_KB;
                let chunkEnd = (i + 1) * SIXTEEN_KB;
                parts.push(buffer.slice(chunkStart, chunkEnd));
            }
            this._sendProjectParts(parts, ...peerList);
        });
    }

    _sendProjectParts(parts, ...peerList) {
        for(let peer of peerList) {
            if(peer.rtc) peer.rtc.sendData(JSON.stringify({
                    id: 'Iproject',
                    body: { "partsLength": parts.length },
                }));
        }
        for(let part of parts) {
            let message = concatenateArrayBuffers(
                new Uint8Array([2, InternalMessageIds.PROJECT_PART]), part);
            for(let peer of peerList) {
                if(peer.rtc) peer.rtc.sendData(message);
            }
        }
    }

    _handleProject(peer, message) {
        let lock = uuidv4();
        message.lock = this.addMessageHandlerLock();
        message.parts = [];
        peer.incomingProjectDetails = message;
    }

    _handleProjectPart(peer, message) {
        if(!peer.incomingProjectDetails) {
            console.error('Unexpected call to _handleProjectPart() before _handleProject()');
            return;
        }
        let {parts, partsLength, lock} = peer.incomingProjectDetails;
        parts.push(message);
        if(parts.length == partsLength) {
            let buffer = concatenateArrayBuffersFromList(parts);
            let zip = new JSZip();
            zip.loadAsync(buffer).then((zip) => {
                if(global.isEditor) {
                    ProjectHandler.loadZip(zip, () => {
                        this.publishInternalMessage('loaded_diff');
                        for(let peerId in this._peers) {
                            this._peers[peerId].readyForUpdates = true;
                        }
                        this.removeMessageHandlerLock(lock);
                    }, () => {
                        this.removeMessageHandlerLock(lock);
                        Party.disconnect();
                        PartyMessageHelper.notifyDiffError();
                    });
                } else {
                    ProjectHandler.loadDiffZip(zip, () => {
                        this.publishInternalMessage('loaded_diff');
                        for(let peerId in this._peers) {
                            this._peers[peerId].readyForUpdates = true;
                        }
                        this.removeMessageHandlerLock(lock);
                    }, () => {
                        this.removeMessageHandlerLock(lock);
                        Party.disconnect();
                        PartyMessageHelper.notifyDiffError();
                    });
                }
            });
        }
    }

    addMessageHandlerLock() {
        let lock = uuidv4();
        this._handleLocks.add(lock);
        return lock;
    }

    removeMessageHandlerLock(lock) {
        this._handleLocks.delete(lock);
        while(this._handleQueue.length > 0 && this._handleLocks.size == 0) {
            this._handleQueue.dequeue()();
        }
    }

    _handleBlockable(handler, peer, message) {
        if(this._handleLocks.size > 0) {
            this._handleQueue.enqueue(() => handler(peer, message));
            return;
        }
        handler(peer, message);
    }

    addMessageHandler(id, handler, skipQueue) {
        this._messageHandlers['U' + id] = (skipQueue)
            ? handler
            : (p, m) => this._handleBlockable(handler,p,m);
    }

    addInternalMessageHandler(id, handler, skipQueue) {
        this._messageHandlers['I' + id] = (skipQueue)
            ? handler
            : (p, m) => this._handleBlockable(handler,p,m);
    }

    addMessageHandlers(messageHandlers) {
        for(let key in messageHandlers) {
            this._messageHandlers[key] = messageHandlers[key];
        }
    }

    addBufferMessageHandler(id, handler, skipQueue) {
        this._bufferMessageHandlers['U' + id] = (skipQueue)
            ? handler
            : (p, m) => this._handleBlockable(handler,p,m);
    }

    addInternalBufferMessageHandler(id, handler, skipQueue) {
        this._bufferMessageHandlers['I' + id] = (skipQueue)
            ? handler
            : (p, m) => this._handleBlockable(handler,p,m);
    }

    publishFromFunction(publishFunction, skipQueue) {
        if(skipQueue) {
            publishFunction();
        } else {
            this._publishQueue.enqueue(publishFunction);
        }
    }

    _publishMessage(message, skipQueue, ...peerList) {
        if(skipQueue) {
            this._sendToPeers(message, ...peerList);
        } else {
            this._publishQueue.enqueue({ message: message, peerList: peerList});
        }
    }

    publishMessage(id, message, skipQueue, ...peerList) {
        this._publishMessage(JSON.stringify({
            id: 'U' + id,
            body: message,
        }), skipQueue, ...peerList);
    }

    publishInternalMessage(id, message, skipQueue, ...peerList) {
        this._publishMessage(JSON.stringify({
            id: 'I' + id,
            body: message,
        }), skipQueue, ...peerList);
    }

    _publishBufferMessage(id, message, skipQueue, headerOffset, ...peerList) {
        let header = new Uint8Array(1);
        if(id instanceof Uint8Array) {
            header[0] = headerOffset;
        } else if(typeof id == 'number') {
            header[0] = headerOffset + 1;
            id = new Uint8Array([id]);
        } else {
            header[0] = headerOffset;
            id = uuidToBytes(id);
        }
        message = concatenateArrayBuffers(header, id, message);
        this._publishMessage(message, skipQueue, ...peerList);
    }

    publishBufferMessage(id, message, skipQueue, ...peerList) {
        this._publishBufferMessage(id, message, skipQueue, 3, ...peerList);
    }

    publishInternalBufferMessage(id, message, skipQueue, ...peerList) {
        this._publishBufferMessage(id, message, skipQueue, 1, ...peerList);
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
        let peerList = [];
        for(let peerId in this._peers) {
            peerList.push(this._peers[peerId]);
        }
        let zip = ProjectHandler.exportProject(true);
        this._sendProjectZip(zip, ...peerList);
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

    _sendToPeers(data, ...peerList) {
        if(peerList.length == 0) peerList = this._peers;
        for(let peerId in this._peers) {
            if(this._peers[peerId].readyForUpdates) {
                let rtc = this._peers[peerId].rtc;
                if(rtc) rtc.sendData(data);
            } else {
                this._peers[peerId].messageBacklog.push(data);
            }
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
            USER_HEADER, buffer, ...global.userController.getDataForRTC());
        for(let peerId in this._peers) {
            let peer = this._peers[peerId];
            if(peer.controller) {
                let message = this._getNextJitterBufferMessage(
                    peer.jitterBuffer, timestamp);
                if(message) peer.controller.processMessage(message);
                peer.controller.update(timeDelta);
            }
            if(peer.rtc && peer.readyForUpdates) {
                if(peer.messageBacklog.length > 0) {
                    for(let message of peer.messageBacklog) {
                        peer.rtc.sendData(message);
                    }
                    peer.messageBacklog = [];
                }
                peer.rtc.sendData(buffer);
            }
        }
        while(this._publishQueue.length > 0 && !this._isPublishing) {
            let details = this._publishQueue.dequeue();
            if(typeof details == 'function') {
                this._isPublishing = true;
                let promise = details();
                if(promise instanceof Promise) {
                    promise.then(() => this._isPublishing = false);
                } else {
                    console.error('PartyHandler.publishFromFunction(<function>, true) expects a function that returns a Promise object. No Promise object found');
                    this._isPublishing = false;
                }
            } else {
                this._sendToPeers(details.message, ...details.peerList);
            }
        }
    }
}

function generateRandomUsername() {
    return String.fromCharCode(97+Math.floor(Math.random() * 26))
            + Math.floor(Math.random() * 100);
}

let partyHandler = new PartyHandler();
export default partyHandler;

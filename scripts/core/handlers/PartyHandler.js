/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PeerController from '/scripts/core/assets/PeerController.js';
import UserController from '/scripts/core/assets/UserController.js';
import Party from '/scripts/core/clients/Party.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import MaterialsHandler from '/scripts/core/handlers/MaterialsHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import TexturesHandler from '/scripts/core/handlers/TexturesHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { uuidv4, capitalizeFirstLetter, concatenateArrayBuffers, Queue } from '/scripts/core/helpers/utils.module.js';

const SIXTEEN_KB = 1024 * 16;
const TWO_BYTE_MOD = 2 ** 16;
const JITTER_DELAY = 50;

class PartyHandler {
    constructor() {
        this._id = uuidv4();
        this._peers = {};
        this._partyActive = false;
        this._messageHandlers = {
            avatar: (p, m) => { this._handleAvatar(p, m); },
            project: (p, m) => { this._handleProject(p, m); },
            instance_updated: (p, m) => { this._handleInstanceUpdated(p, m); },
            material_updated: (p, m) => { this._handleMaterialUpdated(p, m); },
            texture_updated: (p, m) => { this._handleTextureUpdated(p, m); },
        };
        Party.setOnSetupPeer((rtc) => { this._registerPeer(rtc); });
        Party.setOnDisconnect(() => { this._onDisconnect(); });
    }

    _onDisconnect() {
        this._partyActive = false;
        this._removeSubscriptions();
        for(let peerId in this._peers) {
            let peer = this._peers[peerId];
            if(peer.rtc) peer.rtc.close();
            if(peer.controller) peer.controller.removeFromScene();
        }
        this._peers = {};
    }

    _registerPeer(rtc) {
        let peer = { id: rtc.getPeerId(), jitterBuffer: new Queue() };
        this._peers[peer.id] = peer;
        rtc.setOnSendDataChannelOpen(() => {
            peer.rtc = rtc;
            rtc.sendData(JSON.stringify({
                "topic": "avatar",
                "url": UserController.getAvatarUrl(),
            }));
            if(this._isHost && global.isEditor) {
                this._sendProject(rtc);
            }
        });
        rtc.setOnSendDataChannelClose(() => {
            delete peer['rtc'];
        });
        rtc.setOnDisconnect(() => {
            if(peer.controller) peer.controller.removeFromScene();
            delete this._peers[peer.id];
        });
        rtc.setOnMessage((message) => {
            if(typeof message == "string") {
                this._handleJSON(peer, JSON.parse(message));
            } else {
                this._handleArrayBuffer(peer, message);
            }
        });
    }

    _handleJSON(peer, message) {
        if(message.topic in this._messageHandlers)
            this._messageHandlers[message.topic](peer, message);
    }

    _handleArrayBuffer(peer, message) {
        if(this._handleEventArrayBuffer) {
            this._handleEventArrayBuffer(peer, message);
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

    _sendProject(rtc, parts) {
        if(!parts) {
            let zip = ProjectHandler.exportProject();
            zip.generateAsync({ type: 'arraybuffer' }).then((buffer) => {
                let parts = [];
                let n = Math.ceil(buffer.byteLength / SIXTEEN_KB);
                for(let i = 0; i < n; i++) {
                    let chunkStart = i * SIXTEEN_KB;
                    let chunkEnd = (i + 1) * SIXTEEN_KB;
                    parts.push(buffer.slice(chunkStart, chunkEnd));
                }
                this._sendProject(rtc, parts);
            });
            return;
        }
        rtc.sendData(JSON.stringify({
            "topic": "project",
            "parts": parts.length,
        }));
        for(let part of parts) {
            rtc.sendData(part);
        }
    }

    _handleProject(peer, message) {
        let partsLength = message.parts;
        let parts = [];
        this._handleEventArrayBuffer = (peer, message) => {
            parts.push(message);
            if(parts.length == partsLength) {
                this._handleEventArrayBuffer = null;
                let buffer = concatenateArrayBuffers(parts);
                let zip = new JSZip();
                zip.loadAsync(buffer).then((zip) => {
                    ProjectHandler.loadZip(zip);
                });
            }
        }
    }

    _handleAvatar(peer, message) {
        if(peer.controller) {
            peer.controller.updateAvatar(message.url);
        } else {
            peer.controller = new PeerController({ URL: message.url });
            peer.controller.addToScene(global.scene);
        }
    }

    _handleAssetUpdate(asset, params, topic) {
        for(let param in params) {
            if(param == 'id' || param == 'assetId') continue;
            let capitalizedParam = capitalizeFirstLetter(param);
            if(('set' + capitalizedParam) in asset)
                asset['set' + capitalizedParam](params[param]);
        }
    }

    _handleInstanceUpdated(peer, message) {
        let params = message.instance;
        let instance = ProjectHandler.project[params.assetId][params.id];
        if(instance) {
            this._handleAssetUpdate(instance, params);
            PubSub.publish(this._id, PubSubTopics.INSTANCE_UPDATED, instance);
        }
    }

    _handleMaterialUpdated(peer, message) {
        let params = message.material;
        let material = MaterialsHandler.getMaterial(params.id);
        if(material) {
            this._handleAssetUpdate(material, params);
            PubSub.publish(this._id, PubSubTopics.MATERIAL_UPDATED, material);
        }
    }

    _handleTextureUpdated(peer, message) {
        let params = message.texture;
        let texture = TexturesHandler.getTexture(params.id);
        if(texture) {
            this._handleAssetUpdate(texture, params);
            PubSub.publish(this._id, PubSubTopics.TEXTURE_UPDATED, texture);
        }
    }

    _publishAssetUpdate(updateMessage, type) {
        let asset = {};
        asset['id'] = updateMessage.asset.getId();
        if(updateMessage.asset.getAssetId)
            asset['assetId'] = updateMessage.asset.getAssetId();
        for(let param of updateMessage.fields) {
            let capitalizedParam = capitalizeFirstLetter(param);
            asset[param] = updateMessage.asset['get' + capitalizedParam]();
        }
        let peerMessage = { "topic": type + "_updated" };
        peerMessage[type] = asset;
        this._sendToAllPeers(JSON.stringify(peerMessage));
    }

    _addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.INSTANCE_UPDATED, (message) => {
            this._publishAssetUpdate(message, "instance")
        });
        PubSub.subscribe(this._id, PubSubTopics.MATERIAL_UPDATED, (message) => {
            this._publishAssetUpdate(message, "material")
        });
        PubSub.subscribe(this._id, PubSubTopics.TEXTURE_UPDATED, (message) => {
            this._publishAssetUpdate(message, "texture")
        });
    }

    _removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.INSTANCE_UPDATED);
        PubSub.unsubscribe(this._id, PubSubTopics.MATERIAL_UPDATED);
        PubSub.unsubscribe(this._id, PubSubTopics.TEXTURE_UPDATED);
    }

    _sendToAllPeers(data) {
        for(let peerId in this._peers) {
            let rtc = this._peers[peerId].rtc;
            if(rtc) rtc.sendData(data);
        }
    }

    host(roomId, successCallback, errorCallback) {
        this._isHost = true;
        this._partyActive = true;
        this._addSubscriptions();
        Party.host(roomId, () => { this._successCallback(); },
            () => { this._errorCallback(); });
    }

    join(roomId, successCallback, errorCallback) {
        this._isHost = false;
        this._partyActive = true;
        this._addSubscriptions();
        Party.join(roomId, () => { this._successCallback(); },
            () => { this._errorCallback(); });
    }

    update(timeDelta) {
        if(!this._partyActive) return;
        let timestamp = new Date().getTime() % TWO_BYTE_MOD;
        let buffer = new Uint16Array([timestamp]).buffer;
        buffer = concatenateArrayBuffers(
            [buffer, ...UserController.getDataForRTC()]);
        for(let peerId in this._peers) {
            let peer = this._peers[peerId];
            if(peer.controller) {
                let message = this._getNextJitterBufferMessage(
                    peer.jitterBuffer, timestamp);
                peer.controller.update(timeDelta, message);
            }
            if(peer.rtc) peer.rtc.sendData(buffer);
        }
    }
}

let partyHandler = new PartyHandler();
export default partyHandler;

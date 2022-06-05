/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Avatar from '/scripts/core/assets/Avatar.js';
import UserController from '/scripts/core/assets/UserController.js';
import Party from '/scripts/core/clients/Party.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { concatenateArrayBuffers } from '/scripts/core/helpers/utils.module.js';

const SIXTEEN_KB = 1024 * 16;

class PartyHandler {
    constructor() {
        this._peers = {};
        this._avatars = {};
        this._partyActive = false;
        Party.setOnSetupPeer((peer) => { this._registerPeer(peer); });
        Party.setOnDisconnect(() => { this._onDisconnect(); });
    }

    _onDisconnect() {
        this._partyActive = false;
        for(let peerId in this._peers) {
            this._peers[peerId].close();
        }
        for(let peerId in this._avatars) {
            this._avatars[peerId].removeFromScene();
        }
        this._peers = {};
        this._avatars = {};
    }

    _registerPeer(peer) {
        peer.setOnSendDataChannelOpen(() => {
            this._peers[peer.getPeerId()] = peer;
            peer.sendData(JSON.stringify({
                "topic": "avatar",
                "url": UserController.getAvatarUrl(),
            }));
            if(this._isHost && global.isEditor) {
                this._sendProject(peer);
            }
        });
        peer.setOnSendDataChannelClose(() => {
            delete this._peers[peer.getPeerId()];
        });
        peer.setOnDisconnect(() => {
            delete this._peers[peer.getPeerId()];
            this._avatars[peer.getPeerId()].removeFromScene();
            delete this._avatars[peer.getPeerId()];
        });
        peer.setOnMessage((message) => {
            if(typeof message == "string") {
                this._handleJSON(peer, JSON.parse(message));
            } else {
                this._handleArrayBuffer(peer, message);
            }
        });
    }

    _handleJSON(peer, message) {
        if(message.topic == "avatar") {
            this._handleAvatar(peer, message);
        } else if(message.topic == "project") {
            this._handleProject(peer, message);
        }
    }

    _handleArrayBuffer(peer, message) {
        if(this._handleEventArrayBuffer) {
            this._handleEventArrayBuffer(peer, message);
            return;
        }
        let avatar = this._avatars[peer.getPeerId()];
        if(!avatar) return;
        let object = avatar.getObject();
        let float32Array = new Float32Array(message);
        object.position.fromArray(float32Array);
        let rotation = float32Array.slice(3, 6);
        object.rotation.fromArray(rotation);
    }

    _sendProject(peer, parts) {
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
                this._sendProject(peer, parts);
            });
            return;
        }
        peer.sendData(JSON.stringify({
            "topic": "project",
            "parts": parts.length,
        }));
        for(let part of parts) {
            peer.sendData(part);
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
        let peerId = peer.getPeerId();
        if(this._avatars[peerId]) {
            this._avatars[peerId].updateSourceUrl(message.url);
        } else {
            this._avatars[peer.getPeerId()] = new Avatar({ URL: message.url });
            this._avatars[peer.getPeerId()].addToScene(global.scene);
        }
    }

    host(roomId, successCallback, errorCallback) {
        this._isHost = true;
        this._partyActive = true;
        Party.host(roomId, () => { this._successCallback(); },
            () => { this._errorCallback(); });
    }

    join(roomId, successCallback, errorCallback) {
        this._isHost = false;
        this._partyActive = true;
        Party.join(roomId, () => { this._successCallback(); },
            () => { this._errorCallback(); });
    }

    update() {
        if(!this._partyActive) return;
        if(global.renderer.info.render.frame % 2 == 0) return;
        let buffer = UserController.getDataForRTC();
        for(let peerId in this._peers) {
            this._peers[peerId].sendData(buffer);
        }
    }
}

let partyHandler = new PartyHandler();
export default partyHandler;

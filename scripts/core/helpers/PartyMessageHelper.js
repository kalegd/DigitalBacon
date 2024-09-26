/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import InternalMessageIds from '/scripts/core/enums/InternalMessageIds.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import { uuidFromBytes, uuidToBytes, concatenateArrayBuffers, Queue } from '/scripts/core/helpers/utils.module.js';

const SIXTEEN_KB = 1024 * 16;
const HANDLERS = {
    asset_added: '_handleAssetAdded',
    user_controller: '_handleUserController',
    username: '_handleUsername',
};
const BUFFER_HANDLERS = {
    [InternalMessageIds.ASSET_ADDED_PART]: '_handleBufferAssetAdded',
    [InternalMessageIds.USER_PERSPECTIVE]: '_handleUserPerspective',
};
const BLOCKABLE_HANDLERS = {
    instance_added: '_handleInstanceAdded',
    instance_deleted: '_handleInstanceDeleted',
    instance_updated: '_handleInstanceUpdated',
    instance_attached: '_handleInstanceAttached',
    instance_detached: '_handleInstanceDetached',
    loaded_diff: '_handleLoadedDiff',
    sanitize_internals: '_handleSanitizeInternals',
    settings_updated: '_handleSettingsUpdated',
};
const BLOCKABLE_BUFFER_HANDLERS = {
    [InternalMessageIds.ENTITY_POSITION]: '_handleEntityPosition',
    [InternalMessageIds.ENTITY_ROTATION]: '_handleEntityRotation',
    [InternalMessageIds.ENTITY_SCALE]: '_handleEntityScale',
    [InternalMessageIds.ENTITY_TRANSFORMATION]: '_handleEntityTransformation',
    [InternalMessageIds.COMPONENT_ATTACHED]: '_handleComponentAttached',
    [InternalMessageIds.COMPONENT_DETACHED]: '_handleComponentDetached',
    [InternalMessageIds.ENTITY_ADDED]: '_handleEntityAdded',
    [InternalMessageIds.ENTITY_ATTACHED]: '_handleEntityAttached',
};

class PartyMessageHelper {
    constructor() {
        this._id = '44a9d6b3-2bf7-4e36-b8d1-10bb69de95cc';
        this._idBytes = uuidToBytes(this._id);
        this._handlingLocks = new Set();
        this._handleQueue = new Queue();
        this._publishQueue = new Queue();
    }

    init(PartyHandler) {
        this._partyHandler = PartyHandler;
        for(let id in HANDLERS) {
            let handler = (p, m) => this[HANDLERS[id]](p, m);
            this._partyHandler.addInternalMessageHandler(id, handler, true);
        }
        for(let id in BUFFER_HANDLERS) {
            let handler = (p, m) => this[BUFFER_HANDLERS[id]](p, m);
            this._partyHandler.addInternalBufferMessageHandler(id,handler,true);
        }
        for(let id in BLOCKABLE_HANDLERS) {
            let handler = (p, m) => this[BLOCKABLE_HANDLERS[id]](p, m);
            this._partyHandler.addInternalMessageHandler(id, handler);
        }
        for(let id in BLOCKABLE_BUFFER_HANDLERS) {
            let handler = (p, m) => this[BLOCKABLE_BUFFER_HANDLERS[id]](p, m);
            this._partyHandler.addInternalBufferMessageHandler(id, handler);
        }
    }

    registerHandler(topic, handler) {
        console.warn('registerHandler(...) is deprecated');
        this._partyHandler.addMessageHandler(topic, handler);
    }

    registerBlockableHandler(topic, handler) {
        console.warn('registerBlockableHandler(...) is deprecated');
        let blockableHandler = (p, m) => { this._handleBlockable(handler,p,m);};
        this._partyHandler.addMessageHandler(topic, blockableHandler);
    }

    publish(message) {
        this._partyHandler._sendToAllPeers(message);
    }

    queuePublish(message) {
        console.warn("PartyMessageHelper.queuePublish(...) is deprecated");
        if(typeof message == 'function') {
            this._publishQueue.enqueue(message);
        } else {
            this._publishQueue.enqueue(() => {
                this._partyHandler._sendToAllPeers(message);
                return Promise.resolve();
            });
        }
    }

    notifyDiffError() {
        PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
            text: "An unexpected error occured when loading the host's state",
        });
    }

    _handleUserController(peer, message) {
        if(!peer.controller) {
            let params = message.controllerParams;
            this._handleUsername(peer, params.username);
            let controller = ProjectHandler.getSessionAsset(params.id);
            if(controller) {
                ProjectHandler.addAsset(controller);
                controller.setDisplayingUsername(this._partyHandler
                    .getDisplayingUsernames());
            } else {
                params['displayingUsername'] = this._partyHandler
                    .getDisplayingUsernames();
                controller = ProjectHandler.addNewAsset(params.assetId, params,
                    true, true);
            }
            if(controller.peer && controller.peer != peer)
                controller.peer.controller = null;
            peer.controller = controller;
            controller.peer = peer;
        }
    }

    _handleAssetAdded(peer, message) {
        let lock = this._partyHandler.addMessageHandlerLock();
        if(message.isExternal) {
            let { assetId, name, type, url, sketchfabId } = message;
            let assetDetails = {
                Name: name,
                Type: type,
                IsExternal: true,
                URL: url,
                SketchfabID: sketchfabId,
            };
            LibraryHandler.loadLibraryExternalAsset(assetId, assetDetails)
                .then(() => {
                    PubSub.publish(this._id, PubSubTopics.ASSET_ADDED,
                        assetId);
                    this._partyHandler.removeMessageHandlerLock(lock);
                });
            return;
        }
        message.lock = lock;
        message.parts = [];
        peer.assetAddedDetails = message;
    }

    _handleBufferAssetAdded(peer, message) {
        if(!peer.assetAddedDetails) {
            console.error('Unexpected call to _handleBufferAssetAdded() before _handleAssetAdded()');
            return;
        }
        let { parts, partsLength, assetId, name, type, lock, sketchfabId }
            = peer.assetAddedDetails;
        parts.push(message);
        if(parts.length == partsLength) {
            let assetDetails = {
                Name: name,
                Type: type,
                SketchfabID: sketchfabId,
            };
            LibraryHandler.loadLibraryAssetFromArrayBuffer(assetId,
                assetDetails, parts).then(() => {
                PubSub.publish(this._id, PubSubTopics.ASSET_ADDED, assetId);
                this._partyHandler.removeMessageHandlerLock(lock);
            });
        }
    }

    _handleBlockable(handler, peer, message) {
        if(this._handlingLocks.size > 0) {
            this._handleQueue.enqueue(() => {
                handler(peer, message);
            });
            return;
        }
        handler(peer, message);
    }

    _handleComponentAttached(peer, message) {
        let messageBytes = new Uint8Array(message);
        message = {
            id: uuidFromBytes(messageBytes.subarray(0, 16)),
            componentId: uuidFromBytes(messageBytes.subarray(16, 32)),
            componentAssetId: uuidFromBytes(messageBytes.subarray(32, 48)),
        };
        let asset = ProjectHandler.getSessionAsset(message.id);
        if(asset) {
            if(asset.editorHelper) {
                asset.editorHelper.addComponent(message.componentId, true,true);
            } else {
                asset.addComponent(message.componentId, true);
            }
            PubSub.publish(this._id, PubSubTopics.COMPONENT_ATTACHED + ':'
                + message.componentAssetId, message);
        }
    }

    _handleComponentDetached(peer, message) {
        let messageBytes = new Uint8Array(message);
        message = {
            id: uuidFromBytes(messageBytes.subarray(0, 16)),
            componentId: uuidFromBytes(messageBytes.subarray(16, 32)),
            componentAssetId: uuidFromBytes(messageBytes.subarray(32, 48)),
        };
        let asset = ProjectHandler.getSessionAsset(message.id);
        if(asset) {
            if(asset.editorHelper) {
                asset.editorHelper.removeComponent(message.componentId, true,
                    true);
            } else {
                asset.removeComponent(message.componentId, true);
            }
            PubSub.publish(this._id, PubSubTopics.COMPONENT_DETACHED + ':'
                + message.componentAssetId, message);
        }
    }

    _handleEntityAdded(peer, message) {
        let messageBytes = new Uint8Array(message);
        message = {
            parentId: uuidFromBytes(messageBytes.subarray(0, 16)),
            childId: uuidFromBytes(messageBytes.subarray(16, 32)),
            position: Array.from(new Float64Array(message, 32, 3)),
            rotation: Array.from(new Float64Array(message, 56, 3)),
        };
        let parentAsset = ProjectHandler.getSessionAsset(message.parentId);
        let childAsset = ProjectHandler.getSessionAsset(message.childId);
        if(childAsset) {
            if(childAsset.editorHelper) {
                childAsset.editorHelper.addTo(parentAsset, true, true);
            } else {
                childAsset.addTo(parentAsset, true);
            }
            let object = childAsset.object;
            object.position.fromArray(message.position);
            object.rotation.fromArray(message.rotation);
            PubSub.publish(this._id, PubSubTopics.ENTITY_ADDED, message);
        } else {
            console.error("Missing child in message for _handleEntityAdded()");
        }
    }

    _handleEntityAttached(peer, message) {
        let messageBytes = new Uint8Array(message);
        message = {
            parentId: uuidFromBytes(messageBytes.subarray(0, 16)),
            childId: uuidFromBytes(messageBytes.subarray(16, 32)),
            position: Array.from(new Float64Array(message, 32, 3)),
            rotation: Array.from(new Float64Array(message, 56, 3)),
        };
        let parentAsset = ProjectHandler.getSessionAsset(message.parentId);
        let childAsset = ProjectHandler.getSessionAsset(message.childId);
        if(childAsset) {
            if(childAsset.editorHelper) {
                childAsset.editorHelper.attachTo(parentAsset, true, true);
            } else {
                childAsset.attachTo(parentAsset, true);
            }
            let object = childAsset.object;
            object.position.fromArray(message.position);
            object.rotation.fromArray(message.rotation);
            PubSub.publish(this._id, PubSubTopics.ENTITY_ATTACHED, message);
        } else {
            console.error("Missing child from entity_attached message");
        }
    }

    _handleEntityPosition(peer, message) {
        let id = uuidFromBytes(new Uint8Array(message, 0, 16));
        let position = Array.from(new Float64Array(message, 16, 3));
        let asset = ProjectHandler.getSessionAsset(id);
        if(asset) {
            asset.position = position;
        } else {
            console.error("Missing asset in message for _handleEntityPosition()");
        }
    }

    _handleEntityRotation(peer, message) {
        let id = uuidFromBytes(new Uint8Array(message, 0, 16));
        let rotation = Array.from(new Float64Array(message, 16, 3));
        let asset = ProjectHandler.getSessionAsset(id);
        if(asset) {
            asset.rotation = rotation;
        } else {
            console.error("Missing asset in message for _handleEntityRotation()");
        }
    }

    _handleEntityScale(peer, message) {
        let id = uuidFromBytes(new Uint8Array(message, 0, 16));
        let scale = Array.from(new Float64Array(message, 16, 3));
        let asset = ProjectHandler.getSessionAsset(id);
        if(asset) {
            asset.scale = scale;
        } else {
            console.error("Missing asset in message for _handleEntityScale()");
        }
    }

    _handleEntityTransformation(peer, message) {
        let id = uuidFromBytes(new Uint8Array(message, 0, 16));
        let position = Array.from(new Float64Array(message, 16, 3));
        let rotation = Array.from(new Float64Array(message, 40, 3));
        let scale = Array.from(new Float64Array(message, 64, 3));
        let asset = ProjectHandler.getSessionAsset(id);
        if(asset) {
            asset.position = position;
            asset.rotation = rotation;
            asset.scale = scale;
        } else {
            console.error("Missing asset in message for _handleEntityTransformation()");
        }
    }

    _handleInstanceAdded(peer, message) {
        let asset = ProjectHandler.getSessionAsset(message.asset.id);
        if(asset) {
            ProjectHandler.addAsset(asset, true, true);
        } else {
            asset = ProjectHandler.addNewAsset(message.asset.assetId,
                message.asset, true, true);
            let parentId = asset.parentId;
            if(parentId) {
                let parentAsset = ProjectHandler.getSessionAsset(parentId);
                if(parentAsset) asset.addTo(parentAsset, true);
            }
        }
        let topic = message.assetType + '_ADDED:' + asset.assetId +':'+asset.id;
        PubSub.publish(this._id, topic, asset);
    }

    _handleInstanceDeleted(peer, message) {
        let asset = ProjectHandler.getAsset(message.id);
        if(asset) {
            ProjectHandler.deleteAsset(asset, true, true);
            let topic = message.assetType + '_DELETED:' + message.assetId + ':'
                + message.id;
            PubSub.publish(this._id, topic, { asset: asset });
        } else {
            console.error("Asset to delete does not exist");
        }
    }

    _handleInstanceUpdated(peer, message) {
        let asset = ProjectHandler.getSessionAsset(message.params.id);
        if(asset) {
            this._handleAssetUpdate(asset, message.params, message.extraData,
                message.assetType + '_UPDATED');
        }
    }

    _handleInstanceAttached(peer, message) {
        let instance = ProjectHandler.getSessionAsset(message.id);
        if(instance) {
            let editorHelper = instance.editorHelper;
            if(editorHelper) editorHelper.attachToPeer(peer, message);
        }
    }

    _handleInstanceDetached(peer, message) {
        let instance = ProjectHandler.getSessionAsset(message.id);
        if(instance) {
            let editorHelper = instance.editorHelper;
            if(editorHelper) editorHelper.detachFromPeer(peer, message);
        }
    }

    _handleLoadedDiff(peer) {
        PubSub.publish(this._id, PubSubTopics.PEER_READY, { peer: peer });
        peer.readyForUpdates = true;
    }

    _handleSanitizeInternals() {
        PubSub.publish(this._id, PubSubTopics.SANITIZE_INTERNALS,null,true);
    }

    _handleSettingsUpdated(peer, settings) {
        for(let setting in settings) {
            let handler;
            if(setting == 'User Settings') {
                handler = 'setUserSetting';
            } else if(setting == 'Skybox') {
                handler = 'setSkyboxSide';
            } else {
                console.error("Unknown setting updated: " + setting);
                return;
            }
            for(let key in settings[setting]) {
                SettingsHandler[handler](key, settings[setting][key], true);
            }
        }
        PubSub.publish(this._id, PubSubTopics.SETTINGS_UPDATED,
            { settings: settings });
    }

    _handleAssetUpdate(asset, params, extraData, topic) {
        let updatedParams = [];
        for(let param in params) {
            if(param == 'id') continue;
            updatedParams.push(param);
            if(extraData?.[param]) {
                if(extraData[param].type == 'useFunction') {
                    asset[extraData[param].funcName](extraData[param].value);
                }
            } else if(param in asset) {
                asset[param] = params[param];
            }
            if(asset.editorHelper) asset.editorHelper.updateMenuField(param);
        }
        let message = {
            asset: asset,
            fields: updatedParams,
        };
        if(extraData) message.extraData = extraData;
        PubSub.publish(this._id, topic, message);
    }

    _handleUsername(peer, username) {
        if(peer.username == username) return;
        peer.username = username;
        if(peer.controller) peer.controller.username = username;
        PubSub.publish(this._id, PubSubTopics.PEER_USERNAME_UPDATED, {
            peer: peer,
        });
    }

    _handleUserPerspective(peer, message) {
        let perspective = new Uint8Array(message)[0];
        if(peer.controller) peer.controller.setFirstPerson(perspective == 1);
    }

    handlePartyStarted() {
        PubSub.publish(this._id, PubSubTopics.PARTY_STARTED);
    }

    handlePartyEnded() {
        PubSub.publish(this._id, PubSubTopics.PARTY_ENDED);
    }

    handlePeerConnected(peer) {
        PubSub.publish(this._id, PubSubTopics.PEER_CONNECTED, { peer: peer });
    }

    handlePeerDisconnected(peer) {
        let topic = PubSubTopics.PEER_DISCONNECTED + ':' + peer.id;
        PubSub.publish(this._id, topic, { peer: peer });
    }

    handleDiffLoaded() {
        this._partyHandler._sendToAllPeers(JSON.stringify({
            topic: 'loaded_diff',
        }));
        PubSub.publish(this._id, PubSubTopics.USER_READY);
    }

    _removeHandlingLock(lock) {
        this._handlingLocks.delete(lock);
        while(this._handleQueue.length > 0 && this._handlingLocks.size == 0) {
            this._handleQueue.dequeue()();
        }
    }

    _publishAssetAdded(assetId) {
        let libraryDetails = LibraryHandler.getLibrary()[assetId];
        if(libraryDetails['IsExternal']) {
            this._partyHandler.publishInternalMessage('asset_added', {
                assetId: assetId,
                name: libraryDetails['Name'],
                type: libraryDetails['Type'],
                url: libraryDetails['URL'],
                sketchfabId: libraryDetails['SketchfabID'],
                isExternal: true,
            }, true);
            return;
        }
        this._partyHandler.publishFromFunction(() => new Promise((resolve) => {
            let libraryDetails = LibraryHandler.getLibrary()[assetId];
            let blob = libraryDetails['Blob'];
            blob.arrayBuffer().then((buffer) => {
                let parts = [];
                let n = Math.ceil(buffer.byteLength / SIXTEEN_KB);
                for(let i = 0; i < n; i++) {
                    let chunkStart = i * SIXTEEN_KB;
                    let chunkEnd = (i + 1) * SIXTEEN_KB;
                    parts.push(buffer.slice(chunkStart, chunkEnd));
                }
                this._partyHandler.publishInternalMessage('asset_added', {
                    assetId: assetId,
                    name: libraryDetails['Name'],
                    type: libraryDetails['Type'],
                    sketchfabId: libraryDetails['SketchfabID'],
                    partsLength: parts.length,
                }, true);
                for(let part of parts) {
                    this._partyHandler.publishInternalBufferMessage(
                        InternalMessageIds.ASSET_ADDED_PART, part, true);
                }
                resolve();
            });
        }));
    }

    _publishComponentAttachedDetached(internalMessageId, message) {
        let peerMessage = concatenateArrayBuffers(
            uuidToBytes(message.id),
            uuidToBytes(message.componentId),
            uuidToBytes(message.componentAssetId)
        );
        this._partyHandler.publishInternalBufferMessage(internalMessageId,
            peerMessage);
    }

    _publishEntityAdded(message) {
        let childAsset = ProjectHandler.getSessionAsset(message.childId);
        let peerMessage = concatenateArrayBuffers(
            uuidToBytes(message.parentId),
            uuidToBytes(message.childId),
            new Float64Array(childAsset.position),
            new Float64Array(childAsset.rotation),
        );
        this._partyHandler.publishInternalBufferMessage(
            InternalMessageIds.ENTITY_ADDED, peerMessage);
    }

    _publishEntityAttached(message) {
        let childAsset = ProjectHandler.getSessionAsset(message.childId);
        let peerMessage = concatenateArrayBuffers(
            uuidToBytes(message.parentId),
            uuidToBytes(message.childId),
            new Float64Array(childAsset.position),
            new Float64Array(childAsset.rotation),
        );
        this._partyHandler.publishInternalBufferMessage(
            InternalMessageIds.ENTITY_ATTACHED, peerMessage);
    }

    _publishInstanceAdded(asset, assetType) {
        let message = {
            asset: asset.exportParams(),
            assetType: assetType,
        };
        this._partyHandler.publishInternalMessage('instance_added', message);
    }

    _publishInstanceDeleted(asset, assetType) {
        let message = {
            id: asset.id,
            assetId: asset.assetId,
            assetType: assetType,
        };
        this._partyHandler.publishInternalMessage('instance_deleted', message);
    }

    _publishInstanceUpdated(updateMessage, assetType) {
        let asset = {};
        asset['id'] = updateMessage.asset.id;
        for(let param of updateMessage.fields) {
            asset[param] = updateMessage.asset[param];
            if(asset[param] === undefined) asset[param] = null;
        }
        let peerMessage = {
            params: asset,
            assetType: assetType,
        };
        if(updateMessage.extraData)
            peerMessage.extraData = updateMessage.extraData;
        this._partyHandler.publishInternalMessage('instance_updated',
            peerMessage);
    }

    _publishInstanceAttached(data) {
        let message = {
            id: data.instance.id,
            assetId: data.instance.assetId,
            ownerId: data.ownerId,
            type: data.type,
        };
        if(global.deviceType == 'XR') {
            message['position'] = data.position;
            message['rotation'] = data.rotation;
            message['scale'] = data.scale;
            message['twoHandScaling'] = data.twoHandScaling;
            message['isXR'] = true;
        }
        this._partyHandler.publishInternalMessage('instance_attached', message);
    }

    _publishInstanceDetached(data) {
        let message = {
            id: data.instance.id,
            assetId: data.instance.assetId,
            ownerId: data.ownerId,
            type: data.type,
        };
        if(global.deviceType == 'XR') {
            message['position'] = data.position;
            message['rotation'] = data.rotation;
            message['scale'] = data.scale;
            message['twoHandScaling'] = data.twoHandScaling;
            message['isXR'] = true;
        }
        this._partyHandler.publishInternalMessage('instance_detached', message);
    }

    _publishSettingsUpdated(updateMessage) {
        let settings = updateMessage.settings;
        let keys = updateMessage.keys;
        let message = {};
        message[keys[0]] = {};
        message[keys[0]][keys[1]] = settings[keys[0]][keys[1]];
        this._partyHandler.publishInternalMessage('settings_updated', message);
    }

    _publishUserPerspectiveChanged(perspective) {
        let message = new Uint8Array([perspective]);
        this._partyHandler.publishInternalBufferMessage(
            InternalMessageIds.USER_PERSPECTIVE, message);
    }

    _publishUsernameUpdated(username) {
        this._partyHandler.publishInternalMessage('username', username);
    }

    addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.ASSET_ADDED, (assetId) => {
            this._publishAssetAdded(assetId);
        });
        PubSub.subscribe(this._id, PubSubTopics.BECOME_PARTY_HOST, () => {
            this._partyHandler.setIsHost(true);
        });
        PubSub.subscribe(this._id, PubSubTopics.BOOT_PEER, (peerId) => {
            this._partyHandler.bootPeer(peerId);
        });
        PubSub.subscribe(this._id, PubSubTopics.COMPONENT_ATTACHED, (message)=>{
            this._publishComponentAttachedDetached(
                InternalMessageIds.COMPONENT_ATTACHED, message);
        });
        PubSub.subscribe(this._id, PubSubTopics.COMPONENT_DETACHED, (message)=>{
            this._publishComponentAttachedDetached(
                InternalMessageIds.COMPONENT_DETACHED, message);
        });
        PubSub.subscribe(this._id, PubSubTopics.ENTITY_ADDED, (message) => {
            this._publishEntityAdded(message);
        });
        PubSub.subscribe(this._id, PubSubTopics.ENTITY_ATTACHED, (message) => {
            this._publishEntityAttached(message);
        });
        PubSub.subscribe(this._id, PubSubTopics.INSTANCE_ATTACHED, (message) =>{
            this._publishInstanceAttached(message);
        });
        PubSub.subscribe(this._id, PubSubTopics.INSTANCE_DETACHED, (message) =>{
            this._publishInstanceDetached(message);
        });
        PubSub.subscribe(this._id, PubSubTopics.SANITIZE_INTERNALS, () => {
            this._publishQueue.enqueue(() => {
                this._partyHandler._sendToAllPeers(
                    JSON.stringify({ topic: 'sanitize_internals' }));
                return Promise.resolve();
            });
        });
        PubSub.subscribe(this._id, PubSubTopics.SETTINGS_UPDATED, (message) => {
            this._publishSettingsUpdated(message);
        });
        PubSub.subscribe(this._id, PubSubTopics.USER_PERSPECTIVE_CHANGED, (n)=>{
            this._publishUserPerspectiveChanged(n);
        });
        PubSub.subscribe(this._id, PubSubTopics.USERNAME_UPDATED, (username) =>{
            this._publishUsernameUpdated(username);
        });
        for(let assetType in AssetTypes) {
            let addedTopic = PubSubTopics[assetType + '_ADDED'];
            let deletedTopic = PubSubTopics[assetType + '_DELETED'];
            let updatedTopic = PubSubTopics[assetType + '_UPDATED'];
            PubSub.subscribe(this._id, addedTopic, (asset) => {
                this._publishInstanceAdded(asset, assetType);
            });
            PubSub.subscribe(this._id, deletedTopic, (message) => {
                this._publishInstanceDeleted(message.asset, assetType);
            });
            PubSub.subscribe(this._id, updatedTopic, (message) => {
                this._publishInstanceUpdated(message, assetType);
            });
        }
    }

    removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.ASSET_ADDED);
        PubSub.unsubscribe(this._id, PubSubTopics.BECOME_PARTY_HOST);
        PubSub.unsubscribe(this._id, PubSubTopics.BOOT_PEER);
        PubSub.unsubscribe(this._id, PubSubTopics.COMPONENT_ATTACHED);
        PubSub.unsubscribe(this._id, PubSubTopics.COMPONENT_DETACHED);
        PubSub.unsubscribe(this._id, PubSubTopics.ENTITY_ADDED);
        PubSub.unsubscribe(this._id, PubSubTopics.ENTITY_ATTACHED);
        PubSub.unsubscribe(this._id, PubSubTopics.INSTANCE_ATTACHED);
        PubSub.unsubscribe(this._id, PubSubTopics.INSTANCE_DETACHED);
        PubSub.unsubscribe(this._id, PubSubTopics.SANITIZE_INTERNALS);
        PubSub.unsubscribe(this._id, PubSubTopics.SETTINGS_UPDATED);
        PubSub.unsubscribe(this._id, PubSubTopics.USER_PERSPECTIVE_CHANGED);
        PubSub.unsubscribe(this._id, PubSubTopics.USERNAME_UPDATED);
        for(let assetType in AssetTypes) {
            PubSub.unsubscribe(this._id, PubSubTopics[assetType + '_ADDED']);
            PubSub.unsubscribe(this._id, PubSubTopics[assetType + '_DELETED']);
            PubSub.unsubscribe(this._id, PubSubTopics[assetType + '_UPDATED']);
        }
    }

    update() {
        if(this._isPublishing || this._publishQueue.length == 0) return;
        this._isPublishing = true;
        this._publishQueue.dequeue()().then(() => this._isPublishing = false);
    }
}

let partyMessageHelper = new PartyMessageHelper();
export default partyMessageHelper;

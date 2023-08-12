/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import { uuidv4, capitalizeFirstLetter, Queue } from '/scripts/core/helpers/utils.module.js';

const SIXTEEN_KB = 1024 * 16;
const BLOCKABLE_HANDLERS_MAP = {
    component_attached: '_handleComponentAttached',
    component_detached: '_handleComponentDetached',
    entity_added: '_handleEntityAdded',
    entity_attached: '_handleEntityAttached',
    instance_added: '_handleInstanceAdded',
    instance_deleted: '_handleInstanceDeleted',
    instance_updated: '_handleInstanceUpdated',
    instance_attached: '_handleInstanceAttached',
    instance_detached: '_handleInstanceDetached',
    loaded_diff: '_handleLoadedDiff',
    sanitize_internals: '_handleSanitizeInternals',
    settings_updated: '_handleSettingsUpdated',
};

class PartyMessageHelper {
    constructor() {
        this._id = uuidv4();
        this._handlingLocks = new Set();
        this._handleQueue = new Queue();
        this._publishQueue = new Queue();
    }

    init(PartyHandler) {
        this._partyHandler = PartyHandler;
        let handlers = {
            asset_added: (p, m) => { this._handleAssetAdded(p, m); },
            username: (p, m) => { this._handleUsername(p, m); },
            user_controller: (p, m) => { this._handleUserController(p, m); },
            user_perspective: (p, m) => { this._handleUserPerspective(p,m); },
        };
        for(let topic in BLOCKABLE_HANDLERS_MAP) {
            let handler = (p,m) => {this[BLOCKABLE_HANDLERS_MAP[topic]](p, m);};
            handlers[topic] = (p, m) => { this._handleBlockable(handler,p,m); };
        }
        this._partyHandler.addMessageHandlers(handlers);
    }

    registerHandler(topic, handler) {
        this._partyHandler.addMessageHandler(topic, handler);
    }

    registerBlockableHandler(topic, handler) {
        let blockableHandler = (p, m) => { this._handleBlockable(handler,p,m);};
        this._partyHandler.addMessageHandler(topic, blockableHandler);
    }

    publish(message) {
        this._partyHandler.sendToAllPeers(message);
    }

    queuePublish(message) {
        if(typeof message == 'function') {
            this._publishQueue.enqueue(f);
        } else {
            this._publishQueue.enqueue(() => {
                this._partyHandler.sendToAllPeers(message);
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
            peer.username = params.username;
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
        let lock = uuidv4();
        this._handlingLocks.add(lock);
        let partsLength = message.parts;
        let assetId = message.assetId;
        let name = message.name;
        let type = message.type;
        let parts = [];
        this._partyHandler.setEventBufferHandler(peer, (peer, message) => {
            parts.push(message);
            if(parts.length == partsLength) {
                this._partyHandler.setEventBufferHandler(peer);
                let blob = new Blob(parts, { type: 'application/javascript' });
                let assetDetails = {
                    Name: name,
                    Type: type,
                };
                LibraryHandler.loadLibraryAsset(assetId, assetDetails, blob)
                    .then(() => {
                        PubSub.publish(this._id, PubSubTopics.ASSET_ADDED,
                            assetId);
                        this._removeHandlingLock(lock);
                    });
            }
        });
    }

    _handleBlockable(handler, peer, message) {
        if(this._handlingLocks.size > 0) {
            this._handleQueue.enqueue(() => {
                handler(peer, message)
            });
            return;
        }
        handler(peer, message);
    }

    _handleComponentAttached(peer, message) {
        let asset = ProjectHandler.getSessionAsset(message.id);
        if(asset) {
            if(asset.editorHelper) {
                asset.editorHelper.addComponent(message.componentId, true,true);
            } else {
                asset.addComponent(message.componentId, true);
            }
            delete message['topic'];
            PubSub.publish(this._id, PubSubTopics.COMPONENT_ATTACHED + ':'
                + message.componentAssetId, message);
        }
    }

    _handleComponentDetached(peer, message) {
        let asset = ProjectHandler.getSessionAsset(message.id);
        if(asset) {
            if(asset.editorHelper) {
                asset.editorHelper.removeComponent(message.componentId, true,
                    true);
            } else {
                asset.removeComponent(message.componentId, true);
            }
            delete message['topic'];
            PubSub.publish(this._id, PubSubTopics.COMPONENT_DETACHED + ':'
                + message.componentAssetId, message);
        }
    }

    _handleEntityAdded(peer, message) {
        let parentAsset = ProjectHandler.getSessionAsset(message.parentId);
        let childAsset = ProjectHandler.getSessionAsset(message.childId);
        if(childAsset) {
            if(childAsset.editorHelper) {
                childAsset.editorHelper.addTo(parentAsset, true, true);
            } else {
                childAsset.addTo(parentAsset, true);
            }
            delete message['topic'];
            PubSub.publish(this._id, PubSubTopics.ENTITY_ADDED, message);
        } else {
            console.error(
                "Missing child from entity_added message");
        }
    }

    _handleEntityAttached(peer, message) {
        let parentAsset = ProjectHandler.getSessionAsset(message.parentId);
        let childAsset = ProjectHandler.getSessionAsset(message.childId);
        if(childAsset) {
            if(childAsset.editorHelper) {
                childAsset.editorHelper.attachTo(parentAsset, true, true);
            } else {
                childAsset.attachTo(parentAsset, true);
            }
            delete message['topic'];
            PubSub.publish(this._id, PubSubTopics.ENTITY_ATTACHED, message);
        } else {
            console.error(
                "Missing child from entity_attached message");
        }
    }

    _handleInstanceAdded(peer, message) {
        let asset = ProjectHandler.getSessionAsset(message.asset.id);
        if(asset) {
            ProjectHandler.addAsset(asset, true, true);
        } else {
            asset = ProjectHandler.addNewAsset(message.asset.assetId,
                message.asset, true, true);
            let parentId = asset.getParentId();
            let parentAsset = ProjectHandler.getSessionAsset(parentId);
            if(parentAsset) asset.addTo(parentAsset, true);
        }
        PubSub.publish(this._id, message.assetType + '_ADDED', asset);
    }

    _handleInstanceDeleted(peer, message) {
        let asset = ProjectHandler.getAsset(message.id);
        if(asset) {
            ProjectHandler.deleteAsset(asset, true, true);
            let topic = message.assetType + '_DELETED:' + message.id;
            PubSub.publish(this._id, topic, { asset: asset });
        } else {
            console.error("Asset to delete does not exist");
        }
    }

    _handleInstanceUpdated(peer, message) {
        let asset = ProjectHandler.getSessionAsset(message.params.id);
        if(asset) {
            this._handleAssetUpdate(asset, message.params,
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

    _handleLoadedDiff(peer, message) {
        PubSub.publish(this._id, PubSubTopics.PEER_READY, { peer: peer });
    }

    _handleSanitizeInternals(peer, message) {
        PubSub.publish(this._id, PubSubTopics.SANITIZE_INTERNALS,null,true);
    }

    _handleSettingsUpdated(peer, message) {
        let settings = message.settings;
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

    _handleAssetUpdate(asset, params, topic) {
        let updatedParams = [];
        for(let param in params) {
            if(param == 'id') continue;
            updatedParams.push(param);
            let capitalizedParam = capitalizeFirstLetter(param);
            if(('set' + capitalizedParam) in asset)
                asset['set' + capitalizedParam](params[param]);
            if(asset.editorHelper) asset.editorHelper.updateMenuField(param);
        }
        let message = {
            asset: asset,
            fields: updatedParams,
        };
        PubSub.publish(this._id, topic, message);
    }

    _handleUsername(peer, message) {
        let username = message.username;
        if(peer.username == username) return;
        peer.username = username;
        if(peer.controller) peer.controller.setUsername(username);
        PubSub.publish(this._id, PubSubTopics.PEER_USERNAME_UPDATED, {
            peer: peer,
        });
    }

    _handleUserPerspective(peer, message) {
        let perspective = message.perspective;
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
        PubSub.publish(this._id, PubSubTopics.PEER_DISCONNECTED,{ peer: peer });
    }

    _removeHandlingLock(lock) {
        this._handlingLocks.delete(lock);
        while(this._handleQueue.length > 0 && this._handlingLocks.size == 0) {
            this._handleQueue.dequeue()();
        }
    }

    _publishAssetAdded(assetId) {
        return new Promise((resolve) => {
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
                this._partyHandler.sendToAllPeers(JSON.stringify({
                    topic: 'asset_added',
                    assetId: assetId,
                    name: libraryDetails['Name'],
                    type: libraryDetails['Type'],
                    parts: parts.length,
                }));
                for(let part of parts) {
                    this._partyHandler.sendToAllPeers(part);
                }
                resolve();
            });
        });
    }

    _publishComponentAttachedDetached(topic, message) {
        let peerMessage = {
            topic: topic,
            id: message.id,
            assetId: message.assetId,
            assetType: message.assetType,
            componentId: message.componentId,
            componentAssetId: message.componentAssetId,
        };
        this._partyHandler.sendToAllPeers(JSON.stringify(peerMessage));
        return Promise.resolve();
    }

    _publishEntityAdded(message) {
        let peerMessage = {
            topic: 'entity_added',
            parentId: message.parentId,
            childId: message.childId,
        };
        this._partyHandler.sendToAllPeers(JSON.stringify(peerMessage));
        return Promise.resolve();
    }

    _publishEntityAttached(message) {
        let peerMessage = {
            topic: 'entity_attached',
            parentId: message.parentId,
            childId: message.childId,
        };
        this._partyHandler.sendToAllPeers(JSON.stringify(peerMessage));
        return Promise.resolve();
    }

    _publishInstanceAdded(asset, assetType) {
        let message = {
            topic: 'instance_added',
            asset: asset.exportParams(),
            assetType: assetType,
        };
        this._partyHandler.sendToAllPeers(JSON.stringify(message));
        return Promise.resolve();
    }

    _publishInstanceDeleted(asset, assetType) {
        let message = {
            topic: 'instance_deleted',
            id: asset.getId(),
            assetId: asset.getAssetId(),
            assetType: assetType,
        };
        this._partyHandler.sendToAllPeers(JSON.stringify(message));
        return Promise.resolve();
    }

    _publishInstanceUpdated(updateMessage, assetType) {
        let asset = {};
        asset['id'] = updateMessage.asset.getId();
        for(let param of updateMessage.fields) {
            let capitalizedParam = capitalizeFirstLetter(param);
            asset[param] = updateMessage.asset['get' + capitalizedParam]();
        }
        let peerMessage = {
            topic: "instance_updated",
            params: asset,
            assetType: assetType,
        };
        this._partyHandler.sendToAllPeers(
            JSON.stringify(peerMessage, (k, v) => v === undefined ? null : v));
        return Promise.resolve();
    }

    _publishInstanceAttached(data) {
        let message = {
            topic: 'instance_attached',
            id: data.instance.getId(),
            assetId: data.instance.getAssetId(),
            option: data.option,
            type: data.type,
        };
        if(global.deviceType == 'XR') {
            message['position'] = data.position;
            message['rotation'] = data.rotation;
            message['scale'] = data.scale;
            message['twoHandScaling'] = data.twoHandScaling;
            message['isXR'] = true;
        }
        this._partyHandler.sendToAllPeers(JSON.stringify(message));
        return Promise.resolve();
    }

    _publishInstanceDetached(data) {
        let message = {
            topic: 'instance_detached',
            id: data.instance.getId(),
            assetId: data.instance.getAssetId(),
            option: data.option,
            type: data.type,
        };
        if(global.deviceType == 'XR') {
            message['position'] = data.position;
            message['rotation'] = data.rotation;
            message['scale'] = data.scale;
            message['twoHandScaling'] = data.twoHandScaling;
            message['isXR'] = true;
        }
        this._partyHandler.sendToAllPeers(JSON.stringify(message));
        return Promise.resolve();
    }

    _publishSettingsUpdate(updateMessage) {
        let settings = updateMessage.settings;
        let keys = updateMessage.keys;
        let peerMessage = {
            topic: 'settings_updated',
            settings: {},
        };
        peerMessage.settings[keys[0]] = {};
        peerMessage.settings[keys[0]][keys[1]] = settings[keys[0]][keys[1]];
        this._partyHandler.sendToAllPeers(JSON.stringify(peerMessage));
        return Promise.resolve();
    }

    _publishUserPerspectiveChanged(perspective) {
        let message = {
            topic: 'user_perspective',
            perspective: perspective,
        };
        this._partyHandler.sendToAllPeers(JSON.stringify(message));
        return Promise.resolve();
    }

    _publishUsernameUpdated(username) {
        let message = {
            topic: 'username',
            username: username,
        };
        this._partyHandler.sendToAllPeers(JSON.stringify(message));
        return Promise.resolve();
    }

    addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.ASSET_ADDED, (assetId) => {
            this._publishQueue.enqueue(() => {
                return this._publishAssetAdded(assetId);
            });
        });
        PubSub.subscribe(this._id, PubSubTopics.BECOME_PARTY_HOST, () => {
            this._partyHandler.setIsHost(true);
        });
        PubSub.subscribe(this._id, PubSubTopics.BOOT_PEER, (peerId) => {
            this._partyHandler.bootPeer(peerId);
        });
        PubSub.subscribe(this._id, PubSubTopics.COMPONENT_ATTACHED, (message)=>{
            this._publishQueue.enqueue(() => {
                return this._publishComponentAttachedDetached(
                    'component_attached', message);
            });
        });
        PubSub.subscribe(this._id, PubSubTopics.COMPONENT_DETACHED, (message)=>{
            this._publishQueue.enqueue(() => {
                return this._publishComponentAttachedDetached(
                    'component_detached', message);
            });
        });
        PubSub.subscribe(this._id, PubSubTopics.ENTITY_ADDED, (message) => {
            this._publishQueue.enqueue(() => {
                return this._publishEntityAdded(message);
            });
        });
        PubSub.subscribe(this._id, PubSubTopics.ENTITY_ATTACHED, (message) => {
            this._publishQueue.enqueue(() => {
                return this._publishEntityAttached(message);
            });
        });
        PubSub.subscribe(this._id, PubSubTopics.INSTANCE_ATTACHED, (message) =>{
            this._publishQueue.enqueue(() => {
                return this._publishInstanceAttached(message);
            });
        });
        PubSub.subscribe(this._id, PubSubTopics.INSTANCE_DETACHED, (message) =>{
            this._publishQueue.enqueue(() => {
                return this._publishInstanceDetached(message);
            });
        });
        PubSub.subscribe(this._id, PubSubTopics.SANITIZE_INTERNALS, () => {
            this._publishQueue.enqueue(() => {
                this._partyHandler.sendToAllPeers(
                    JSON.stringify({ topic: 'sanitize_internals' }));
                return Promise.resolve();
            });
        });
        PubSub.subscribe(this._id, PubSubTopics.SETTINGS_UPDATED, (message) => {
            this._publishQueue.enqueue(() => {
                return this._publishSettingsUpdate(message);
            });
        });
        PubSub.subscribe(this._id, PubSubTopics.USER_PERSPECTIVE_CHANGED, (n)=>{
            this._publishQueue.enqueue(() => {
                return this._publishUserPerspectiveChanged(n);
            });
        });
        PubSub.subscribe(this._id, PubSubTopics.USERNAME_UPDATED, (username) =>{
            this._publishQueue.enqueue(() => {
                return this._publishUsernameUpdated(username);
            });
        });
        for(let assetType in AssetTypes) {
            let addedTopic = PubSubTopics[assetType + '_ADDED'];
            let deletedTopic = PubSubTopics[assetType + '_DELETED'];
            let updatedTopic = PubSubTopics[assetType + '_UPDATED'];
            PubSub.subscribe(this._id, addedTopic, (asset) => {
                this._publishQueue.enqueue(() => {
                    return this._publishInstanceAdded(asset, assetType);
                });
            });
            PubSub.subscribe(this._id, deletedTopic, (message) => {
                this._publishQueue.enqueue(() => {
                    return this._publishInstanceDeleted(message.asset,
                        assetType);
                });
            });
            PubSub.subscribe(this._id, updatedTopic, (message) => {
                this._publishQueue.enqueue(() => {
                    return this._publishInstanceUpdated(message,assetType);
                });
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

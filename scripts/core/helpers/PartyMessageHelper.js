/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PeerController from '/scripts/core/assets/PeerController.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import MaterialsHandler from '/scripts/core/handlers/MaterialsHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import SettingsHandler from '/scripts/core/handlers/SettingsHandler.js';
import TexturesHandler from '/scripts/core/handlers/TexturesHandler.js';
import { uuidv4, capitalizeFirstLetter, Queue } from '/scripts/core/helpers/utils.module.js';

const SIXTEEN_KB = 1024 * 16;
const BLOCKABLE_HANDLERS_MAP = {
    instance_added: '_handleInstanceAdded',
    instance_deleted: '_handleInstanceDeleted',
    instance_updated: '_handleInstanceUpdated',
    material_added: '_handleMaterialAdded',
    material_deleted: '_handleMaterialDeleted',
    material_updated: '_handleMaterialUpdated',
    settings_updated: '_handleSettingsUpdated',
    texture_added: '_handleTextureAdded',
    texture_deleted: '_handleTextureDeleted',
    texture_updated: '_handleTextureUpdated',
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
            avatar: (p, m) => { this._handleAvatar(p, m); },
            asset_added: (p, m) => { this._handleAssetAdded(p, m); },
            username: (p, m) => { this._handleUsername(p, m); },
        };
        for(let topic in BLOCKABLE_HANDLERS_MAP) {
            let handler = BLOCKABLE_HANDLERS_MAP[topic];
            handlers[topic] = (p, m) => { this._handleBlockable(handler,p,m); };
        }
        this._partyHandler.addMessageHandlers(handlers);
    }

    _handleAvatar(peer, message) {
        if(peer.controller) {
            peer.controller.updateAvatar(message.url);
        } else {
            peer.controller = new PeerController({ URL: message.url });
            peer.controller.addToScene(global.scene);
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
                let blob = new Blob(parts);
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
                this[handler](peer, message)
            });
            return;
        }
        this[handler](peer, message);
    }

    _handleInstanceAdded(peer, message) {
        let instance = ProjectHandler.getSessionInstance(message.instance.id);
        if(instance) {
            instance.addToScene(global.scene);
            ProjectHandler.addAsset(instance, true, true);
        } else {
            instance = ProjectHandler.addInstance(message.instance, true, true);
        }
        PubSub.publish(this._id, PubSubTopics.INSTANCE_ADDED, instance);
    }

    _handleInstanceDeleted(peer, peerMessage) {
        let assets = ProjectHandler.getInstancesForAssetId(peerMessage.assetId);
        let instance = assets[peerMessage.id];
        if(instance) {
            ProjectHandler.deleteAssetInstance(instance, true, true);
            let topic = PubSubTopics.INSTANCE_DELETED + ":" + peerMessage.id;
            let message = { instance: instance };
            PubSub.publish(this._id, topic, message, true);
        } else {
            console.error("Instance to delete does not exist");
        }
    }

    _handleInstanceUpdated(peer, message) {
        let params = message.instance;
        let instance = ProjectHandler.getSessionInstance(params.id);
        if(instance) {
            this._handleAssetUpdate(instance, params,
                PubSubTopics.INSTANCE_UPDATED);
        }
    }

    _handleMaterialAdded(peer, message) {
        let material = MaterialsHandler.getSessionMaterial(message.material.id);
        if(material) {
            MaterialsHandler.addMaterial(material, true, true);
        } else {
            material = MaterialsHandler.addNewMaterial(message.type,
                        message.material, true, true);
        }
        PubSub.publish(this._id, PubSubTopics.MATERIAL_ADDED, material);
    }

    _handleMaterialDeleted(peer, peerMessage) {
        let material = MaterialsHandler.getMaterial(peerMessage.id);
        if(material) {
            MaterialsHandler.deleteMaterial(material, true, true);
            let topic = PubSubTopics.MATERIAL_DELETED + ":" + peerMessage.id;
            let message = { material: material };
            PubSub.publish(this._id, topic, message, true);
        } else {
            console.error("Material to delete does not exist");
        }
    }

    _handleMaterialUpdated(peer, message) {
        let params = message.material;
        let material = MaterialsHandler.getSessionMaterial(params.id);
        if(material) {
            this._handleAssetUpdate(material, params,
                PubSubTopics.MATERIAL_UPDATED);
        }
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

    _handleTextureAdded(peer, message) {
        let texture = TexturesHandler.getSessionTexture(message.texture.id);
        if(texture) {
            TexturesHandler.addTexture(texture, true, true);
        } else {
            texture = TexturesHandler.addNewTexture(message.type,
                        message.texture, true, true);
        }
        PubSub.publish(this._id, PubSubTopics.TEXTURE_ADDED, texture);
    }

    _handleTextureDeleted(peer, peerMessage) {
        let texture = TexturesHandler.getTexture(peerMessage.id);
        if(texture) {
            TexturesHandler.deleteTexture(texture, true, true);
            let topic = PubSubTopics.TEXTURE_DELETED + ":" + peerMessage.id;
            let message = { texture: texture };
            PubSub.publish(this._id, topic, message, true);
        } else {
            console.error("Texture to delete does not exist");
        }
    }

    _handleTextureUpdated(peer, message) {
        let params = message.texture;
        let texture = TexturesHandler.getSessionTexture(params.id);
        if(texture) {
            this._handleAssetUpdate(texture, params,
                PubSubTopics.TEXTURE_UPDATED);
        }
    }

    _handleAssetUpdate(asset, params, topic) {
        let updatedParams = [];
        for(let param in params) {
            if(param == 'id') continue;
            updatedParams.push(param);
            let capitalizedParam = capitalizeFirstLetter(param);
            if(('set' + capitalizedParam) in asset)
                asset['set' + capitalizedParam](params[param]);
            if(global.isEditor) asset.getEditorHelper().updateMenuField(param);
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
        PubSub.publish(this._id, PubSubTopics.PEER_USERNAME_UPDATED, {
            peer: peer,
        });
    }

    handlePartyStarted() {
        PubSub.publish(this._id, PubSubTopics.PARTY_ENDED);
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

    _publishInstanceAdded(instance) {
        let message = {
            topic: 'instance_added',
            instance: instance.exportParams(),
        };
        this._partyHandler.sendToAllPeers(JSON.stringify(message));
        return Promise.resolve();
    }

    _publishInstanceDeleted(instance) {
        let message = {
            topic: 'instance_deleted',
            id: instance.getId(),
            assetId: instance.getAssetId(),
        };
        this._partyHandler.sendToAllPeers(JSON.stringify(message));
        return Promise.resolve();
    }

    _publishMaterialAdded(material) {
        let message = {
            topic: 'material_added',
            material: material.exportParams(),
            type: material.getMaterialType(),
        };
        this._partyHandler.sendToAllPeers(JSON.stringify(message));
        return Promise.resolve();
    }

    _publishMaterialDeleted(material) {
        let message = {
            topic: 'material_deleted',
            id: material.getId(),
        };
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

    _publishTextureAdded(texture) {
        let message = {
            topic: 'texture_added',
            texture: texture.exportParams(),
            type: texture.getTextureType(),
        };
        this._partyHandler.sendToAllPeers(JSON.stringify(message));
        return Promise.resolve();
    }

    _publishTextureDeleted(texture) {
        let message = {
            topic: 'texture_deleted',
            id: texture.getId(),
        };
        this._partyHandler.sendToAllPeers(JSON.stringify(message));
        return Promise.resolve();
    }

    _publishAssetUpdate(updateMessage, type) {
        let asset = {};
        asset['id'] = updateMessage.asset.getId();
        for(let param of updateMessage.fields) {
            let capitalizedParam = capitalizeFirstLetter(param);
            asset[param] = updateMessage.asset['get' + capitalizedParam]();
        }
        let peerMessage = { "topic": type + "_updated" };
        peerMessage[type] = asset;
        this._partyHandler.sendToAllPeers(
            JSON.stringify(peerMessage, (k, v) => v === undefined ? null : v));
        return Promise.resolve();
    }

    addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.ASSET_ADDED, (assetId) => {
            this._publishQueue.enqueue(() => {
                return this._publishAssetAdded(assetId);
            });
        });
        PubSub.subscribe(this._id, PubSubTopics.INSTANCE_ADDED, (instance) => {
            this._publishQueue.enqueue(() => {
                return this._publishInstanceAdded(instance);
            });
        });
        PubSub.subscribe(this._id, PubSubTopics.INSTANCE_DELETED, (message) => {
            this._publishQueue.enqueue(() => {
                return this._publishInstanceDeleted(message.instance);
            });
        });
        PubSub.subscribe(this._id, PubSubTopics.INSTANCE_UPDATED, (message) => {
            this._publishQueue.enqueue(() => {
                return this._publishAssetUpdate(message, "instance");
            });
        });
        PubSub.subscribe(this._id, PubSubTopics.MATERIAL_ADDED, (material) => {
            this._publishQueue.enqueue(() => {
                return this._publishMaterialAdded(material);
            });
        });
        PubSub.subscribe(this._id, PubSubTopics.MATERIAL_DELETED, (message) => {
            this._publishQueue.enqueue(() => {
                return this._publishMaterialDeleted(message.material);
            });
        });
        PubSub.subscribe(this._id, PubSubTopics.MATERIAL_UPDATED, (message) => {
            this._publishQueue.enqueue(() => {
                return this._publishAssetUpdate(message, "material");
            });
        });
        PubSub.subscribe(this._id, PubSubTopics.SETTINGS_UPDATED, (message) => {
            this._publishQueue.enqueue(() => {
                return this._publishSettingsUpdate(message);
            });
        });
        PubSub.subscribe(this._id, PubSubTopics.TEXTURE_ADDED, (texture) => {
            this._publishQueue.enqueue(() => {
                return this._publishTextureAdded(texture);
            });
        });
        PubSub.subscribe(this._id, PubSubTopics.TEXTURE_DELETED, (message) => {
            this._publishQueue.enqueue(() => {
                return this._publishTextureDeleted(message.texture);
            });
        });
        PubSub.subscribe(this._id, PubSubTopics.TEXTURE_UPDATED, (message) => {
            this._publishQueue.enqueue(() => {
                return this._publishAssetUpdate(message, "texture");
            });
        });
    }

    removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.ASSET_ADDED);
        PubSub.unsubscribe(this._id, PubSubTopics.INSTANCE_ADDED);
        PubSub.unsubscribe(this._id, PubSubTopics.INSTANCE_DELETED);
        PubSub.unsubscribe(this._id, PubSubTopics.INSTANCE_UPDATED);
        PubSub.unsubscribe(this._id, PubSubTopics.MATERIAL_ADDED);
        PubSub.unsubscribe(this._id, PubSubTopics.MATERIAL_DELETED);
        PubSub.unsubscribe(this._id, PubSubTopics.MATERIAL_UPDATED);
        PubSub.unsubscribe(this._id, PubSubTopics.SETTINGS_UPDATED);
        PubSub.unsubscribe(this._id, PubSubTopics.TEXTURE_ADDED);
        PubSub.unsubscribe(this._id, PubSubTopics.TEXTURE_DELETED);
        PubSub.unsubscribe(this._id, PubSubTopics.TEXTURE_UPDATED);
    }

    update() {
        if(this._isPublishing || this._publishQueue.length == 0) return;
        this._isPublishing = true;
        this._publishQueue.dequeue()().then(() => this._isPublishing = false);
    }
}

let partyMessageHelper = new PartyMessageHelper();
export default partyMessageHelper;

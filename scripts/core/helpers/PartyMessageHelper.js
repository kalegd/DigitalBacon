/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PeerController from '/scripts/core/assets/PeerController.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import MaterialsHandler from '/scripts/core/handlers/MaterialsHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import TexturesHandler from '/scripts/core/handlers/TexturesHandler.js';
import { uuidv4, capitalizeFirstLetter } from '/scripts/core/helpers/utils.module.js';


class PartyMessageHelper {
    constructor() {
        this._id = uuidv4();
    }

    init(PartyHandler) {
        this._partyHandler = PartyHandler;
        this._partyHandler.addMessageHandlers({
            avatar: (p, m) => { this._handleAvatar(p, m); },
            instance_added: (p, m) => { this._handleInstanceAdded(p, m); },
            instance_deleted: (p, m) => { this._handleInstanceDeleted(p, m); },
            instance_updated: (p, m) => { this._handleInstanceUpdated(p, m); },
            material_added: (p, m) => { this._handleMaterialAdded(p, m); },
            material_deleted: (p, m) => { this._handleMaterialDeleted(p, m); },
            material_updated: (p, m) => { this._handleMaterialUpdated(p, m); },
            texture_updated: (p, m) => { this._handleTextureUpdated(p, m); },
        });
    }

    _handleAvatar(peer, message) {
        if(peer.controller) {
            peer.controller.updateAvatar(message.url);
        } else {
            peer.controller = new PeerController({ URL: message.url });
            peer.controller.addToScene(global.scene);
        }
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

    _handleInstanceUpdated(peer, message) {
        let params = message.instance;
        let instance = ProjectHandler.getSessionInstance(params.id);
        if(instance) {
            this._handleAssetUpdate(instance, params,
                PubSubTopics.INSTANCE_UPDATED);
        }
    }

    _handleMaterialUpdated(peer, message) {
        let params = message.material;
        let material = MaterialsHandler.getMaterial(params.id);
        if(material) {
            this._handleAssetUpdate(material, params,
                PubSubTopics.MATERIAL_UPDATED);
        }
    }

    _handleTextureUpdated(peer, message) {
        let params = message.texture;
        let texture = TexturesHandler.getTexture(params.id);
        if(texture) {
            this._handleAssetUpdate(texture, params,
                PubSubTopics.TEXTURE_UPDATED);
        }
    }

    _publishInstanceAdded(instance) {
        let message = {
            topic: "instance_added",
            instance: instance.exportParams(),
        };
        this._partyHandler.sendToAllPeers(JSON.stringify(message));
    }

    _publishInstanceDeleted(instance) {
        let message = {
            topic: "instance_deleted",
            id: instance.getId(),
            assetId: instance.getAssetId(),
        };
        this._partyHandler.sendToAllPeers(JSON.stringify(message));
    }

    _publishMaterialAdded(material) {
        let message = {
            topic: "material_added",
            material: material.exportParams(),
            type: material.getMaterialType(),
        };
        this._partyHandler.sendToAllPeers(JSON.stringify(message));
    }

    _publishMaterialDeleted(material) {
        let message = {
            topic: "material_deleted",
            id: material.getId(),
        };
        this._partyHandler.sendToAllPeers(JSON.stringify(message));
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
    }

    addSubscriptions() {
        PubSub.subscribe(this._id, PubSubTopics.INSTANCE_ADDED, (instance) => {
            this._publishInstanceAdded(instance);
        });
        PubSub.subscribe(this._id, PubSubTopics.INSTANCE_DELETED, (message) => {
            this._publishInstanceDeleted(message.instance);
        });
        PubSub.subscribe(this._id, PubSubTopics.INSTANCE_UPDATED, (message) => {
            this._publishAssetUpdate(message, "instance");
        });
        PubSub.subscribe(this._id, PubSubTopics.MATERIAL_ADDED, (material) => {
            this._publishMaterialAdded(material);
        });
        PubSub.subscribe(this._id, PubSubTopics.MATERIAL_DELETED, (message) => {
            this._publishMaterialDeleted(message.material);
        });
        PubSub.subscribe(this._id, PubSubTopics.MATERIAL_UPDATED, (message) => {
            this._publishAssetUpdate(message, "material");
        });
        PubSub.subscribe(this._id, PubSubTopics.TEXTURE_UPDATED, (message) => {
            this._publishAssetUpdate(message, "texture");
        });
    }

    removeSubscriptions() {
        PubSub.unsubscribe(this._id, PubSubTopics.INSTANCE_ADDED);
        PubSub.unsubscribe(this._id, PubSubTopics.INSTANCE_DELETED);
        PubSub.unsubscribe(this._id, PubSubTopics.INSTANCE_UPDATED);
        PubSub.unsubscribe(this._id, PubSubTopics.MATERIAL_UPDATED);
        PubSub.unsubscribe(this._id, PubSubTopics.TEXTURE_UPDATED);
    }
}

let partyMessageHelper = new PartyMessageHelper();
export default partyMessageHelper;

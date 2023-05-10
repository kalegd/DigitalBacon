/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import * as THREE from 'three';

const SHOULD_HAVE_REFACTORED_SOONER = {
    BASIC: '95f63d4b-06d1-4211-912b-556b6ce7bf5f',
    CUBE: '8f95c544-ff6a-42d3-b1e7-03a1e772b3b2',
};

class TexturesHandler {
    constructor() {
        this._textures = {};
        this._textureClassMap = {};
        this._sessionTextures = {};
    }

    addNewTexture(assetId, params, ignoreUndoRedo, ignorePublish) {
        let texture = new this._textureClassMap[assetId](params);
        this.addTexture(texture, ignoreUndoRedo, ignorePublish);
        return texture;
    }

    addTexture(texture, ignoreUndoRedo, ignorePublish) {
        if(this._textures[texture.getId()]) return;
        this._textures[texture.getId()] = texture;
        this._sessionTextures[texture.getId()] = texture;
        if(global.isEditor) EditorHelperFactory.addEditorHelperTo(texture);
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.deleteTexture(texture, true, ignorePublish);
            }, () => {
                this.addTexture(texture, true, ignorePublish);
            });
        }
        if(!ignorePublish)
            PubSub.publish(this._id, PubSubTopics.TEXTURE_ADDED, texture);
    }

    deleteTexture(texture, ignoreUndoRedo, ignorePublish) {
        if(!(texture.getId() in this._textures)) return;
        let undoRedoAction;
        if(!ignoreUndoRedo) {
            undoRedoAction = UndoRedoHandler.addAction(() => {
                this.addTexture(texture, true, ignorePublish);
            }, () => {
                this.deleteTexture(texture, true, ignorePublish);
            });
        }
        texture.dispose();
        delete this._textures[texture.getId()];
        if(ignorePublish) return;
        PubSub.publish(this._id, PubSubTopics.TEXTURE_DELETED, {
            texture: texture,
            undoRedoAction: undoRedoAction,
        });
    }

    load(textures, isDiff) {
        if(!textures) return;
        this._handleOldVersion(textures);
        if(isDiff) {
            let texturesToDelete = [];
            for(let id in this._textures) {
                let texture = this._textures[id];
                let assetId = texture.getAssetId();
                if(!(assetId in textures)
                        || !textures[assetId].some(p => p.id == id))
                    texturesToDelete.push(texture);
            }
            for(let texture of texturesToDelete) {
                this.deleteTexture(texture, true, true);
            }
        }
        for(let assetId in textures) {
            if(!(assetId in this._textureClassMap)) {
                console.error("Unrecognized texture found");
                continue;
            }
            for(let params of textures[assetId]) {
                if(isDiff && this._textures[params.id]) {
                    this._textures[params.id].updateFromParams(params);
                } else {
                    this.addNewTexture(assetId, params, true, true);
                }
            }
        }
    }

    _handleOldVersion(textures) {
        let usingOldVersion = false;
        for(let type in SHOULD_HAVE_REFACTORED_SOONER) {
            if(type in textures) {
                let id = SHOULD_HAVE_REFACTORED_SOONER[type];
                textures[id] = textures[type];
                delete textures[type];
                usingOldVersion = true;
            }
        }
        if(usingOldVersion) {
            PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                text: "The project's version is outdated and won't be supported starting in July. Please save a new copy of it",
            });
        }
    }

    registerTexture(textureClass) {
        this._textureClassMap[textureClass.assetId] = textureClass;
    }

    getTextures() {
        return this._textures;
    }

    getTexture(textureId) {
        return this._textures[textureId];
    }

    getTextureClasses() {
        return Object.values(this._textureClassMap);
    }

    getSessionTexture(id) {
        return this._sessionTextures[id];
    }

    getTextureName(textureId) {
        if(textureId in this._textures)
            return this._textures[textureId].getName();
        return null;
    }

    getType(textureId) {
        return this._textures[textureId].getTextureType();
    }

    reset() {
        this._textures = {};
        this._sessionTextures = {};
    }

    getTexturesAssetIds() {
        let assetIds = new Set();
        for(let textureId in this._textures) {
            let texture = this._textures[textureId];
            let textureAssetIds = texture.getAssetIds();
            for(let assetId of textureAssetIds) {
                assetIds.add(assetId);
            }
        }
        return assetIds;
    }

    getTexturesDetails() {
        let texturesDetails = {};
        for(let textureId in this._textures) {
            let texture = this._textures[textureId];
            let assetId = texture.getAssetId();
            let params = texture.exportParams();
            if(!(assetId in texturesDetails)) texturesDetails[assetId] = [];
            texturesDetails[assetId].push(params);
        }
        return texturesDetails;
    }
}

let texturesHandler = new TexturesHandler();
export default texturesHandler;

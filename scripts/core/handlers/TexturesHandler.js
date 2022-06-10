/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

class TexturesHandler {
    constructor() {
        this._textures = {};
        this._textureClassMap = {};
    }

    addTexture(type, params, ignoreUndoRedo) {
        let texture = new this._textureClassMap[type](params);
        this._addTexture(texture, ignoreUndoRedo);
        return texture;
    }

    _addTexture(texture, ignoreUndoRedo) {
        this._textures[texture.getId()] = texture;
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.deleteTexture(texture, true);
            }, () => {
                this._addTexture(texture, true);
            });
        }
        PubSub.publish(this._id, PubSubTopics.TEXTURE_ADDED, texture);
    }

    deleteTexture(texture, ignoreUndoRedo) {
        let undoRedoAction;
        if(!ignoreUndoRedo) {
            undoRedoAction = UndoRedoHandler.addAction(() => {
                this._addTexture(texture, true);
            }, () => {
                this.deleteTexture(texture, true);
            });
        }
        texture.dispose();
        delete this._textures[texture.getId()];
        PubSub.publish(this._id, PubSubTopics.TEXTURE_DELETED, {
            texture: texture,
            undoRedoAction: undoRedoAction,
        });
    }

    load(textures) {
        if(!textures) return;
        for(let textureType in textures) {
            if(!(textureType in this._textureClassMap)) {
                console.error("Unrecognized texture found");
                continue;
            }
            for(let params of textures[textureType]) {
                this.addTexture(textureType, params, true);
            }
        }
    }

    registerTexture(textureClass, textureType) {
        this._textureClassMap[textureType] = textureClass;
    }

    getTextures() {
        return this._textures;
    }

    getTexture(textureId) {
        return this._textures[textureId];
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
            let type = texture.getTextureType();
            let params = texture.exportParams();
            if(!(type in texturesDetails)) texturesDetails[type] = [];
            texturesDetails[type].push(params);
        }
        return texturesDetails;
    }
}

let texturesHandler = new TexturesHandler();
export default texturesHandler;

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

class TexturesHandler {
    constructor() {
        this._textures = {};
        this._textureClassMap = {};
        this._sessionTextures = {};
    }

    addNewTexture(type, params, ignoreUndoRedo, ignorePublish) {
        let texture = new this._textureClassMap[type](params);
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

    load(textures) {
        if(!textures) return;
        for(let textureType in textures) {
            if(!(textureType in this._textureClassMap)) {
                console.error("Unrecognized texture found");
                continue;
            }
            for(let params of textures[textureType]) {
                this.addNewTexture(textureType, params, true, true);
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

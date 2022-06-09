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
import * as THREE from 'three';

const FIELDS = [];

export default class Texture {
    constructor(params = {}) {
        this._id = params['id'] || uuidv4();
        this._name = ('name' in params)
            ? params['name']
            : this._getDefaultName();
    }

    _getDefaultName() {
        console.error("Texture._getDefaultName() should be overridden");
        return;
    }

    _createTexture() {
        console.error("Texture._createTexture() should be overridden");
        return;
    }

    _updateEnum(param, newValue, ignoreUndoRedo, ignorePublish) {
        let oldValue = this._texture[param];
        if(oldValue == newValue) return;

        this._texture[param] = newValue;
        this['_' + param] = newValue;
        this._updateTexture();

        if(!ignorePublish)
            PubSub.publish(this._id, PubSubTopics.TEXTURE_UPDATED, this);
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this._updateEnum(param, oldValue, true, ignorePublish);
                this._updateMenuField(param);
            }, () => {
                this._updateEnum(param, newValue, true, ignorePublish);
                this._updateMenuField(param);
            });
        }
    }

    _updateMenuField(param) {
        if(!this._menuFields) return;
        let menuField = this._menuFieldsMap[param];
        if(menuField) menuField.updateFromSource();
    }

    exportParams() {
        return {
            "id": this._id,
            "name": this._name,
        };
    }

    setFromParams(params) {
        console.warn("Unexpectedly trying to setFromParams() for Texture...");
        //PubSub.publish(this._id, PubSubTopics.TEXTURE_UPDATED, this);
    }

    getMenuFields(fields) {
        if(this._menuFields) return this._menuFields;

        this._menuFieldsMap = this._getMenuFieldsMap();
        let menuFields = [];
        for(let field of fields) {
            if(field.parameter in this._menuFieldsMap) {
                menuFields.push(this._menuFieldsMap[field.parameter]);
            }
        }
        this._menuFields = menuFields;
        return menuFields;
    }

    _getMenuFieldsMap() {
        let menuFieldsMap = {};
        return menuFieldsMap;
    }

    _updateTexture() {
        let oldTexture = this._texture;
        this._createTexture();
        setTimeout(() => {
            oldTexture.dispose();
        }, 20);
    }

    dispose() {
        setTimeout(() => {
            this._texture.dispose();
        }, 20);
    }

    getTexture() {
        return this._texture;
    }

    getPreviewTexture() {
        return this._texture;
    }

    getAssetIds() {
        console.error("Texture.getAssetIds() should be overridden");
        return;
    }

    getTextureType() {
        console.error("Texture.getTextureType() should be overridden");
        return;
    }

    getId() {
        return this._id;
    }

    getName() {
        return this._name;
    }

    setName(newName, isUndoRedo) {
        if(!newName || this._name == newName) return;
        let oldName = this._name;
        this._name = newName;
        PubSub.publish(this._id, PubSubTopics.TEXTURE_UPDATED, this);
        if(!isUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this.setName(oldName, true);
            }, () => {
                this.setName(newName, true);
            });
        }
    }
}

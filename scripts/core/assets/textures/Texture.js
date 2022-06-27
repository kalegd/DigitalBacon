/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';

export default class Texture {
    constructor(params = {}) {
        this._id = params['id'] || uuidv4();
        this._name = ('name' in params)
            ? params['name']
            : this._getDefaultName();
        if(global.isEditor) this._createEditorHelper();
    }

    _createEditorHelper() {
        console.error("Texture._createEditorHelper() should be overridden");
        return;
    }

    _getDefaultName() {
        console.error("Texture._getDefaultName() should be overridden");
        return;
    }

    _createTexture() {
        console.error("Texture._createTexture() should be overridden");
        return;
    }

    exportParams() {
        return {
            "id": this._id,
            "name": this._name,
        };
    }

    setFromParams(params) {
        console.warn("Unexpectedly trying to setFromParams() for Texture...");
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

    getEditorHelper() {
        return this._editorHelper;
    }

    getName() {
        return this._name;
    }

    setName(name) {
        if(name == null || this._name == name) return;
        this._name = name;
    }
}

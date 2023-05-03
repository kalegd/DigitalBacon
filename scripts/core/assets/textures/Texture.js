/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import global from '/scripts/core/global.js';
import Asset from '/scripts/core/assets/Asset.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import { uuidv4 } from '/scripts/core/helpers/utils.module.js';

export default class Texture extends Asset {
    constructor(params = {}) {
        super(params);
    }

    _getDefaultName() {
        return 'Texture';
    }

    _createTexture() {
        console.error("Texture._createTexture() should be overridden");
        return;
    }

    exportParams() {
        return super.exportParams();
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

    static getAssetType() {
        return AssetTypes.TEXTURE;
    }
}

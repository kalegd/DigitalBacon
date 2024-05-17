/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Asset from '/scripts/core/assets/Asset.js';
import AssetTypes from '/scripts/core/enums/AssetTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { stringOr } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

export default class Texture extends Asset {
    constructor(params = {}) {
        super(params);
        this._colorSpace = stringOr(params['colorSpace'], THREE.SRGBColorSpace);
    }

    _getDefaultName() {
        return 'Texture';
    }

    _createTexture() {
        console.error("Texture._createTexture() should be overridden");
        return;
    }

    exportParams() {
        let params = super.exportParams();
        params['colorSpace'] = this._colorSpace;
        return params;
    }

    _updateTexture() {
        let oldTexture = this._texture;
        this._createTexture();
        setTimeout(() => {
            oldTexture.dispose();
        }, 20);
        PubSub.publish(this._id, PubSubTopics.TEXTURE_RECREATED + ':'+this._id);
    }

    dispose() {
        setTimeout(() => {
            this._texture.dispose();
        }, 20);
    }

    get colorSpace() { return this._colorSpace; }
    get texture() { return this._texture; }
    get previewTexture() { return this._texture; }
    get assetIds() {
        console.error("get Texture.assetIds should be overridden");
        return [];
    }
    get textureType() {
        console.error("get Texture.textureType should be overridden");
        return null;
    }

    set colorSpace(colorSpace) {
        this._colorSpace = colorSpace;
        this._texture.colorSpace = colorSpace;
        this._updateTexture();
    }

    static assetType = AssetTypes.TEXTURE;
}

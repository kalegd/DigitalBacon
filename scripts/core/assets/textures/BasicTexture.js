/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Texture from '/scripts/core/assets/textures/Texture.js';
import TextureTypes from '/scripts/core/enums/TextureTypes.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import { Textures } from '/scripts/core/helpers/constants.js';
import * as THREE from 'three';

export default class BasicTexture extends Texture {
    constructor(params = {}) {
        params['assetId'] = BasicTexture.assetId;
        super(params);
        this._image = params['image'];
        this._wrapS = params['wrapS'] || THREE.ClampToEdgeWrapping;
        this._wrapT = params['wrapT'] || THREE.ClampToEdgeWrapping;
        this._repeat = params['repeat'] || [1, 1];
        this._offset = params['offset'] || [0, 0];
        this._createTexture();
    }

    _getDefaultName() {
        return BasicTexture.assetName;
    }

    _createTexture() {
        if(this._image) {
            this._texture = LibraryHandler.cloneTexture(this._image);
        } else {
            this._texture = Textures.blackPixel.clone();
        }
        this._texture.wrapS = this._wrapS;
        this._texture.wrapT = this._wrapT;
        this._texture.repeat.fromArray(this._repeat);
        this._texture.offset.fromArray(this._offset);
        this._texture.needsUpdate = true;
        this._texture.colorSpace = this._colorSpace;
    }

    exportParams() {
        let params = super.exportParams();
        params['image'] = this._image;
        params['wrapS'] = this._texture.wrapS;
        params['wrapT'] = this._texture.wrapT;
        params['repeat'] = this._texture.repeat.toArray();
        params['offset'] = this._offset;
        return params;
    }

    get assetIds() {
        if(this._image) return [this._image];
        return [];
    }

    get image() { return this._image; }
    get offset() { return this._offset; }
    get repeat() { return this._repeat; }

    get textureType() {
        return BasicTexture.textureType;
    }

    get wrapS() { return this._wrapS; }
    get wrapT() { return this._wrapT; }

    set image(image) {
        if(this._image == image) return;
        this._image = image;
        this._updateTexture();
    }

    set offset(offset) {
        this._offset = offset;
        this._texture.offset.fromArray(offset);
    }

    set repeat(repeat) {
        this._repeat = repeat;
        this._texture.repeat.fromArray(repeat);
    }

    set wrapS(wrapS) {
        if(this._wrapS == wrapS) return;
        this._wrapS = wrapS;
        this._texture.wrapS = wrapS;
        this._texture.needsUpdate = true;
    }

    set wrapT(wrapT) {
        if(this._wrapT == wrapT) return;
        this._wrapT = wrapT;
        this._texture.wrapT = wrapT;
        this._texture.needsUpdate = true;
    }

    static assetId = '95f63d4b-06d1-4211-912b-556b6ce7bf5f';
    static assetName = 'Basic Texture';
    static textureType = TextureTypes.BASIC;
}

ProjectHandler.registerAsset(BasicTexture);
LibraryHandler.loadBuiltIn(BasicTexture);

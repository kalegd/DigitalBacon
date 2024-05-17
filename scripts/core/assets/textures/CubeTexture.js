/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Texture from '/scripts/core/assets/textures/Texture.js';
import CubeSides from '/scripts/core/enums/CubeSides.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import TextureTypes from '/scripts/core/enums/TextureTypes.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Textures } from '/scripts/core/helpers/constants.js';
import * as THREE from 'three';

export default class CubeTexture extends Texture {
    constructor(params = {}) {
        params['assetId'] = CubeTexture.assetId;
        super(params);
        this._images = params['images'] || [...new Array(6)];
        this._mapping = params['mapping'] || THREE.CubeReflectionMapping;
        this._createTexture();
    }

    _getDefaultName() {
        return CubeTexture.assetName;
    }

    _createTexture() {
        let images = this._images.map((imageId) => (imageId)
            ? LibraryHandler.getImage(imageId)
            : Textures.blackPixel.image
        );
        //textures must be square, same size, and power of 2, otherwise
        //use no images
        if(!this._validateImageList(images))
            images = Array(6).fill(Textures.blackPixel.image);
        this._texture = new THREE.CubeTexture(images, this._mapping);
        this._texture.needsUpdate = true;
        this._texture.colorSpace = this._colorSpace;
    }

    _validateImageList(images) {
        let width;
        let isValid = true;
        for(let image of images) {
            if(image == Textures.blackPixel.image) {
                isValid = false;
                continue;
            } else if(image.width != image.height) {
                PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                    text: 'Images must be of same width and height',
                    sustainTime: 3,
                });
                return false;
            } else if(!powerOf2(image.width)) {
                PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                    text: 'Image lengths must be a power of 2',
                    sustainTime: 3,
                });
                return false;
            } else if(width && image.width != width) {
                PubSub.publish(this._id, PubSubTopics.MENU_NOTIFICATION, {
                    text: 'All images must be the same size',
                    sustainTime: 3,
                });
                return false;
            }
            width = image.width;
        }
        return isValid;
    }

    exportParams() {
        let params = super.exportParams();
        params['images'] = this._images;
        params['mapping'] = this._texture.mapping;
        return params;
    }

    get assetIds() {
        let assetIds = [];
        for(let imageId of this._images) {
            if(imageId) assetIds.push(imageId);
        }
        return assetIds;
    }

    get images() { return [...this._images]; }
    get mapping() { return this._mapping; }

    get previewTexture() {
        let imageId = this._images[CubeSides.FRONT];
        if(imageId) return LibraryHandler.getTexture(imageId);
        return Textures.blackPixel;
    }

    get textureType() {
        return CubeTexture.textureType;
    }


    set images(images) {
        let hasDiff = false;
        for(let s in this._images) {
            if(this._images[s] != images[s]) {
                this._images[s] = images[s];
                hasDiff = true;
            }
        }
        if(hasDiff) this._updateTexture();
    }

    set mapping(mapping) {
        if(this._mapping == mapping) return;
        this._mapping = mapping;
        this._updateTexture();
    }

    static assetId = '8f95c544-ff6a-42d3-b1e7-03a1e772b3b2';
    static assetName = 'Cube Texture';
    static textureType = TextureTypes.CUBE;
}

//https://stackoverflow.com/a/30924333
function powerOf2(v) {
    return v && !(v & (v - 1));
}

ProjectHandler.registerAsset(CubeTexture);
LibraryHandler.loadBuiltIn(CubeTexture);

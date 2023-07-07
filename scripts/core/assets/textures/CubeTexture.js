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
        this._images = params['images'] || {};
        this._mapping = params['mapping'] || THREE.CubeReflectionMapping;
        this._createTexture();
    }

    _getDefaultName() {
        return CubeTexture.assetName;
    }

    _createTexture() {
        let images = [
            this._getImageFromSide(CubeSides.RIGHT),
            this._getImageFromSide(CubeSides.LEFT),
            this._getImageFromSide(CubeSides.TOP),
            this._getImageFromSide(CubeSides.BOTTOM),
            this._getImageFromSide(CubeSides.FRONT),
            this._getImageFromSide(CubeSides.BACK),
        ];
        //textures must be square, same size, and power of 2, otherwise
        //use no images
        if(!this._validateImageList(images))
            images = Array(6).fill(Textures.blackPixel.image);
        this._texture = new THREE.CubeTexture(images, this._mapping);
        this._texture.needsUpdate = true;
        this._texture.colorSpace = this._colorSpace;
    }

    _getImageFromSide(side) {
        if(this._images[side]) {
            return LibraryHandler.getImage(this._images[side]);
        }
        return Textures.blackPixel.image;
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

    getPreviewTexture() {
        let imageId = this._images[CubeSides.FRONT];
        if(imageId) return LibraryHandler.getTexture(imageId);
        return Textures.blackPixel;
    }

    getAssetIds() {
        let assetIds = [];
        for(let side in CubeSides) {
            if(this._images[side]) assetIds.push(this._images[side]);
        }
        return assetIds;
    }

    getTextureType() {
        return CubeTexture.textureType;
    }

    exportParams() {
        let params = super.exportParams();
        params['images'] = this._images;
        params['mapping'] = this._texture.mapping;
        return params;
    }

    getImages() {
        return this._images;
    }

    getMapping() {
        return this._mapping;
    }

    setImages(images, side) {
        if(side) {
            if(this._images[side] == images) return;
            this._images[side] = images;
            this._updateTexture();
        } else {
            let hasDiff = false;
            for(let s in this._images) {
                if(this._images[s] != images[s]) {
                    this._images[s] = images[s];
                    hasDiff = true;
                }
            }
            if(hasDiff) this._updateTexture();
        }
    }

    setMapping(mapping) {
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

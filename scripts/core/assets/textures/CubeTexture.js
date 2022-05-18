/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Texture from '/scripts/core/assets/textures/Texture.js';
import CubeSides from '/scripts/core/enums/CubeSides.js';
import TextureTypes from '/scripts/core/enums/TextureTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Textures, MAPPING_MAP, REVERSE_MAPPING_MAP } from '/scripts/core/helpers/constants.js';
import CubeImageInput from '/scripts/core/menu/input/CubeImageInput.js';
import EnumInput from '/scripts/core/menu/input/EnumInput.js';
import * as THREE from 'three';

const FIELDS = [
    { "name": "Images", "type": CubeImageInput },
    { "name": "Mapping", "parameter": "mapping", "type": EnumInput,
        "options": [ "Reflection", "Refraction" ], "map": MAPPING_MAP,
        "reverseMap": REVERSE_MAPPING_MAP },
];

export default class CubeTexture extends Texture {
    constructor(params = {}) {
        super(params);
        this._images = params['images'] || {};
        this._mapping = params['mapping'] || THREE.CubeReflectionMapping;
        this._createTexture();
    }

    _getDefaultName() {
        return "Cube Texture";
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

    _updateImage(side, assetId) {
        if(assetId == this._images[side]) return;
        this._wrapS = this._texture.wrapS;
        this._wrapT = this._texture.wrapT;
        this._repeatX = this._texture.repeat.x;
        this._repeatY = this._texture.repeat.y;
        this._offsetX = this._texture.offset.x;
        this._offsetY = this._texture.offset.y;
        this._images[side] = assetId;
        this._updateTexture();
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
        return TextureTypes.CUBE;
    }

    exportParams() {
        let params = super.exportParams();
        params['images'] = this._images;
        params['mapping'] = this._texture.mapping;
        return params;
    }

    getMenuFields() {
        return super.getMenuFields(FIELDS);
    }

    _getMenuFieldsMap() {
        let menuFieldsMap = super._getMenuFieldsMap();
        for(let field of FIELDS) {
            if(field.name in menuFieldsMap) {
                continue;
            } else if(field.type == CubeImageInput) {
                menuFieldsMap[field.name] = new CubeImageInput({
                    'initialValue': this._images,
                    'getFromSource': () => { return this._images; },
                    'setToSource': (s, v) => { this._updateImage(s, v); },
                });
            } else if(field.type == EnumInput) {
                menuFieldsMap[field.name] = new EnumInput({
                    'title': field.name,
                    'options': field.options,
                    'initialValue':
                        field.reverseMap[this._texture[field.parameter]],
                    'getFromSource': () => {
                        return field.reverseMap[this._texture[
                            field.parameter]];
                    },
                    'setToSource': (v) => {
                        this._updateEnum(field.parameter, v, field.map);
                        this._updateTexture();
                    },
                });
            }
        }
        return menuFieldsMap;
    }
}

//https://stackoverflow.com/a/30924333
function powerOf2(v) {
    return v && !(v & (v - 1));
}

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Texture from '/scripts/core/assets/textures/Texture.js';
import TextureTypes from '/scripts/core/enums/TextureTypes.js';
import PubSubTopics from '/scripts/core/enums/PubSubTopics.js';
import LibraryHandler from '/scripts/core/handlers/LibraryHandler.js';
import PubSub from '/scripts/core/handlers/PubSub.js';
import { Textures, WRAP_MAP, REVERSE_WRAP_MAP } from '/scripts/core/helpers/constants.js';
import EnumInput from '/scripts/core/menu/input/EnumInput.js';
import ImageInput from '/scripts/core/menu/input/ImageInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import * as THREE from 'three';

const FIELDS = [
    { "name": "Image", "type": ImageInput },
    { "name": "Horizontal Wrapping", "parameter": "wrapS", "type": EnumInput,
        "options": [ "Clamp", "Repeat", "Mirrored"], "map": WRAP_MAP,
        "reverseMap": REVERSE_WRAP_MAP },
    { "name": "Vertical Wrapping", "parameter": "wrapT", "type": EnumInput,
        "options": [ "Clamp", "Repeat", "Mirrored"], "map": WRAP_MAP,
        "reverseMap": REVERSE_WRAP_MAP },
    { "name": "Horizontal Repeat", "parameter": "repeat", "parameter2": "x",
        "type": NumberInput },
    { "name": "Vertical Repeat", "parameter": "repeat", "parameter2": "y",
        "type": NumberInput },
    { "name": "Horizontal Offset", "parameter": "offset", "parameter2": "x",
        "min": 0, "max": 1, "type": NumberInput },
    { "name": "Vertical Offset", "parameter": "offset", "parameter2": "y",
        "min": 0, "max": 1, "type": NumberInput },
];

export default class BasicTexture extends Texture {
    constructor(params = {}) {
        super(params);
        this._image = params['image'];
        this._wrapS = params['wrapS'] || THREE.ClampToEdgeWrapping;
        this._wrapT = params['wrapT'] || THREE.ClampToEdgeWrapping;
        this._repeatX = params['repeatX'] || 1;
        this._repeatY = params['repeatY'] || 1;
        this._offsetX = params['offsetX'] || 0;
        this._offsetY = params['offsetY'] || 0;
        this._createTexture();
    }

    _getDefaultName() {
        return "Texture";
    }

    _createTexture() {
        if(this._image) {
            this._texture = LibraryHandler.cloneTexture(this._image);
        } else {
            this._texture = Textures.blackPixel.clone();
        }
        this._texture.wrapS = this._wrapS;
        this._texture.wrapT = this._wrapT;
        this._texture.repeat.x = this._repeatX;
        this._texture.repeat.y = this._repeatY;
        this._texture.offset.x = this._offsetX;
        this._texture.offset.y = this._offsetY;
        this._texture.needsUpdate = true;
    }

    _updateImage(assetId) {
        if(assetId == this._image) return;
        this._wrapS = this._texture.wrapS;
        this._wrapT = this._texture.wrapT;
        this._repeatX = this._texture.repeat.x;
        this._repeatY = this._texture.repeat.y;
        this._offsetX = this._texture.offset.x;
        this._offsetY = this._texture.offset.y;
        this._image = assetId;
        this._updateTexture();
    }

    getAssetIds() {
        if(this._image) return [this._image];
        return [];
    }

    getTextureType() {
        return TextureTypes.BASIC;
    }

    exportParams() {
        let params = super.exportParams();
        params['image'] = this._image;
        params['wrapS'] = this._texture.wrapS;
        params['wrapT'] = this._texture.wrapT;
        params['repeatX'] = this._texture.repeat.x;
        params['repeatY'] = this._texture.repeat.y;
        params['offsetX'] = this._texture.offset.x;
        params['offsetY'] = this._texture.offset.y;
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
            } else if(field.type == ImageInput) {
                menuFieldsMap[field.name] = new ImageInput({
                    'title': field.name,
                    'initialValue': this._image,
                    'getFromSource': () => { return this._image; },
                    'setToSource': (v) => { this._updateImage(v); },
                });
            } else if(field.type == NumberInput) {
                menuFieldsMap[field.name] = new NumberInput({
                    'title': field.name,
                    'initialValue':
                        this._texture[field.parameter][field.parameter2],
                    'getFromSource': () => {
                        return this._texture[field.parameter][field.parameter2];
                    },
                    'setToSource': (v) => {
                        this._texture[field.parameter][field.parameter2] = v;
                        this['_' + field.parameter +
                            field.parameter2.toUpperCase()] = v
                    },
                    'minValue': field.min,
                    'maxValue': field.max,
                });
            } else if(field.type == EnumInput) {
                menuFieldsMap[field.name] = new EnumInput({
                    'title': field.name,
                    'initialValue':
                        field.reverseMap[this._texture[field.parameter]],
                    'getFromSource': () => {
                        return field.reverseMap[this._texture[field.parameter]];
                    },
                    'setToSource': (v) => {
                        this._updateEnum(field.parameter, v, field.map);
                    },
                    'options': field.options,
                });
            }
        }
        return menuFieldsMap;
    }
}

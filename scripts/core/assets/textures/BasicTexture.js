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
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import { Textures, WRAP_MAP, REVERSE_WRAP_MAP } from '/scripts/core/helpers/constants.js';
import { numberOr } from '/scripts/core/helpers/utils.module.js';
import EnumInput from '/scripts/core/menu/input/EnumInput.js';
import ImageInput from '/scripts/core/menu/input/ImageInput.js';
import Vector2Input from '/scripts/core/menu/input/Vector2Input.js';
import * as THREE from 'three';

const FIELDS = [
    { "parameter": "image", "name": "Image", "type": ImageInput },
    { "parameter": "wrapS", "name": "Horizontal Wrapping", "type": EnumInput,
        "options": [ "Clamp", "Repeat", "Mirrored"], "map": WRAP_MAP,
        "reverseMap": REVERSE_WRAP_MAP },
    { "parameter": "wrapT", "name": "Vertical Wrapping", "type": EnumInput,
        "options": [ "Clamp", "Repeat", "Mirrored"], "map": WRAP_MAP,
        "reverseMap": REVERSE_WRAP_MAP },
    { "parameter": "repeat", "name": "Repeat", "type": Vector2Input },
    { "parameter": "offset", "name": "Offset", "type": Vector2Input },
];

export default class BasicTexture extends Texture {
    constructor(params = {}) {
        super(params);
        this._image = params['image'];
        this._wrapS = params['wrapS'] || THREE.ClampToEdgeWrapping;
        this._wrapT = params['wrapT'] || THREE.ClampToEdgeWrapping;
        this._repeat = params['repeat'] || [1, 1];
        this._offset = params['offset'] || [0, 0];
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
        this._texture.repeat.fromArray(this._repeat);
        this._texture.offset.fromArray(this._offset);
        this._texture.needsUpdate = true;
    }

    _updateImage(newValue, ignoreUndoRedo, ignorePublish) {
        let oldValue = this._image;
        if(oldValue == newValue) return;
        this._wrapS = this._texture.wrapS;
        this._wrapT = this._texture.wrapT;
        this._texture.repeat.fromArray(this._repeat);
        this._texture.offset.fromArray(this._offset);
        this._image = newValue;
        this._updateTexture();
        if(!ignorePublish)
            PubSub.publish(this._id, PubSubTopics.TEXTURE_UPDATED, this);
        if(!ignoreUndoRedo) {
            UndoRedoHandler.addAction(() => {
                this._updateImage(oldValue, true, ignorePublish);
                this._updateMenuField('image');
            }, () => {
                this._updateImage(newValue, true, ignorePublish);
                this._updateMenuField('image');
            });
        }
    }

    _updateVector2(param, oldValue, newValue, ignoreUndoRedo, ignorePublish)
    {
        let currentValue = this['_' + param];
        if(!currentValue.reduce((a, v, i) => a && newValue[i] == v, true)) {
            this._texture[param].fromArray(newValue);
            this['_' + param] = newValue;
            if(!ignorePublish)
                PubSub.publish(this._id, PubSubTopics.TEXTURE_UPDATED, this);
        }
        if(!ignoreUndoRedo && !oldValue
                .reduce((a,v,i) => a && newValue[i] == v,true))
        {
            UndoRedoHandler.addAction(() => {
                this._updateVector2(param, null, oldValue, true, ignorePublish);
                this._updateMenuField(param);
            }, () => {
                this._updateVector2(param, null, newValue, true, ignorePublish);
                this._updateMenuField(param);
            });
        }
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
        params['repeat'] = this._texture.repeat.toArray();
        params['offset'] = this._texture.offset.toArray();
        return params;
    }

    getMenuFields() {
        return super.getMenuFields(FIELDS);
    }

    _getMenuFieldsMap() {
        let menuFieldsMap = super._getMenuFieldsMap();
        for(let field of FIELDS) {
            if(field.parameter in menuFieldsMap) {
                continue;
            } else if(field.type == ImageInput) {
                menuFieldsMap[field.parameter] = new ImageInput({
                    'title': field.name,
                    'initialValue': this._image,
                    'getFromSource': () => { return this._image; },
                    'onUpdate': (v) => { this._updateImage(v); },
                });
            } else if(field.type == Vector2Input) {
                menuFieldsMap[field.parameter] = new Vector2Input({
                    'title': field.name,
                    'initialValue': this._texture[field.parameter].toArray(),
                    'onBlur': (oldValue, newValue) => {
                        this._updateVector2(field.parameter, oldValue,newValue);
                    },
                    'onUpdate': (newValue) => {
                        this._updateVector2(field.parameter,
                            this._texture[field.parameter], newValue, true);
                    },
                    'getFromSource': () => {
                        return this._texture[field.parameter].toArray();
                    },
                });
            } else if(field.type == EnumInput) {
                menuFieldsMap[field.parameter] = new EnumInput({
                    'title': field.name,
                    'initialValue':
                        field.reverseMap[this._texture[field.parameter]],
                    'getFromSource': () => {
                        return field.reverseMap[this._texture[field.parameter]];
                    },
                    'onUpdate': (v) => {
                        this._updateEnum(field.parameter, field.map[v]);
                    },
                    'options': field.options,
                });
            }
        }
        return menuFieldsMap;
    }
}

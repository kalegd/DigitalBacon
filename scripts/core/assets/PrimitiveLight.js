/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Asset from '/scripts/core/assets/Asset.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import UndoRedoHandler from '/scripts/core/handlers/UndoRedoHandler.js';
import ColorInput from '/scripts/core/menu/input/ColorInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import { Colors } from '/scripts/core/helpers/constants.js';
import { numberOr, fullDispose } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

export default class PrimitiveLight extends Asset {
    constructor(params = {}) {
        super(params);
        this._color = numberOr(params['color'], 0xffffff);
        this._intensity = numberOr(params['intensity'], 1);
    }

    _updateColorParameter(param, oldValue, newValue, ignoreUndoRedo,
                          ignorePublish)
    {
        let currentValue = this._light[param].getHex();
        if(currentValue != newValue) {
            this._light[param].setHex(newValue);
            if(!ignorePublish)
                PubSub.publish(this._id, PubSubTopics.INSTANCE_UPDATED, this);
        }
        if(!ignoreUndoRedo && oldValue != newValue) {
            UndoRedoHandler.addAction(() => {
                this._updateColorParameter(param, null, oldValue, true,
                    ignorePublish);
                this._updateMenuField(param);
            }, () => {
                this._updateColorParameter(param, null, newValue, true,
                    ignorePublish);
                this._updateMenuField(param);
            });
        }
    }

    _updateLightParameter(param, oldValue, newValue, ignoreUndoRedo,
                          ignorePublish)
    {
        let currentValue = this['_' + param];
        if(currentValue != newValue) {
            this['_' + param] = newValue;
            this._light[param] = newValue;
            if(!ignorePublish)
                PubSub.publish(this._id, PubSubTopics.INSTANCE_UPDATED, this);
        }
        if(!ignoreUndoRedo && oldValue != newValue) {
            UndoRedoHandler.addAction(() => {
                this._updateLightParameter(param, null, oldValue, true,
                    ignorePublish);
                this._updateMenuField(param);
            }, () => {
                this._updateLightParameter(param, null, newValue, true,
                    ignorePublish);
                this._updateMenuField(param);
            });
        }
    }

    _updateVisualEdit(isVisualEdit) {
        if(isVisualEdit) {
            this._object.add(this._mesh);
        } else {
            this._object.remove(this._mesh);
            fullDispose(this._mesh);
        }
        super._updateVisualEdit(isVisualEdit);
    }

    clone(visualEditOverride) {
        let params = this._fetchCloneParams(visualEditOverride);
        return ProjectHandler.addLight(params, this._assetId);
    }

    exportParams() {
        let params = super.exportParams();
        params['color'] = this._light.color.getHex();
        params['intensity'] = this._intensity;
        return params;
    }

    _getMenuFieldsMap() {
        let menuFieldsMap = super._getMenuFieldsMap();
        menuFieldsMap['color'] = new ColorInput({
            'title': 'Color',
            'initialValue': this._light.color.getHex(),
            'onBlur': (oldValue, newValue) => {
                this._updateColorParameter('color', oldValue, newValue);
            },
            'onUpdate': (newValue) => {
                this._updateColorParameter('color', this._light.color.getHex(),
                    newValue, true);
            },
            'getFromSource': () => { return this._light.color.getHex(); },
        });
        menuFieldsMap['intensity'] = this._createLightNumberInput({
            'name': 'Intensity',
            'parameter': 'intensity',
            'min': 0,
        });
        return menuFieldsMap;
    }

    _createLightNumberInput(field) {
        return new NumberInput({
            'title': field.name,
            'minValue': field.min,
            'maxValue': field.max,
            'initialValue': this['_' + field.parameter],
            'onBlur': (oldValue, newValue) => {
                this._updateLightParameter(field.parameter, oldValue, newValue);
            },
            'onUpdate': (newValue) => {
                this._updateLightParameter(field.parameter,
                    this['_' + field.parameter], newValue, true);
            },
            'getFromSource': () => { return this['_' + field.parameter]; },
        });
    }

}

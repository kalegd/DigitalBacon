/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Asset from '/scripts/core/assets/Asset.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import ColorInput from '/scripts/core/menu/input/ColorInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import { Colors } from '/scripts/core/helpers/constants.js';
import { fullDispose } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

const ASSET_ID = '7605bff2-8ca3-4a47-b6f7-311d745507de';
const ASSET_NAME = 'Ambient Light';
const FIELDS = [
    { "name": "Edit Visually" },
    { "name": "Color", "parameter": "color", "type": ColorInput },
    { "name": "Intensity", "parameter": "_intensity", "min": 0,
        "type": NumberInput },
    { "name": "Position" },
    { "name": "Rotation" },
    { "name": "Scale" },
];

export default class PrimitiveAmbientLight extends Asset {
    constructor(params = {}) {
        super(params);
        this._assetId = ASSET_ID;
        this._color = params['color'] || 0xffffff;
        this._intensity = params['intensity'] || 1;
        this._createMesh();
        if(params['isPreview']) this.makeTranslucent();
    }

    _createMesh() {
        this._light = new THREE.AmbientLight(this._color, this._intensity);
        this._object.add(this._light);

        let geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        let material = new THREE.MeshBasicMaterial({ color: Colors.yellow });
        this._mesh = new THREE.Mesh(geometry, material);
        if(this.enableInteractables) this._object.add(this._mesh);
    }

    _updateLight() {
        this._light.intensity = this._intensity;
    }

    _updateInteractable(isInteractable) {
        if(isInteractable) {
            this._object.add(this._mesh);
        } else {
            this._object.remove(this._mesh);
            fullDispose(this._mesh);
        }
        super._updateInteractable(isInteractable);
    }

    place(intersection) {
        //TODO: Depenetrate from the face using normal and bounding box
        super.place(intersection);
    }

    clone(enableInteractablesOverride) {
        let params = this._fetchCloneParams(enableInteractablesOverride);
        let instance = new PrimitiveAmbientLight(params);
        return ProjectHandler.addPrimitive(instance);
    }

    exportParams() {
        let params = super.exportParams();
        params['color'] = this._light.color.getHex();
        params['intensity'] = this._intensity;
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
            } else if(field.type == NumberInput) {
                menuFieldsMap[field.name] = new NumberInput({
                    'title': field.name,
                    'minValue': field.min,
                    'maxValue': field.max,
                    'initialValue': this[field.parameter],
                    'setToSource': (value) => {
                        this[field.parameter] = value;
                        this._updateLight();
                    },
                    'getFromSource': () => { return this[field.parameter]; },
                });
            } else if(field.type == ColorInput) {
                menuFieldsMap[field.name] = new ColorInput({
                    'title': 'Color',
                    'initialValue': this._light.color,
                    'onUpdate': (color) => {
                        this._light.color.set(color);
                    }
                });
            }
        }
        return menuFieldsMap;
    }

}

ProjectHandler.registerLight(PrimitiveAmbientLight, ASSET_ID, ASSET_NAME);

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

const ASSET_ID = '944a6b29-05d2-47d9-9b33-60e7a3e18b7d';
const ASSET_NAME = 'Basic Light';
const FIELDS = [
    { "name": "Edit Visually" },
    { "name": "Color", "parameter": "color", "type": ColorInput },
    { "name": "Intensity", "parameter": "_intensity", "min": 0,
        "type": NumberInput },
    { "name": "Distance", "parameter": "_distance", "min": 0,
        "type": NumberInput },
    { "name": "Decay", "parameter": "_decay", "min": 0,
        "type": NumberInput },
    { "name": "Position" },
    { "name": "Rotation" },
    { "name": "Scale" },
];

export default class PrimitivePointLight extends Asset {
    constructor(params = {}) {
        super(params);
        this._assetId = ASSET_ID;
        this._color = params['color'] || 0xffffff;
        this._intensity = params['intensity'] || 1;
        this._distance = params['distance'] || 0;
        this._decay = params['decay'] || 1;
        this._createMesh();
        if(params['isPreview']) this.makeTranslucent();
    }

    _createMesh() {
        this._light = new THREE.PointLight(this._color, this._intensity,
            this._distance, this._decay);
        this._object.add(this._light);

        let geometry = new THREE.SphereGeometry(0.07);
        let material = new THREE.MeshBasicMaterial({ color: Colors.yellow });
        this._mesh = new THREE.Mesh(geometry, material);
        if(this.enableInteractables) this._object.add(this._mesh);
    }

    _updateLight() {
        this._light.intensity = this._intensity;
        this._light.distance = this._distance;
        this._light.decay = this._decay;
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
        let instance = new PrimitivePointLight(params);
        return ProjectHandler.addPrimitive(instance);
    }

    exportParams() {
        let params = super.exportParams();
        params['color'] = this._light.color.getHex();
        params['intensity'] = this._intensity;
        params['distance'] = this._distance;
        params['decay'] = this._decay;
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

ProjectHandler.registerLight(PrimitivePointLight, ASSET_ID, ASSET_NAME);

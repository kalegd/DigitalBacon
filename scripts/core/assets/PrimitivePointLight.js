/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PrimitiveLight from '/scripts/core/assets/PrimitiveLight.js';
import ProjectHandler from '/scripts/core/handlers/ProjectHandler.js';
import ColorInput from '/scripts/core/menu/input/ColorInput.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import { Colors } from '/scripts/core/helpers/constants.js';
import { numberOr, fullDispose } from '/scripts/core/helpers/utils.module.js';
import * as THREE from 'three';

const ASSET_ID = '944a6b29-05d2-47d9-9b33-60e7a3e18b7d';
const ASSET_NAME = 'Basic Light';
const FIELDS = [
    { "parameter": "visualEdit" },
    { "parameter": "color" },
    { "parameter": "intensity" },
    { "parameter": "distance", "name": "Distance", "min": 0,
        "type": NumberInput },
    { "parameter": "decay", "name": "Decay", "min": 0,
        "type": NumberInput },
    { "parameter": "position" },
    { "parameter": "rotation" },
    { "parameter": "scale" },
];

export default class PrimitivePointLight extends PrimitiveLight {
    constructor(params = {}) {
        super(params);
        this._assetId = ASSET_ID;
        this._distance = numberOr(params['distance'], 0);
        this._decay = numberOr(params['decay'], 1);
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
        if(this.visualEdit) this._object.add(this._mesh);
    }

    _updateLight() {
        super._updateLight();
        this._light.distance = this._distance;
        this._light.decay = this._decay;
    }

    exportParams() {
        let params = super.exportParams();
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
            if(field.parameter in menuFieldsMap) {
                continue;
            } else if(field.type == NumberInput) {
                menuFieldsMap[field.parameter] = this._createLightNumberInput(field);
            }
        }
        return menuFieldsMap;
    }

}

ProjectHandler.registerLight(PrimitivePointLight, ASSET_ID, ASSET_NAME);

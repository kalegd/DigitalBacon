/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import PrimitivePointLight from '/scripts/core/assets/primitives/PrimitivePointLight.js';
import { Colors } from '/scripts/core/helpers/constants.js';
import EditorHelperFactory from '/scripts/core/helpers/editor/EditorHelperFactory.js';
import PrimitiveLightHelper from '/scripts/core/helpers/editor/PrimitiveLightHelper.js';
import NumberInput from '/scripts/core/menu/input/NumberInput.js';
import * as THREE from 'three';

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

export default class PrimitivePointLightHelper extends PrimitiveLightHelper {
    constructor(asset) {
        super(asset);
    }

    _createMesh() {
        let geometry = new THREE.SphereGeometry(0.07);
        let material = new THREE.MeshBasicMaterial({ color: Colors.yellow });
        this._mesh = new THREE.Mesh(geometry, material);
        if(this._asset.visualEdit) this._object.add(this._mesh);
    }

    getMenuFields() {
        return super.getMenuFields(FIELDS);
    }

    _getMenuFieldsMap() {
        let menuFieldsMap = super._getMenuFieldsMap();
        for(let field of FIELDS) {
            if(field.parameter in menuFieldsMap) {
                continue;
            } else {
                let input = this._createStandardInput(field);
                if(input) menuFieldsMap[field.parameter] = input;
            }
        }
        return menuFieldsMap;
    }
}

EditorHelperFactory.registerEditorHelper(PrimitivePointLightHelper, PrimitivePointLight);

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Colors } from '/scripts/core/helpers/constants.js';
import PrimitiveLightHelper from '/scripts/core/helpers/editor/PrimitiveLightHelper.js';
import * as THREE from 'three';

const FIELDS = [
    { "parameter": "visualEdit" },
    { "parameter": "intensity" },
    { "parameter": "color" },
    { "parameter": "position" },
    { "parameter": "rotation" },
    { "parameter": "scale" },
];

export default class PrimitiveAmbientLightHelper extends PrimitiveLightHelper {
    constructor(asset) {
        super(asset);
    }

    _createMesh() {
        let geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        let material = new THREE.MeshBasicMaterial({ color: Colors.yellow });
        this._mesh = new THREE.Mesh(geometry, material);
        if(this._asset.visualEdit) this._object.add(this._mesh);
    }

    getMenuFields() {
        return super.getMenuFields(FIELDS);
    }
}
